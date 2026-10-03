'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listMyOutlets } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Owner/manager sessions carry no outlet scope, but every report and POS call
 * needs a valid `X-Outlet-Id`. Pick the tenant's first outlet before rendering.
 * ponytail: first outlet only. Add a picker when multi-outlet owners ask.
 */
export function OutletBootstrap({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const outletId = useAuthStore((s) => s.outletId);
  const selectOutlet = useAuthStore((s) => s.selectOutlet);

  const needsOutlet = Boolean(user) && !outletId;
  const { data, isError } = useQuery({
    queryKey: ['outlets', 'me'],
    queryFn: listMyOutlets,
    enabled: needsOutlet,
  });

  useEffect(() => {
    const first = data?.[0];
    if (!needsOutlet || !first) return;
    selectOutlet(first.id, first.name);
  }, [needsOutlet, data, selectOutlet]);

  if (needsOutlet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lp-background text-sm text-lp-on-surface-variant">
        {isError ? 'Tidak dapat memuat daftar outlet.' : 'Memuat outlet…'}
      </div>
    );
  }

  return <>{children}</>;
}
