'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Card, Field, Input } from '@/components/pos-ui';
import type { Outlet } from '@/lib/types';
import { useAuthStore, fetchPublicStore } from '@/stores/auth-store';

const pinSchema = z.object({
  mode: z.literal('pin'),
  outletId: z.string().min(1, 'Pilih outlet dulu.'),
  pin: z.string().min(1, 'PIN wajib diisi.').min(4, 'PIN minimal 4 digit.'),
  email: z.string().optional(),
  password: z.string().optional(),
});

const emailSchema = z.object({
  mode: z.literal('email'),
  outletId: z.string().min(1, 'Pilih outlet dulu.'),
  pin: z.string().optional(),
  email: z.string().trim().min(1, 'Email wajib diisi.').email('Email yang valid wajib diisi.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

const loginSchema = z.discriminatedUnion('mode', [pinSchema, emailSchema]);

type LoginValues = z.infer<typeof loginSchema>;
type LoginMode = LoginValues['mode'];

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loginEmail = useAuthStore((s) => s.loginEmail);
  const tenantSlug = useAuthStore((s) => s.tenantSlug);
  const setTenantSlug = useAuthStore((s) => s.setTenantSlug);
  const selectOutlet = useAuthStore((s) => s.selectOutlet);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    mode: 'onTouched',
    resolver: zodResolver(loginSchema),
    defaultValues: { mode: 'pin', outletId: '', pin: '', email: '', password: '' },
  });

  const [authMode, setAuthMode] = useState<LoginMode>('pin');

  const [slug, setSlug] = useState(tenantSlug);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // /v1/outlets needs a JWT, so the login screen reads the public storefront
  // for its outlet list instead.
  useEffect(() => {
    let cancelled = false;
    const workspace = tenantSlug.trim();
    if (!workspace) return;

    fetchPublicStore(workspace)
      .then((store) => {
        if (cancelled) return;
        setBusinessName(store.name);
        setOutlets(store.outlets);
        const current = getValues('outletId');
        setValue(
          'outletId',
          store.outlets.some((o) => o.id === current)
            ? current
            : (store.outlets[0]?.id ?? ''),
        );
        clearErrors('root.server');
      })
      .catch(() => {
        if (cancelled) return;
        setBusinessName(null);
        setOutlets([]);
        setError('root.server', {
          message: `Workspace "${workspace}" tidak ditemukan.`,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSlug, reloadNonce, getValues, setValue, setError, clearErrors]);

  function searchWorkspace() {
    const next = slug.trim();
    if (!next) return;
    setLoading(true);
    setTenantSlug(next);
    setReloadNonce((n) => n + 1);
  }

  const onSubmit = handleSubmit(async (values) => {
    clearErrors('root.server');
    try {
      setTenantSlug(slug.trim());
      if (values.mode === 'email') {
        await loginEmail(values.outletId, values.email, values.password);
      } else {
        await login(values.outletId, values.pin ?? '');
      }
      selectOutlet(
        values.outletId,
        outlets.find((o) => o.id === values.outletId)?.name ?? '',
      );
      router.replace(
        useAuthStore.getState().user?.role === 'staff' ? '/absen' : '/pos',
      );
    } catch (err) {
      setError('root.server', {
        message: err instanceof Error ? err.message : 'Login gagal.',
      });
      if (values.mode === 'email') setValue('password', '');
      else setValue('pin', '');
    }
  });

  function switchMode(next: LoginMode) {
    setAuthMode(next);
    setValue('mode', next, { shouldValidate: true });
    clearErrors('root.server');
  }

  return (
    <Card className="w-full max-w-sm">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">
          {businessName ?? 'Masuk Kasir'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pilih outlet, lalu masuk dengan PIN atau akun email.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--panel-2)] p-1" role="tablist" aria-label="Metode masuk">
        {(
          [
            { id: 'pin', label: 'PIN Kasir' },
            { id: 'email', label: 'Email' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={authMode === tab.id}
            onClick={() => switchMode(tab.id)}
            className={`h-11 rounded-lg text-sm font-bold transition ${
              authMode === tab.id
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Workspace">
          <div className="flex gap-2">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="kopikita"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={searchWorkspace}
              disabled={loading}
            >
              {loading ? '…' : 'Cari'}
            </Button>
          </div>
        </Field>

        <Field label="Outlet">
          <select
            {...register('outletId')}
            aria-invalid={!!errors.outletId}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-sm text-ink outline-none focus:border-teal-600"
          >
            {outlets.length === 0 && <option value="">Tidak ada outlet</option>}
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
          {errors.outletId && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-400">
              {errors.outletId.message}
            </p>
          )}
        </Field>

        {authMode === 'pin' ? (
          <Field label="PIN Kasir">
            <Input
              {...register('pin')}
              onChange={(e) =>
                setValue('pin', e.target.value.replace(/\D/g, ''), {
                  shouldValidate: true,
                  shouldTouch: true,
                })
              }
              inputMode="numeric"
              type="password"
              maxLength={8}
              placeholder="••••"
              autoFocus
              aria-invalid={!!errors.pin}
            />
            {errors.pin && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-400">
                {errors.pin.message}
              </p>
            )}
          </Field>
        ) : (
          <>
            <Field label="Email">
              <Input
                {...register('email')}
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="nama@email.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-400">
                  {errors.email.message}
                </p>
              )}
            </Field>
            <Field label="Kata Sandi">
              <Input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="Kata sandi akun"
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-400">
                  {errors.password.message}
                </p>
              )}
            </Field>
            <p className="-mt-2 text-xs text-muted">
              Lupa sandi? Atur ulang lewat{' '}
              <Link href="/lupa-password" className="font-medium text-teal-500 hover:underline">
                Lupa Password
              </Link>
              .
            </p>
          </>
        )}

        {errors.root?.server && (
          <Alert kind="error">{errors.root.server.message}</Alert>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Memeriksa…' : 'Masuk'}
        </Button>

        <p className="text-center text-sm text-muted">
          Belum punya akun usaha?{' '}
          <Link href="/register" className="font-medium text-teal-500 hover:underline">
            Daftar
          </Link>
        </p>
      </form>
    </Card>
  );
}
