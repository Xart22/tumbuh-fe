'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { useAuthStore } from '@/stores/auth-store';

export const ownerLoginSchema = z.object({
  workspace: z.string().trim().min(1, 'Workspace wajib diisi.'),
  email: z.string().trim().min(1, 'Email wajib diisi.').email('Email yang valid wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

type OwnerLoginValues = z.infer<typeof ownerLoginSchema>;

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

/** Owner credential fields + submit. Layout (card columns) lives in OwnerPanel. */
export function OwnerLoginForm() {
  const router = useRouter();
  const tenantSlug = useAuthStore((s) => s.tenantSlug);
  const setTenantSlug = useAuthStore((s) => s.setTenantSlug);
  const loginOwner = useAuthStore((s) => s.loginOwner);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OwnerLoginValues>({
    mode: 'onTouched',
    resolver: zodResolver(ownerLoginSchema),
    defaultValues: { workspace: tenantSlug, email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setTenantSlug(values.workspace.trim());
      await loginOwner(values.email.trim(), values.password);
      router.replace('/reports');
    } catch (err) {
      setError('root.server', {
        message: err instanceof Error ? err.message : 'Login gagal.',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-1">
      <div>
        <label htmlFor="owner-workspace" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
          Workspace
        </label>
        <div className="relative">
          <input
            id="owner-workspace"
            {...register('workspace')}
            placeholder="kopikita"
            autoComplete="off"
            aria-invalid={!!errors.workspace}
            className={inputCls}
          />
          <Icon
            name="store"
            className="pointer-events-none absolute right-3.5 top-3 text-[20px] text-slate-400"
          />
        </div>
        <FieldError message={errors.workspace?.message} />
      </div>

      <div>
        <label htmlFor="owner-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
          Email Bisnis
        </label>
        <div className="relative">
          <input
            id="owner-email"
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

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="owner-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Kata Sandi
          </label>
          <a
            href="https://wa.me/62811886284"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Lupa password?
          </a>
        </div>
        <div className="relative">
          <input
            id="owner-password"
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className={inputCls}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-2.5 flex items-center text-slate-400 hover:text-slate-600"
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
          </button>
        </div>
        <FieldError message={errors.password?.message} />
      </div>

      {errors.root?.server && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
          {errors.root.server.message}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSubmitting ? 'Memeriksa…' : 'Masuk ke Dashboard Backoffice'}</span>
          <Icon name="arrow_forward" className="text-base" />
        </button>
      </div>
    </form>
  );
}
