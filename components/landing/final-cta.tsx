import Link from 'next/link';
import { WA_SALES_URL } from './assets';
import { Icon } from '../icon';

export function FinalCta() {
  return (
    <section className="bg-lp-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-lp-primary to-lp-primary-container p-8 text-white shadow-2xl sm:p-12 lg:p-16">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-emerald-400/20 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 lg:flex-row">
            <div className="max-w-2xl text-center lg:text-left">
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                <Icon name="rocket_launch" className="text-[16px]" />
                Mulai Sekarang Tanpa Risiko
              </span>
              <h2 className="mb-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                Siap Naikkan Profit &amp; Kunci HPP Bisnis Kuliner Anda?
              </h2>
              <p className="text-sm leading-relaxed text-emerald-100 sm:text-base">
                Bergabunglah dengan 4.800+ pemilik kafe dan restoran yang telah
                membebaskan operasional mereka dari kebocoran stok bahan baku.
              </p>
            </div>
            <div className="flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-center text-sm font-bold text-lp-primary shadow-lg transition-all hover:bg-emerald-50"
              >
                Mulai Uji Coba Gratis 14 Hari
              </Link>
              <a
                href={WA_SALES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-lp-primary-container/90 px-6 py-4 text-center text-sm font-semibold text-white transition-all hover:bg-lp-primary-container"
              >
                <Icon name="chat" className="text-[20px]" />
                <span>Chat WhatsApp Sales</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
