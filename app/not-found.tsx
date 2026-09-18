import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Halaman Tidak Ditemukan · Tumbuh POS' };

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-8 text-center">
        <p className="font-mono text-5xl font-bold text-muted">404</p>
        <h1 className="mt-3 text-xl font-semibold text-ink">Halaman tidak ditemukan</h1>
        <p className="mt-1 text-sm text-muted">
          Alamat yang dibuka tidak ada atau sudah dipindahkan.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-500"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-panel-2"
          >
            Masuk Kasir
          </Link>
        </div>
      </div>
    </main>
  );
}
