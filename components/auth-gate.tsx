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
 *
 * Two session shapes: kasir (token + outlet) and owner (token + user, no
 * outlet). POS requires the outlet scope; backoffice only needs a session.
 */
export function AuthGate({
  children,
  requireAuth = true,
  requireOutlet = true,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOutlet?: boolean;
}) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const outletId = useAuthStore((s) => s.outletId);
  const user = useAuthStore((s) => s.user);
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

  const session = Boolean(token && user);
  const outletOk = Boolean(outletId);
  const allowed = !requireAuth || (session && (!requireOutlet || outletOk));

  useEffect(() => {
    if (!hydrated) return;
    if (!allowed) router.replace('/login');
    else if (!requireAuth && session) {
      router.replace(outletOk ? '/pos' : '/reports');
    }
  }, [hydrated, allowed, session, outletOk, requireAuth, router]);

  if (!hydrated) return <Splash label="Memuat…" />;
  if (!allowed) {
    return <Splash label="Mengalihkan ke login…" />;
  }
  if (!requireAuth && session) {
    return <Splash label="Mengalihkan…" />;
  }

  return <>{children}</>;
}
