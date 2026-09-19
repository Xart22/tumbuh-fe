const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = 'unknown',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code?: string; message?: string } };

/**
 * Auth context lives here (not read from the store) so the store can import
 * this module without a cycle. The store pushes updates via setAuthContext().
 */
let currentToken: string | null = null;
let currentOutletId: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthContext(
  token: string | null,
  outletId: string | null,
): void {
  currentToken = token;
  currentOutletId = outletId;
}

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export type ErrorReporter = (
  err: ApiError,
  info: { path: string; method: string },
) => void;

let errorReporter: ErrorReporter | null = null;

/** Permanent error observability hook (wired to Sentry when configured). */
export function setErrorReporter(reporter: ErrorReporter | null): void {
  errorReporter = reporter;
}

function report(err: ApiError, path: string, method: string): void {
  try {
    errorReporter?.(err, { path, method });
  } catch {
    // Reporting must never break the request itself.
  }
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  /** Multipart upload; takes precedence over `body` and skips JSON headers. */
  formData?: FormData;
  /** Adds the Idempotency-Key header; required by POST /orders and /payments. */
  idempotencyKey?: string;
  /** Extra headers (e.g. Idempotency-Key for onboarding retries). */
  headers?: Record<string, string>;
  /** Send the X-Outlet-Id header. Off only for tenant-wide routes. */
  outletScoped?: boolean;
  signal?: AbortSignal;
  /** Per-request timeout override. Retries never apply to non-GET. */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_GET_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function doFetch<T>(path: string, options: FetchOptions): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
  if (options.outletScoped !== false && currentOutletId) {
    headers['X-Outlet-Id'] = currentOutletId;
  }
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }
  if (options.formData === undefined && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const timeout = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;

  // FormData must set its own multipart boundary — never a JSON content-type.
  const requestBody =
    options.formData !== undefined
      ? options.formData
      : options.body === undefined
        ? undefined
        : JSON.stringify(options.body);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: requestBody,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError' && options.signal?.aborted) {
      throw new ApiError('Permintaan dibatalkan', 0, 'aborted');
    }
    throw new ApiError('Tidak dapat menghubungi server', 0, 'network_error');
  }

  if (response.status === 401) {
    unauthorizedHandler?.();
    throw new ApiError('Sesi berakhir, silakan login ulang', 401, 'unauthorized');
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  const envelope = parsed as Envelope<T> | null;

  if (!response.ok) {
    const message =
      envelope && envelope.success === false
        ? (envelope.error?.message ?? response.statusText)
        : response.statusText;
    const code =
      envelope && envelope.success === false
        ? (envelope.error?.code ?? 'error')
        : 'http_error';
    throw new ApiError(message || 'Permintaan gagal', response.status, code);
  }

  if (envelope && typeof envelope === 'object' && 'success' in envelope) {
    if (envelope.success === false) {
      throw new ApiError(
        envelope.error?.message ?? 'Permintaan gagal',
        response.status,
        envelope.error?.code ?? 'error',
      );
    }
    return envelope.data;
  }

  return parsed as T;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  // Retries are only safe for idempotent reads. Mutations rely on
  // idempotency keys server-side instead of client retries.
  const retryable = method === 'GET';
  let attempt = 0;

  for (;;) {
    try {
      return await doFetch<T>(path, options);
    } catch (err) {
      const apiErr =
        err instanceof ApiError ? err : new ApiError('Permintaan gagal', 0, 'unknown');
      // 401 drives the session flow, not observability — never reported.
      if (apiErr.status !== 401 && (apiErr.status === 0 || apiErr.status >= 500)) {
        report(apiErr, path, method);
      }
      const transient =
        apiErr.status === 0 ||
        apiErr.status === 429 ||
        apiErr.status >= 500;
      if (!retryable || !transient || attempt >= MAX_GET_RETRIES) {
        throw apiErr;
      }
      attempt += 1;
      await sleep(300 * 2 ** (attempt - 1) + Math.random() * 100);
    }
  }
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

/**
 * Raw (non-JSON) GET for CSV exports. `doFetch` always JSON-parses, so the
 * `@SkipEnvelope` text/csv routes need their own path. No retry: a download
 * failure surfaces to the user better than a silent double-read.
 */
export async function apiDownloadBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
  if (currentOutletId) headers['X-Outlet-Id'] = currentOutletId;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers,
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError('Tidak dapat menghubungi server', 0, 'network_error');
  }

  if (response.status === 401) {
    unauthorizedHandler?.();
    throw new ApiError('Sesi berakhir, silakan login ulang', 401, 'unauthorized');
  }
  if (!response.ok) {
    throw new ApiError('Gagal mengunduh berkas', response.status, 'http_error');
  }
  return response.blob();
}
