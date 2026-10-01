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

const loginSchema = z.object({
  outletId: z.string().min(1, 'Pilih outlet dulu.'),
  pin: z.string().min(1, 'PIN wajib diisi.').min(4, 'PIN minimal 4 digit.'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
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
    defaultValues: { outletId: '', pin: '' },
  });

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
      await login(values.outletId, values.pin);
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
      setValue('pin', '');
    }
  });

  return (
    <Card className="w-full max-w-sm">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">
          {businessName ?? 'Masuk Kasir'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pilih outlet, lalu masukkan PIN kasir.
        </p>
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
