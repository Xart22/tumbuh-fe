import Link from 'next/link';
import { AuthGate } from '@/components/auth-gate';
import { LoginForm } from './login-form';

export const metadata = { title: 'Masuk Kasir · Tumbuh POS' };

export default function LoginPage() {
  return (
    <AuthGate requireAuth={false}>
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <LoginForm />
          <p className="text-center text-sm text-muted">
            Owner atau manager?{' '}
            <Link href="/backoffice" className="font-medium text-teal-500 hover:underline">
              Masuk Backoffice
            </Link>
          </p>
        </div>
      </main>
    </AuthGate>
  );
}
