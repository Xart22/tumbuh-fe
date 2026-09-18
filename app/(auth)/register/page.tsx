import { AuthGate } from '@/components/auth-gate';
import { RegisterForm } from './register-form';

export const metadata = {
  title: 'Registrasi & Onboarding Bisnis · Tumbuh POS',
  description:
    'Daftarkan usaha kuliner Anda — buat akun pengelola dan profil outlet, gratis trial 14 hari tanpa kartu kredit.',
};

export default function RegisterPage() {
  return (
    <AuthGate requireAuth={false}>
      <RegisterForm />
    </AuthGate>
  );
}
