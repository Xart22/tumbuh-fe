import type { Metadata } from 'next';
import { AuthGate } from '@/components/auth-gate';
import { OutletBootstrap } from '@/components/outlet-bootstrap';
import { jetbrainsMono, plusJakarta } from '@/lib/fonts';
import { OwnerShell } from './dashboard/owner-shell';

export const metadata: Metadata = { title: 'Backoffice · Tumbuh POS' };

/** Auth + shared owner chrome. Pages render only their content. */
export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate requireOutlet={false}>
      <OutletBootstrap>
        <div className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
          <OwnerShell>{children}</OwnerShell>
        </div>
      </OutletBootstrap>
    </AuthGate>
  );
}
