'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Card, Field, Input, Spinner } from '@/components/pos-ui';
import { acceptEmployeeInvite } from '@/lib/api';
import type { Outlet } from '@/lib/types';
import { fetchPublicStore, useAuthStore } from '@/stores/auth-store';

export const acceptSchema = z
  .object({
    name: z.string().trim().max(255, 'Nama maksimal 255 karakter.').optional(),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.').max(200, 'Maksimal 200 karakter.'),
    confirm: z.string().min(1, 'Ulangi kata sandi.'),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Konfirmasi tidak sama.',
    path: ['confirm'],
  });

type AcceptValues = z.infer<typeof acceptSchema>;

export function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const ws = params.get('ws') ?? '';

  const adoptSession = useAuthStore((s) => s.adoptSession);
  const setTenantSlug = useAuthStore((s) => s.setTenantSlug);
  const selectOutlet = useAuthStore((s) => s.selectOutlet);

  const [outlets, setOutlets] = useState<Outlet[] | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [picked, setPicked] = useState('');
  const [loadingOutlets, setLoadingOutlets] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AcceptValues>({
    mode: 'onTouched',
    resolver: zodResolver(acceptSchema),
  });

  if (!token || !ws) {
    return (
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-ink">Undangan tidak valid</h1>
        <p className="mt-1 text-sm text-muted">
          Tautan undangan tidak lengkap. Minta owner mengirim ulang undangan
          dari halaman Karyawan.
        </p>
        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/kasir" className="font-medium text-teal-500 hover:underline">
            Ke halaman masuk
          </Link>
        </p>
      </Card>
    );
  }

  const onAccept = handleSubmit(async (values) => {
    try {
      const slug = ws.trim().toLowerCase();
      const result = await acceptEmployeeInvite({
        tenantSlug: slug,
        token,
        password: values.password,
        name: values.name?.trim() || undefined,
      });
      setTenantSlug(slug);
      adoptSession(result);
      setLoadingOutlets(true);
      const store = await fetchPublicStore(slug);
      setBusinessName(store.name);
      setOutlets(store.outlets);
      setPicked(store.outlets[0]?.id ?? '');
    } catch (err) {
      setError('root.server', {
        message: err instanceof Error ? err.message : 'Gagal menerima undangan.',
      });
    } finally {
      setLoadingOutlets(false);
    }
  });

  function finish() {
    if (!picked) return;
    selectOutlet(picked, outlets?.find((o) => o.id === picked)?.name ?? '');
    router.replace(
      useAuthStore.getState().user?.role === 'staff' ? '/absen' : '/pos',
    );
  }

  // Step 2: session adopted — pick an outlet to start working.
  if (outlets) {
    return (
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-ink">Akun aktif!</h1>
        <p className="mt-1 text-sm text-muted">
          {businessName ?? 'Workspace'} · pilih outlet untuk mulai bekerja.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Outlet">
            <select
              value={picked}
              onChange={(e) => setPicked(e.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-sm text-ink outline-none focus:border-teal-600"
            >
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </Field>
          <Button onClick={finish} disabled={!picked}>
            Mulai Bekerja
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="text-xl font-semibold text-ink">Terima Undangan</h1>
      <p className="mt-1 text-sm text-muted">
        Buat kata sandi untuk akun karyawan Anda di workspace{' '}
        <span className="font-mono font-semibold">{ws}</span>.
      </p>

      <form onSubmit={onAccept} noValidate className="mt-4 flex flex-col gap-4">
        <Field label="Nama (opsional)">
          <Input
            {...register('name')}
            autoComplete="name"
            placeholder="Nama tampilan"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-400">
              {errors.name.message}
            </p>
          )}
        </Field>
        <Field label="Kata Sandi Baru">
          <Input
            {...register('password')}
            type="password"
            autoComplete="new-password"
            autoFocus
            placeholder="Minimal 8 karakter"
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-400">
              {errors.password.message}
            </p>
          )}
        </Field>
        <Field label="Ulangi Kata Sandi">
          <Input
            {...register('confirm')}
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi kata sandi"
            aria-invalid={!!errors.confirm}
          />
          {errors.confirm && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-400">
              {errors.confirm.message}
            </p>
          )}
        </Field>

        {errors.root?.server && (
          <Alert kind="error">{errors.root.server.message}</Alert>
        )}

        <Button type="submit" disabled={isSubmitting || loadingOutlets}>
          {isSubmitting || loadingOutlets ? (
            <span className="flex items-center gap-2">
              <Spinner label="" /> Memproses…
            </span>
          ) : (
            'Aktifkan Akun'
          )}
        </Button>
      </form>
    </Card>
  );
}
