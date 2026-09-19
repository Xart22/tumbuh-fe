'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { ApiError } from '@/lib/api-client';
import { requestPasswordReset, resetPassword } from '@/lib/api';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi.')
    .email('Email yang valid wajib diisi.'),
});

export const resetPasswordSchema = z
  .object({
    code: z.string().trim().regex(/^\d{6}$/, 'Masukkan 6 digit kode dari email.'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
    confirm: z.string().min(1, 'Ulangi kata sandi baru.'),
  })
  .refine((values) => values.password === values.confirm, {
    path: ['confirm'],
    message: 'Konfirmasi kata sandi tidak cocok.',
  });

type ForgotValues = z.infer<typeof forgotPasswordSchema>;
type ResetValues = z.infer<typeof resetPasswordSchema>;

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-11 text-sm font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/20';

function FieldError({ message }: { message?: string }) {
  return (
    <div className="min-h-4">
      {message && (
        <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Two-step reset: request a code by email, then set a new password. Codes are
 * 6-digit and valid for 15 minutes (matches the rest of the auth flow).
 */
export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');

  if (step === 'done') {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
          Kata sandi berhasil diperbarui. Semua perangkat lain sudah keluar.
        </div>
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          Masuk ke Dashboard
          <Icon name="arrow_forward" className="text-base" />
        </Link>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <ResetCodeForm
        email={email}
        onChangeEmail={() => setStep('email')}
        onDone={() => setStep('done')}
      />
    );
  }

  return (
    <EmailStepForm
      onSent={(value) => {
        setEmail(value);
        setStep('reset');
      }}
    />
  );
}

function EmailStepForm({ onSent }: { onSent: (email: string) => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    mode: 'onTouched',
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Always succeeds server-side; proceed regardless of account existence.
      await requestPasswordReset(values.email.trim());
      onSent(values.email.trim());
    } catch (err) {
      setError('root.server', {
        message: err instanceof Error ? err.message : 'Gagal mengirim kode.',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-1">
      <p className="text-sm text-slate-500">
        Masukkan email terdaftar. Kami kirim kode 6 digit untuk membuat kata
        sandi baru.
      </p>

      <div className="pt-3">
        <label
          htmlFor="reset-email"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Email Terdaftar
        </label>
        <div className="relative">
          <input
            id="reset-email"
            {...register('email')}
            type="email"
            placeholder="nama@restoran.com"
            autoComplete="email"
            autoFocus
            aria-invalid={!!errors.email}
            className={inputCls}
          />
          <Icon
            name="alternate_email"
            className="pointer-events-none absolute right-3.5 top-3 text-[20px] text-slate-400"
          />
        </div>
        <FieldError message={errors.email?.message} />
      </div>

      {errors.root?.server && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
        >
          {errors.root.server.message}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSubmitting ? 'Mengirim…' : 'Kirim Kode Reset'}</span>
          <Icon name="arrow_forward" className="text-base" />
        </button>
      </div>
    </form>
  );
}

const RESEND_COOLDOWN_S = 60;

function ResetCodeForm({
  email,
  onChangeEmail,
  onDone,
}: {
  email: string;
  onChangeEmail: () => void;
  onDone: () => void;
}) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [resent, setResent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    mode: 'onTouched',
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    if (cooldown > 0) return;
    try {
      await requestPasswordReset(email);
      setResent(true);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError('root.server', {
        message:
          err instanceof ApiError && err.status === 429
            ? 'Terlalu sering. Tunggu sebentar lalu coba lagi.'
            : 'Gagal mengirim ulang kode.',
      });
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await resetPassword({
        email,
        code: values.code.trim(),
        newPassword: values.password,
      });
      onDone();
    } catch (err) {
      setError('root.server', {
        message: err instanceof Error ? err.message : 'Reset gagal.',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-1">
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3">
        <Icon name="mark_email_read" className="text-[20px] text-emerald-700" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-emerald-800">
            Kode dikirim ke{' '}
            <span className="font-mono">{email}</span>
          </p>
          <p className="text-[11px] text-emerald-700">
            Berlaku 15 menit. Cek juga folder Spam/Promotions.
          </p>
        </div>
      </div>

      <div className="pt-3">
        <label
          htmlFor="reset-code"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Kode Reset 6 Digit
        </label>
        <input
          id="reset-code"
          {...register('code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          aria-invalid={!!errors.code}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-center font-mono text-xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 aria-[invalid=true]:border-rose-400"
        />
        <FieldError message={errors.code?.message} />
      </div>

      <div>
        <label
          htmlFor="reset-password"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Kata Sandi Baru
        </label>
        <input
          id="reset-password"
          {...register('password')}
          type="password"
          placeholder="Minimal 8 karakter"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          className={inputCls}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div>
        <label
          htmlFor="reset-confirm"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Ulangi Kata Sandi Baru
        </label>
        <input
          id="reset-confirm"
          {...register('confirm')}
          type="password"
          placeholder="Ulangi kata sandi baru"
          autoComplete="new-password"
          aria-invalid={!!errors.confirm}
          className={inputCls}
        />
        <FieldError message={errors.confirm?.message} />
      </div>

      {errors.root?.server && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
        >
          {errors.root.server.message}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSubmitting ? 'Menyimpan…' : 'Simpan Kata Sandi Baru'}</span>
          <Icon name="check" className="text-base" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 pt-1 text-xs text-slate-500">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-bold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
        >
          {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang kode'}
        </button>
        <span aria-hidden="true">•</span>
        <button
          type="button"
          onClick={onChangeEmail}
          className="font-medium hover:underline"
        >
          Ganti email
        </button>
        {resent && <span className="text-emerald-700">terkirim</span>}
      </div>
    </form>
  );
}
