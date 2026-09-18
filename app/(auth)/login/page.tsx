import { Suspense } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { LoginScreen } from './login-screen';

export const metadata = { title: 'Masuk · Tumbuh POS' };

export default function LoginPage() {
  return (
    <AuthGate requireAuth={false}>
      <main className="flex min-h-screen items-center justify-center p-4">
        <Suspense fallback={<div className="p-8 text-sm text-muted">Memuat…</div>}>
          <LoginScreen />
        </Suspense>
      </main>
    </AuthGate>
  );
}
