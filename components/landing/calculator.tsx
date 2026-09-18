'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '../icon';

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function Calculator() {
  const [cups, setCups] = useState(250);
  const [price, setPrice] = useState(25000);

  const monthlySaved = Math.round(cups * price * 30 * 0.03);
  const annualSaved = monthlySaved * 12;

  return (
    <section id="kalkulator-hpp" className="scroll-mt-24 bg-gradient-to-b from-lp-background to-lp-surface-low py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-3xl border border-lp-surface-container bg-white p-8 shadow-xl lg:p-12">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-lp-primary">
              Simulasi Profitabilitas
            </span>
            <h2 className="mb-2 mt-1 text-2xl font-bold text-lp-on-surface sm:text-3xl">
              Hitung Estimasi Kebocoran Bahan yang Bisa Dihemat
            </h2>
            <p className="text-sm text-lp-on-surface-variant">
              Geser slider berikut sesuai volume penjualan outlet kuliner Anda untuk
              melihat potensi penghematan nyata bersama Tumbuh POS.
            </p>
          </div>
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="cup-slider" className="text-sm font-semibold text-lp-on-surface">
                    Penjualan Cup / Porsi per Hari
                  </label>
                  <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-lp-mono text-xs font-bold text-lp-primary">
                    {cups} Cup / Porsi
                  </span>
                </div>
                <input
                  id="cup-slider"
                  type="range"
                  min={50}
                  max={1000}
                  step={25}
                  value={cups}
                  onChange={(e) => setCups(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer rounded-lg bg-lp-surface-container accent-lp-primary"
                />
                <div className="mt-1 flex justify-between text-[11px] text-lp-tertiary">
                  <span>50 porsi/hari</span>
                  <span>1.000 porsi/hari</span>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="price-slider" className="text-sm font-semibold text-lp-on-surface">
                    Rata-rata Harga Jual per Menu
                  </label>
                  <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-lp-mono text-xs font-bold text-lp-secondary">
                    {formatRupiah(price)}
                  </span>
                </div>
                <input
                  id="price-slider"
                  type="range"
                  min={10000}
                  max={150000}
                  step={5000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer rounded-lg bg-lp-surface-container accent-lp-secondary"
                />
                <div className="mt-1 flex justify-between text-[11px] text-lp-tertiary">
                  <span>Rp 10.000</span>
                  <span>Rp 150.000</span>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-lp-surface-container bg-lp-surface-low p-4 text-xs text-lp-on-surface-variant">
                <Icon name="insights" className="mt-0.5 shrink-0 text-[20px] text-lp-primary" />
                <span>
                  Berdasarkan studi empiris, F&amp;B yang mengontrol resep BOM berhasil
                  menekan kebocoran bahan mentah dan waste rata-rata{' '}
                  <strong className="text-lp-on-surface">3% dari omzet kotor</strong>.
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-lp-primary to-lp-primary-container p-8 text-white shadow-lg lg:col-span-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-lp-primary-fixed">
                  Estimasi Hasil Penghematan
                </span>
                <p className="mt-1 text-sm text-emerald-100">Potensi Kebocoran Bahan yang Dicegah:</p>
                <div className="my-3 font-lp-mono text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {formatRupiah(monthlySaved)}{' '}
                  <span className="font-sans text-sm font-normal text-emerald-100">/bulan</span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-100">
                  Atau setara{' '}
                  <strong className="font-lp-mono font-bold text-white">
                    {formatRupiah(annualSaved)} / tahun
                  </strong>{' '}
                  yang terselamatkan dan langsung menambah laba bersih operasional gerai Anda.
                </p>
              </div>
              <div className="mt-6 flex flex-col justify-between gap-4 border-t border-white/20 pt-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs text-emerald-100">Waktu Rekap Kasir Dihemat:</p>
                  <p className="text-base font-bold text-white">~ 42 Jam / Bulan</p>
                </div>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-lp-primary shadow transition-all hover:bg-emerald-50"
                >
                  Klaim Penghematan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
