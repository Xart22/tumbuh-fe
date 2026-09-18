'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { resendVerification, verifyEmail } from '@/lib/api';

const RESEND_COOLDOWN_S = 60;

/**
 * Shared email-OTP step: used after register and when login reports an
 * unverified inbox. Self-contained: code entry, verify, resend w/ cooldown.
 */
export function VerifyEmailForm({
  email,
  onVerified,
  onReset,
}: {
  email: string;
  onVerified: (slug: string) => void;
  onReset?: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (code.trim().length < 6) {
      setError('Masukkan 6 digit kode dari email.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await verifyEmail({ email, code: code.trim() });
      onVerified(res.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verifikasi gagal.');
      setCode('');
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    setError(null);
    try {
      await resendVerification(email);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 429
          ? 'Terlalu sering. Tunggu sebentar lalu coba lagi.'
          : 'Gagal mengirim ulang. Coba lagi.';
      setError(message);
    }
  }

  return (
    <div className="w-full">
      <p className="text-sm text-slate-600">
        Kode 6 digit dikirim ke <span className="font-mono font-bold text-slate-900">{email}</span>.
        Berlaku 15 menit.
      </p>
      <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          aria-label="Kode verifikasi 6 digit"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-center font-mono text-xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
        />
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={verifying}
          className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {verifying ? 'Memeriksa…' : 'Verifikasi Email'}
        </button>
      </form>
      <div className="mt-3 flex items-center justify-center gap-3 text-xs text-slate-500">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-bold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
        >
          {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang kode'}
        </button>
        {onReset && (
          <>
            <span aria-hidden="true">•</span>
            <button type="button" onClick={onReset} className="font-medium hover:underline">
              Ganti email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
