'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WA_SALES_URL } from './assets';
import { Icon } from '../icon';

type Billing = 'monthly' | 'yearly';

const PRICES: Record<Billing, { starter: string; pro: string; enterprise: string }> = {
  monthly: { starter: 'Rp 149.000', pro: 'Rp 299.000', enterprise: 'Rp 599.000' },
  yearly: { starter: 'Rp 119.000', pro: 'Rp 239.000', enterprise: 'Rp 479.000' },
};

const STARTER_FEATURES = [
  { label: '1 Outlet & 2 Akun Kasir Shift', included: true },
  { label: 'Aplikasi Kasir Android & iPad POS', included: true },
  { label: 'Integrasi QRIS Statis & Dinamis BI', included: true },
  { label: 'Laporan Penjualan & Rekap Harian', included: true },
  { label: 'Resep BOM & Kalkulasi HPP', included: false },
  { label: 'Kitchen Display System (KDS)', included: false },
];

const PRO_FEATURES = [
  'Semua Fitur di Paket Starter',
  'Resep BOM & Kalkulasi HPP Bahan Baku',
  'Manajemen Denah Meja & Split Bill',
  'Kitchen Display System (KDS) & Bar Ticket',
  'Multi-User Kasir, Waiter, & Manajer',
  'Dukungan Prioritas WhatsApp 24/7',
];

const ENTERPRISE_FEATURES = [
  'Semua Fitur Paket Pro Kafe & Resto',
  'Modul Central Kitchen & PO Gudang',
  'Transfer Bahan Antar Cabang Terjadwal',
  'Integrasi Open API ke Software Akuntansi',
  'Dedicated Customer Success Manager',
];

function CheckItem({ label, strong = false }: { label: string; strong?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${strong ? 'font-bold text-lp-primary' : ''}`}>
      <Icon name={strong ? 'check_circle' : 'check'} className="text-[18px] text-lp-primary" />
      <span>{label}</span>
    </li>
  );
}

export function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const prices = PRICES[billing];

  const toggleClass = (active: boolean) =>
    active
      ? 'rounded-full bg-white text-lp-on-surface shadow-sm transition-all'
      : 'rounded-full text-lp-on-surface-variant transition-all hover:text-lp-on-surface';

  return (
    <section id="harga-paket" className="scroll-mt-24 border-t border-lp-surface-container bg-lp-surface-low py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-lp-primary">
            Investasi Terjangkau
          </span>
          <h2 className="mb-4 mt-2 text-2xl font-bold text-lp-on-surface sm:text-3xl lg:text-4xl">
            Paket Harga Transparan, Tanpa Biaya Tersembunyi
          </h2>
          <p className="text-base text-lp-on-surface-variant">
            Disesuaikan dengan skala usaha kuliner Anda. Nikmati fitur lengkap dengan
            dukungan teknis prioritas.
          </p>
          <div className="mt-6 inline-flex items-center rounded-full bg-lp-surface-container p-1 shadow-inner">
            <button
              type="button"
              aria-pressed={billing === 'monthly'}
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 text-xs font-semibold ${toggleClass(billing === 'monthly')}`}
            >
              Bayar Bulanan
            </button>
            <button
              type="button"
              aria-pressed={billing === 'yearly'}
              onClick={() => setBilling('yearly')}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold ${toggleClass(billing === 'yearly')}`}
            >
              <span>Bayar Tahunan</span>
              <span className="rounded-full bg-lp-secondary-container px-2 py-0.5 text-[10px] font-bold text-lp-on-secondary-container">
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
          <div className="flex flex-col justify-between rounded-2xl border border-lp-surface-container bg-white p-8 shadow-sm">
            <div>
              <span className="text-xs font-semibold text-lp-tertiary">Untuk Gerai Mandiri</span>
              <h3 className="mt-1 text-xl font-bold text-lp-on-surface">Starter Quick Service</h3>
              <p className="mt-1 text-xs text-lp-on-surface-variant">
                Cocok untuk kedai kopi takeaway, booth pujasera, &amp; gerobak modern.
              </p>
              <div className="my-6">
                <span className="font-lp-mono text-3xl font-bold text-lp-on-surface">{prices.starter}</span>
                <span className="text-xs text-lp-tertiary">/ bulan / outlet</span>
              </div>
              <ul className="space-y-3 text-xs text-lp-on-surface">
                {STARTER_FEATURES.map((feature) => (
                  <li
                    key={feature.label}
                    className={`flex items-center gap-2 ${feature.included ? '' : 'text-lp-tertiary'}`}
                  >
                    <Icon
                      name={feature.included ? 'check' : 'close'}
                      className={`text-[18px] ${feature.included ? 'text-lp-primary' : ''}`}
                    />
                    <span>{feature.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full rounded-xl border border-lp-surface-container bg-lp-surface-low py-3 text-center text-xs font-semibold text-lp-on-surface transition-colors hover:bg-lp-surface-container"
            >
              Pilih Paket Starter
            </Link>
          </div>

          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-lp-primary bg-white p-8 shadow-xl lg:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-lp-primary px-4 py-0.5 text-xs font-bold text-white shadow-md">
              Paling Banyak Dipilih
            </div>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-lp-primary">Direkomendasikan F&amp;B</span>
                  <h3 className="mt-1 text-xl font-bold text-lp-on-surface">Pro Kafe &amp; Resto</h3>
                </div>
                <Icon name="stars" className="text-[24px] text-lp-primary" />
              </div>
              <p className="mt-1 text-xs text-lp-on-surface-variant">
                Solusi penuh kendali HPP dan layanan meja untuk kafe &amp; resto dine-in.
              </p>
              <div className="my-6">
                <span className="font-lp-mono text-3xl font-bold text-lp-primary">{prices.pro}</span>
                <span className="text-xs text-lp-tertiary">/ bulan / outlet</span>
              </div>
              <ul className="space-y-3 text-xs text-lp-on-surface">
                {PRO_FEATURES.map((feature, i) => (
                  <CheckItem key={feature} label={feature} strong={i === 0} />
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full rounded-xl bg-lp-primary py-3 text-center text-xs font-bold text-white shadow-md transition-all hover:bg-lp-primary-container"
            >
              Mulai Uji Coba Pro 14 Hari
            </Link>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-lp-surface-container bg-white p-8 shadow-sm">
            <div>
              <span className="text-xs font-semibold text-lp-tertiary">Rantai Bisnis &amp; Waralaba</span>
              <h3 className="mt-1 text-xl font-bold text-lp-on-surface">Multi-Outlet Enterprise</h3>
              <p className="mt-1 text-xs text-lp-on-surface-variant">
                Untuk manajemen grup 5+ cabang dengan dapur pusat (Central Kitchen).
              </p>
              <div className="my-6">
                <span className="font-lp-mono text-3xl font-bold text-lp-on-surface">{prices.enterprise}</span>
                <span className="text-xs text-lp-tertiary">/ bulan / outlet</span>
              </div>
              <ul className="space-y-3 text-xs text-lp-on-surface">
                {ENTERPRISE_FEATURES.map((feature, i) => (
                  <CheckItem key={feature} label={feature} strong={i === 0} />
                ))}
              </ul>
            </div>
            <a
              href={WA_SALES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full rounded-xl border border-lp-surface-container bg-lp-surface-low py-3 text-center text-xs font-semibold text-lp-on-surface transition-colors hover:bg-lp-surface-container"
            >
              Hubungi Konsultan Enterprise
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
