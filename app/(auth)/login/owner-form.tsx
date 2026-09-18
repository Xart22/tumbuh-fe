'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Card, Field, Input } from '@/components/pos-ui';
import { useAuthStore } from '@/stores/auth-store';

export const ownerLoginSchema = z.object({
  workspace: z.string().trim().min(1, 'Workspace wajib diisi.'),
  email: z.string().trim().min(1, 'Email wajib diisi.').email('Email yang valid wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

type OwnerLoginValues = z.infer<typeof ownerLoginSchema>;

export function OwnerForm() {
  const router = useRouter();
  const tenantSlug = useAuthStore((s) => s.tenantSlug);
  const setTenantSlug = useAuthStore((s) => s.setTenantSlug);
  const loginOwner = useAuthStore((s) => s.loginOwner);

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
    <Card className="w-full max-w-sm">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">Masuk Backoffice</h1>
        <p className="mt-1 text-sm text-muted">
          Owner &amp; manager — kelola laporan dan operasional.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Workspace">
          <Input
            {...register('workspace')}
            placeholder="kopikita"
            autoComplete="off"
            aria-invalid={!!errors.workspace}
          />
          {errors.workspace && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-400">
              {errors.workspace.message}
            </p>
          )}
        </Field>

        <Field label="Email">
          <Input
            {...register('email')}
            type="email"
            placeholder="owner@usaha.com"
            autoComplete="email"
            autoFocus
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-400">
              {errors.email.message}
            </p>
          )}
        </Field>

        <Field label="Password">
          <Input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-400">
              {errors.password.message}
            </p>
          )}
        </Field>

        {errors.root?.server && (
          <Alert kind="error">{errors.root.server.message}</Alert>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Memeriksa…' : 'Masuk'}
        </Button>
      </form>
    </Card>
  );
}
