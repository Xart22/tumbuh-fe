import { AuthGate } from '@/components/auth-gate';
import { OwnerPanel } from './owner/owner-panel';

export const metadata = {
  title: 'Masuk Backoffice · Tumbuh POS',
  description: 'Masuk dashboard backoffice untuk owner dan manager usaha F&B.',
};

export default function BackofficeLoginPage() {
  return (
    <AuthGate requireAuth={false}>
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-8">
        <OwnerPanel />
      </main>
    </AuthGate>
  );
}
