'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-8 text-center">
        <h1 className="text-xl font-semibold text-ink">Terjadi kesalahan</h1>
        <p className="mt-1 text-sm text-muted">
          {error.digest
            ? `Kode error: ${error.digest}. Coba muat ulang halaman.`
            : 'Sesuatu gagal dimuat. Coba muat ulang halaman.'}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-500"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-panel-2"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
