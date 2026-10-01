import Image from 'next/image';
import Link from 'next/link';
import { LOGO_URL } from './assets';

const NAV_LINKS = [
  { href: '#fitur-kuliner', label: 'Fitur Kuliner' },
  { href: '#kalkulator-hpp', label: 'Kalkulator HPP' },
  { href: '#solusi-masalah', label: 'Solusi Masalah' },
  { href: '#kisah-sukses', label: 'Kisah Sukses' },
  { href: '#harga-paket', label: 'Harga Paket' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 left-0 z-50 w-full border-b border-lp-surface-container bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="#" aria-label="Tumbuh POS — kembali ke atas" className="flex items-center gap-2">
          <Image
            alt="Tumbuh POS Logo"
            src={LOGO_URL}
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            unoptimized
            priority
          />
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-lp-on-surface-variant transition-colors hover:text-lp-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden items-center justify-center rounded-xl border border-lp-outline-variant bg-white px-4 py-2.5 text-sm font-semibold text-lp-on-surface shadow-sm transition-all hover:bg-lp-surface-low sm:inline-flex"
          >
            Masuk Backoffice
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-lp-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-lp-primary-container"
          >
            Coba Gratis 14 Hari
          </Link>
        </div>
      </div>
    </header>
  );
}
