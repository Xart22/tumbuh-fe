import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { LOGO_URL } from '@/components/landing/assets';
import { plusJakarta } from '@/lib/fonts';
import { ResetPasswordForm } from './reset-password-form';

export const metadata = {
  title: 'Lupa Password · Tumbuh POS',
  description: 'Atur ulang kata sandi akun backoffice Tumbuh POS.',
};

export default function ForgotPasswordPage() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4 font-lp-sans sm:p-8 ${plusJakarta.variable}`}
    >
      <div className="mb-6 text-center">
        <Link href="/" aria-label="Kembali ke beranda" className="inline-flex items-center">
          <Image
            alt="Logo Tumbuh POS"
            src={LOGO_URL}
            width={180}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Pusat Keamanan Akun Backoffice F&amp;B
        </p>
      </div>

      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/80 bg-emerald-50 text-emerald-700">
          <Icon name="lock_reset" className="text-[24px]" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Lupa Kata Sandi?
        </h1>
        <p className="mt-1.5 mb-6 text-xs leading-relaxed text-slate-500">
          Jangan khawatir. Masukkan email terdaftar akun Tumbuh POS Anda, lalu
          buat kata sandi baru dengan kode yang kami kirim.
        </p>

        <ResetPasswordForm />

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 text-xs">
          <Link
            href="/login"
            className="flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            <Icon name="arrow_back" className="text-base" />
            Kembali ke Halaman Login
          </Link>
          <span className="text-slate-400">Bantuan 24 Jam</span>
        </div>
      </div>
    </main>
  );
}
