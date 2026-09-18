import { AuthGate } from '@/components/auth-gate';
import { OwnerPanel } from './owner/owner-panel';

export const metadata = {
  title: 'Masuk · Tumbuh POS',
  description: 'Masuk dashboard untuk owner dan manager usaha F&B.',
};

export default function LoginPage() {
  return (
    <AuthGate requireAuth={false}>
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-8">
        <OwnerPanel />
      </main>
    </AuthGate>
  );
}
