import Image from 'next/image';
import Link from 'next/link';
import { LOGO_URL } from '@/components/landing/assets';
import { plusJakarta } from '@/lib/fonts';
import { OwnerLoginForm } from './owner-form';
import { OwnerVisual } from './owner-visual';

/** Wide 2-column owner login: brand form (left) + F&B showcase (right). */
export function OwnerPanel() {
  const year = new Date().getFullYear();
  return (
    <div
      className={`w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl font-lp-sans ${plusJakarta.variable}`}
    >
      <div className="flex min-h-[640px] flex-col lg:flex-row">
        <div className="flex w-full flex-col justify-between p-8 sm:p-12 lg:w-1/2">
          <div>
            <Link href="/" aria-label="Kembali ke beranda" className="mb-8 inline-flex items-center">
              <Image
                alt="Logo Tumbuh POS"
                src={LOGO_URL}
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                unoptimized
                priority
              />
            </Link>

            <div className="mb-8">
              <span className="mb-3 inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Backoffice SaaS F&amp;B Indonesia
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Selamat Datang Kembali
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Kelola omzet, stok bahan baku, dan operasional kasir kafe Anda dari satu
                dashboard.
              </p>
            </div>

            <OwnerLoginForm />

            <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-600">Belum memiliki akun Tumbuh POS?</p>
              <Link
                href="/register"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Daftar Bisnis Baru (Uji Coba 14 Hari Gratis)
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-6 text-[11px] text-slate-400">
            <span>© {year} PT Tumbuh Digital Niaga</span>
            <div className="flex gap-4">
              <a
                href="https://wa.me/62811886284"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-600"
              >
                Bantuan Kasir
              </a>
              <Link href="/privacy" className="hover:text-slate-600">
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>

        <OwnerVisual />
      </div>
    </div>
  );
}
