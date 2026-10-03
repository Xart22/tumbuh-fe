'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Card, Field, Input } from '@/components/pos-ui';
import { listMyOutlets, type WorkspaceOption } from '@/lib/api';
import { routeForRole, roleNeedsOutlet } from '@/lib/login-routing';
import type { Outlet } from '@/lib/types';
import { useAuthStore, WorkspaceChoiceRequired } from '@/stores/auth-store';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi.').email('Email yang valid wajib diisi.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const loginOwner = useAuthStore((s) => s.loginOwner);
  const selectOutlet = useAuthStore((s) => s.selectOutlet);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    mode: 'onTouched',
    resolver: zodResolver(loginSchema),
  });

  const [workspaces, setWorkspaces] = useState<WorkspaceOption[] | null>(null);
  const [pickedSlug, setPickedSlug] = useState('');
  const [outlets, setOutlets] = useState<Outlet[] | null>(null);
  const [pickedOutlet, setPickedOutlet] = useState('');

  // The BE resolves the workspace from the email; `slug` is only needed once a
  // multi-workspace account has chosen one.
  async function authenticate(slug?: string) {
    clearErrors('root.server');
    try {
      await loginOwner(getValues('email').trim(), getValues('password'), slug);
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
        setWorkspaces(err.workspaces);
        setPickedSlug(err.workspaces[0]?.slug ?? '');
        return;
      }
      setError('root.server', {
        message: err instanceof Error ? err.message : 'Login gagal.',
      });
    }
  }

  const onSubmit = handleSubmit(() =>
    authenticate(workspaces ? pickedSlug : undefined),
  );

  // Step 2: several outlets — pick one to start.
  if (outlets) {
    return (
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-ink">Pilih Outlet</h1>
        <p className="mt-1 text-sm text-muted">
          Akun ini terdaftar di beberapa outlet. Pilih satu untuk mulai bekerja.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Outlet">
            <select
              value={pickedOutlet}
              onChange={(e) => setPickedOutlet(e.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-sm text-ink outline-none focus:border-teal-600"
            >
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </Field>
          <Button
            onClick={() => {
              const outlet = outlets.find((o) => o.id === pickedOutlet);
              if (!outlet) return;
              selectOutlet(outlet.id, outlet.name);
              router.replace(routeForRole(useAuthStore.getState().user?.role));
            }}
            disabled={!pickedOutlet}
          >
            Mulai Bekerja
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">Masuk</h1>
        <p className="mt-1 text-sm text-muted">
          Masuk dengan akun email Anda. Outlet dipilih setelah verifikasi.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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

        {workspaces && (
          <Field label="Workspace">
            <select
              value={pickedSlug}
              onChange={(e) => setPickedSlug(e.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-sm text-ink outline-none focus:border-teal-600"
            >
              {workspaces.map((ws) => (
                <option key={ws.slug} value={ws.slug}>
                  {ws.name} ({ws.slug})
                </option>
              ))}
            </select>
          </Field>
        )}

        {errors.root?.server && (
          <Alert kind="error">{errors.root.server.message}</Alert>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Memeriksa…' : workspaces ? 'Masuk ke Workspace' : 'Masuk'}
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
