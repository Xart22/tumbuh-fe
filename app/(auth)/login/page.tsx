import { AuthGate } from '@/components/auth-gate';
import { LoginForm } from './login-form';

export const metadata = { title: 'Masuk Kasir · Tumbuh POS' };

export default function LoginPage() {
  return (
    <AuthGate requireAuth={false}>
      <main className="flex min-h-screen items-center justify-center p-4">
        <LoginForm />
      </main>
    </AuthGate>
  );
}
