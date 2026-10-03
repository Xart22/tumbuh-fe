'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { VerifyEmailForm } from '@/components/verify-email-form';
import { ApiError } from '@/lib/api-client';
import { listMyOutlets, type WorkspaceOption } from '@/lib/api';
import { routeForRole, roleNeedsOutlet } from '@/lib/login-routing';
import type { Outlet } from '@/lib/types';
import { useAuthStore, WorkspaceChoiceRequired } from '@/stores/auth-store';

export const ownerLoginSchema = z.object({
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
  const loginOwner = useAuthStore((s) => s.loginOwner);
  const selectOutlet = useAuthStore((s) => s.selectOutlet);
  const [showPassword, setShowPassword] = useState(false);
  const [options, setOptions] = useState<WorkspaceOption[] | null>(null);
  const [picked, setPicked] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<Outlet[] | null>(null);
  const [pickedOutlet, setPickedOutlet] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OwnerLoginValues>({
    mode: 'onTouched',
    resolver: zodResolver(ownerLoginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await loginOwner(values.email.trim(), values.password, picked || undefined);
      const role = useAuthStore.getState().user?.role;
      if (!roleNeedsOutlet(role)) {
        router.replace(routeForRole(role));
        return;
      }
      const mine = await listMyOutlets();
      if (mine.length === 0) {
        useAuthStore.getState().logout();
        setError('root.server', {
          message:
            'Akun ini belum ditugaskan ke outlet mana pun. Hubungi owner untuk penugasan outlet.',
        });
        return;
      }
      if (mine.length === 1) {
        selectOutlet(mine[0].id, mine[0].name);
        router.replace(routeForRole(role));
        return;
      }
      setOutlets(mine);
      setPickedOutlet(mine[0].id);
    } catch (err) {
      if (err instanceof WorkspaceChoiceRequired) {
        setOptions(err.workspaces);
        setPicked(err.workspaces[0]?.slug ?? '');
        return;
      }
      if (err instanceof ApiError && err.code === 'EMAILNOTVERIFIED') {
        setPendingEmail(values.email.trim());
        return;
      }
      setError('root.server', {
        message: err instanceof Error ? err.message : 'Login gagal.',
      });
    }
  });

  if (outlets) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-600">
          Akun ini terdaftar di beberapa outlet — pilih satu untuk mulai bekerja.
        </p>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Pilih outlet">
          {outlets.map((outlet) => (
            <label
              key={outlet.id}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border bg-white p-2.5 transition ${
                pickedOutlet === outlet.id
                  ? 'border-emerald-600 ring-1 ring-emerald-600/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="outlet-pick"
                value={outlet.id}
                checked={pickedOutlet === outlet.id}
                onChange={() => setPickedOutlet(outlet.id)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-900">{outlet.name}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={!pickedOutlet}
          onClick={() => {
            const outlet = outlets.find((o) => o.id === pickedOutlet);
            if (!outlet) return;
            selectOutlet(outlet.id, outlet.name);
            router.replace(routeForRole(useAuthStore.getState().user?.role));
          }}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Mulai Bekerja
          <Icon name="arrow_forward" className="text-base" />
        </button>
      </div>
    );
  }

  if (pendingEmail) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
          Email ini belum diverifikasi. Masukkan kode 6 digit yang dikirim ke inbox
          Anda, atau kirim ulang.
        </div>
        <VerifyEmailForm
          email={pendingEmail}
          onVerified={() => {
            setPendingEmail(null);
            // Credentials are still in the form — replay the login attempt.
            setTimeout(() => void onSubmit(), 60);
          }}
          onReset={() => setPendingEmail(null)}
        />
        <p className="text-center text-xs text-slate-500">
          Sudah verifikasi?{' '}
          <button
            type="button"
            onClick={() => setPendingEmail(null)}
            className="font-bold text-emerald-700 hover:underline"
          >
            Coba masuk lagi
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-1">
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
          <Link
            href="/lupa-password"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Lupa password?
          </Link>
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

      {options && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            Email ini terdaftar di {options.length} workspace — pilih satu:
          </p>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Pilih workspace">
            {options.map((ws) => (
              <label
                key={ws.slug}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border bg-white p-2.5 transition ${
                  picked === ws.slug
                    ? 'border-emerald-600 ring-1 ring-emerald-600/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="workspace-pick"
                  value={ws.slug}
                  checked={picked === ws.slug}
                  onChange={() => setPicked(ws.slug)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-left">
                  <span className="block text-xs font-bold text-slate-900">{ws.name}</span>
                  <span className="block font-mono text-[11px] text-slate-500">{ws.slug}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

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
          <span>{isSubmitting ? 'Memeriksa…' : options ? 'Masuk ke Workspace' : 'Masuk ke Dashboard Backoffice'}</span>
          <Icon name="arrow_forward" className="text-base" />
        </button>
      </div>
    </form>
  );
}
