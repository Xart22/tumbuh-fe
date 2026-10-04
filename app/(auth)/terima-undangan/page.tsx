import { Suspense } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { AcceptInviteForm } from './accept-invite-form';

export const metadata = { title: 'Terima Undangan · Tumbuh POS' };

export default function TerimaUndanganPage() {
  return (
      <AuthGate requireAuth={false} redirectIfAuthed={false}>
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Suspense fallback={<p className="text-center text-sm text-muted">Memuat undangan…</p>}>
            <AcceptInviteForm />
          </Suspense>
        </div>
      </main>
    </AuthGate>
  );
}
