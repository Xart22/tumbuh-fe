import type { Metadata } from 'next';
import { AuthGate } from '@/components/auth-gate';
import { AppNav } from '@/components/app-nav';
import { plusJakarta, jetbrainsMono } from '@/lib/fonts';

export const metadata: Metadata = { title: 'Kasir POS · Tumbuh POS' };

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate loginPath="/kasir">
      <div className={`${plusJakarta.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col bg-lp-background font-lp-sans text-lp-on-surface`}>
        <AppNav />
        <div className="flex-1">{children}</div>
      </div>
    </AuthGate>
  );
}
