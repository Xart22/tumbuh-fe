import type { Metadata } from 'next';
import { jetbrainsMono, plusJakarta } from '@/lib/fonts';
import { DashboardView } from './dashboard-view';
import { OwnerShell } from './owner-shell';

export const metadata: Metadata = { title: 'Dashboard Utama · Tumbuh POS' };

export default function DashboardPage() {
  return (
    <div className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <OwnerShell>
        <DashboardView />
      </OwnerShell>
    </div>
  );
}
