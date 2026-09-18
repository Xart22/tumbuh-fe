import type { Metadata } from 'next';
import { AuthGate } from '@/components/auth-gate';
import { AppNav } from '@/components/app-nav';

export const metadata: Metadata = { title: 'Laporan Backoffice · Tumbuh POS' };

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col">
        <AppNav />
        <div className="flex-1">{children}</div>
      </div>
    </AuthGate>
  );
}
