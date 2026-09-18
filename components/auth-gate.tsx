'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

function Splash({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted">
      {label}
    </div>
  );
}

/**
 * Client-side guard. The token lives in localStorage, so the server cannot
 * know the session — redirecting in an effect is the only correct place.
 */
export function AuthGate({
  children,
  requireAuth = true,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const outletId = useAuthStore((s) => s.outletId);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // ponytail: one-shot timer covers the case where rehydration finished
    // before this effect ran; the subscription covers the case where it hasn't.
    const timer = setTimeout(() => {
      if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    }, 0);
    const unsubscribe = useAuthStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const authed = Boolean(token && outletId);

  useEffect(() => {
    if (!hydrated) return;
    if (requireAuth && !authed) router.replace('/login');
    if (!requireAuth && authed) router.replace('/pos');
  }, [hydrated, authed, requireAuth, router]);

  if (!hydrated) return <Splash label="Memuat…" />;
  if (requireAuth !== authed) {
    return <Splash label={requireAuth ? 'Mengalihkan ke login…' : 'Mengalihkan…'} />;
  }

  return <>{children}</>;
}
