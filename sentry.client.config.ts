import * as Sentry from '@sentry/nextjs';
import { setErrorReporter } from '@/lib/api-client';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  // No DSN in .env.local? SDK stays dormant — zero behavior change.
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

// API-layer observability: only transport/server failures are reported,
// never 401s (session flow) or 4xx validation noise.
setErrorReporter((err, info) => {
  Sentry.captureException(err, {
    tags: { api_path: info.path, api_method: info.method },
    extra: { status: err.status, code: err.code },
  });
});
