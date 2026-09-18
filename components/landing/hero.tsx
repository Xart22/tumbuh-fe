import Image from 'next/image';
import Link from 'next/link';
import { HERO_URL } from './assets';
import { Icon } from '../icon';

const TRUST_MARKERS = [
  'Tanpa kartu kredit',
  'Setup 10 menit',
  'Bantuan tim spesialis F&B',
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-12 lg:pb-28 lg:pt-20">
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 right-10 h-96 w-96 rounded-full bg-lp-primary/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-48 h-80 w-80 rounded-full bg-lp-secondary-container/15 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-start lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-lp-primary shadow-sm">
              <Icon name="verified" className="text-[16px]" />
              <span>Dipercaya 4.800+ Outlet Kafe &amp; Resto di Indonesia</span>
              <span aria-hidden="true" className="mx-0.5 inline-block h-1.5 w-1.5 rounded-full bg-lp-primary" />
              <span className="font-bold text-lp-on-surface">14 Hari Trial Gratis</span>
            </div>
            <h1 className="mb-6 text-3xl font-extrabold leading-[1.15] tracking-tight text-lp-on-surface sm:text-4xl lg:text-5xl">
              Kelola Kafe &amp; Restoran Lebih Menguntungkan,{' '}
              <span className="text-lp-primary">Tanpa Bocor Bahan Baku</span>
            </h1>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-lp-on-surface-variant sm:text-lg">
              Platform all-in-one POS Kasir, kalkulasi HPP &amp; Resep BOM otomatis
              real-time, laporan keuangan terpadu, serta manajemen multi-cabang yang
              dirancang spesifik untuk bisnis kuliner modern.
            </p>
            <div className="mb-6 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lp-primary px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-lp-primary-container hover:shadow-lg"
              >
                <span>Mulai Uji Coba Gratis 14 Hari</span>
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
              <a
                href="#kalkulator-hpp"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-lp-outline-variant bg-white px-6 py-3.5 text-sm font-semibold text-lp-on-surface shadow-sm transition-all hover:bg-lp-surface-low"
              >
                <Icon name="calculate" className="text-[20px] text-lp-secondary" />
                <span>Hitung Simulasi Hemat</span>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-lp-tertiary">
              {TRUST_MARKERS.map((marker) => (
                <div key={marker} className="flex items-center gap-1.5">
                  <Icon name="check_circle" className="text-[16px] text-lp-primary" />
                  <span>{marker}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative rounded-2xl border border-lp-surface-container bg-white p-3 shadow-xl">
              <div className="mb-3 flex items-center justify-between rounded-xl bg-lp-surface-low px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-lp-error/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-lp-secondary-container" />
                  <span className="h-2.5 w-2.5 rounded-full bg-lp-primary" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-lp-tertiary">
                  <Icon name="lock" className="text-[14px]" />
                  <span className="font-lp-mono text-[11px]">tumbuhpos.id/pos/kala-senja</span>
                </div>
                <div className="w-8" />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-lp-surface-low">
                <Image
                  alt="Suasana Kala Senja Cafe & Resto"
                  src={HERO_URL}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                  priority
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl border border-white/40 bg-white/95 p-3 shadow-md backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-lp-primary">
                      <Icon name="table_restaurant" className="text-[18px]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-lp-on-surface">Area Indoor Utama</p>
                      <p className="text-[11px] font-medium text-lp-primary">18 Meja Aktif (82% Kapasitas)</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-lp-mono text-[11px] font-bold text-lp-primary">
                    Shift Siang
                  </span>
                </div>
              </div>
              <div className="absolute -left-5 -top-5 flex items-center gap-3 rounded-2xl border border-lp-surface-container bg-white p-3.5 shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lp-primary">
                  <Icon name="trending_up" className="text-[20px]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-lp-tertiary">Live Omzet Hari Ini</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-lp-mono text-sm font-bold text-lp-on-surface">Rp 14.820.000</span>
                    <span className="text-[11px] font-bold text-lp-primary">+24.8%</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -right-5 flex items-center gap-3 rounded-2xl border border-lp-surface-container bg-white p-3.5 shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lp-secondary">
                  <Icon name="donut_small" className="text-[20px]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-lp-tertiary">Food Cost Terkunci</p>
                  <p className="text-sm font-bold text-lp-on-surface">
                    29.8% <span className="text-[11px] font-normal text-lp-tertiary">(Target &lt;32%)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
