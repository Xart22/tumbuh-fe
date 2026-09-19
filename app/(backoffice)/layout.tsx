import type { Metadata } from 'next';
import { AuthGate } from '@/components/auth-gate';
import { OutletBootstrap } from '@/components/outlet-bootstrap';

export const metadata: Metadata = { title: 'Backoffice · Tumbuh POS' };

/** Auth only: each page owns its chrome (dark POS nav vs light owner shell). */
export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate requireOutlet={false}>
      <OutletBootstrap>{children}</OutletBootstrap>
    </AuthGate>
  );
}
