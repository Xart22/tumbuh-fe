'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { formatIDR, formatNumber } from '@/lib/format';
import type { MenuEngineeringClass, MenuEngineeringReport } from '@/lib/types';
import { DataTable } from '../reports-primitives';
import type { Range } from '../report-utils';

const QUADRANT_CONFIG: Record<
  MenuEngineeringClass,
  {
    name: string;
    alias: string;
    icon: string;
    badge: string;
    cardBg: string;
    border: string;
    textColor: string;
    tagTone: string;
    desc: string;
    action: string;
  }
> = {
  star: {
    name: 'Star',
    alias: 'Bintang',
    icon: 'star',
    badge: 'Popularitas Tinggi · Margin Tinggi',
    cardBg: 'bg-emerald-50/70',
    border: 'border-emerald-200',
    textColor: 'text-lp-primary',
    tagTone: 'bg-emerald-100/80 text-emerald-800 border-emerald-300',
    desc: 'Menu primadona F&B. Sangat diminati pelanggan dan menghasilkan keuntungan kotor tertinggi.',
    action: 'Pertahankan kualitas & konsistensi resep, letakkan di posisi teratas menu kasir.',
  },
  plow_horse: {
    name: 'Plow Horse',
    alias: 'Kuda Kerja',
    icon: 'trending_up',
    badge: 'Popularitas Tinggi · Margin Rendah',
    cardBg: 'bg-sky-50/70',
    border: 'border-sky-200',
    textColor: 'text-sky-700',
    tagTone: 'bg-sky-100/80 text-sky-800 border-sky-300',
    desc: 'Menu favorit yang laris manis, namun margin keuntungan tipis akibat biaya bahan baku (HPP) tinggi.',
    action: 'Tingkatkan margin: optimasi gramatur resep atau naikkan harga jual bertahap (+5–10%).',
  },
  puzzle: {
    name: 'Puzzle',
    alias: 'Teka-Teki',
    icon: 'extension',
    badge: 'Popularitas Rendah · Margin Tinggi',
    cardBg: 'bg-amber-50/70',
    border: 'border-amber-200',
    textColor: 'text-amber-700',
    tagTone: 'bg-amber-100/80 text-amber-800 border-amber-300',
    desc: 'Menu dengan margin keuntungan sangat tebal per porsi, namun volume penjualannya masih sedikit.',
    action: 'Gencarkan rekomendasi kasir (up-selling), perbaiki foto menu, atau tawarkan paket bundling.',
  },
  dog: {
    name: 'Dog',
    alias: 'Beban',
    icon: 'pets',
    badge: 'Popularitas Rendah · Margin Rendah',
    cardBg: 'bg-rose-50/70',
    border: 'border-rose-200',
    textColor: 'text-lp-error',
    tagTone: 'bg-rose-100/80 text-rose-800 border-rose-300',
    desc: 'Menu yang jarang dipesan pelanggan dan memberikan keuntungan kotor yang minim.',
    action: 'Evaluasi penghapusan menu dari katalog untuk menghemat modal stok bahan dan memangkas waste.',
  },
};

export function MenuEngineeringStudio({
  data,
  applied,
  onSelectPreset,
}: {
  data: MenuEngineeringReport;
  applied: Range;
  onSelectPreset?: (preset: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom') => void;
}) {
  const [viewMode, setViewMode] = useState<'table' | 'matrix'>('table');
  const [selectedQuadrant, setSelectedQuadrant] = useState<'all' | MenuEngineeringClass>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const items = data.items;
  const thresholds = data.thresholds;

  const totalRevenue = useMemo(() => items.reduce((sum, item) => sum + item.revenue, 0), [items]);
  const maxSoldQty = useMemo(() => Math.max(...items.map((i) => i.soldQty), 1), [items]);

  const itemsByQuadrant = useMemo(() => {
    return {
      star: items.filter((i) => i.classification === 'star'),
      plow_horse: items.filter((i) => i.classification === 'plow_horse'),
      puzzle: items.filter((i) => i.classification === 'puzzle'),
      dog: items.filter((i) => i.classification === 'dog'),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchQuadrant = selectedQuadrant === 'all' || item.classification === selectedQuadrant;
      const matchSearch =
        !searchQuery.trim() ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchQuadrant && matchSearch;
    });
  }, [items, selectedQuadrant, searchQuery]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 border-b border-lp-surface-container pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lp-primary/10 text-lp-primary">
              <Icon name="restaurant_menu" className="text-[20px]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-lp-on-surface">
                Analisis Menu Engineering (Profitabilitas &amp; Popularitas)
              </h2>
              <p className="text-xs text-lp-tertiary">
                Matriks Kasavana-Smith untuk mengklasifikasikan menu ke dalam 4 kuadran strategis F&amp;B.
              </p>
            </div>
          </div>
        </div>

        {/* Educational Empty State */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-lp-surface-container bg-lp-surface-low/50 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary mb-3">
            <Icon name="insights" className="text-[32px]" />
          </div>
          <h3 className="text-base font-bold text-lp-on-surface">
            Belum Ada Transaksi Menu pada Periode Ini
          </h3>
          <p className="mt-1 max-w-lg text-xs text-lp-tertiary leading-relaxed">
            Tidak ditemukan transaksi penjualan produk pada rentang tanggal{' '}
            <strong className="text-lp-on-surface font-semibold">{applied.dateFrom} s/d {applied.dateTo}</strong>.
            Gunakan filter rentang tanggal di atas atau pilih preset cepat berikut untuk menganalisis performa menu.
          </p>

          {onSelectPreset && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onSelectPreset('30d')}
                className="flex items-center gap-1.5 rounded-lg border border-lp-surface-container bg-lp-surface-container-lowest px-3.5 py-2 text-xs font-semibold text-lp-on-surface hover:bg-lp-surface-container transition-colors shadow-2xs"
              >
                <Icon name="history" className="text-[16px] text-lp-primary" />
                <span>Lihat 30 Hari Terakhir</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectPreset('month')}
                className="flex items-center gap-1.5 rounded-lg border border-lp-surface-container bg-lp-surface-container-lowest px-3.5 py-2 text-xs font-semibold text-lp-on-surface hover:bg-lp-surface-container transition-colors shadow-2xs"
              >
                <Icon name="calendar_month" className="text-[16px] text-lp-primary" />
                <span>Lihat Bulan Ini</span>
              </button>
            </div>
          )}

          {/* Educational 4-Quadrant Preview */}
          <div className="mt-8 w-full border-t border-lp-surface-container/60 pt-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary mb-3 text-center">
              Panduan 4 Kuadran Menu Engineering (Boston Matrix F&amp;B)
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-left">
              {(['star', 'plow_horse', 'puzzle', 'dog'] as MenuEngineeringClass[]).map((cls) => {
                const conf = QUADRANT_CONFIG[cls];
                return (
                  <div
                    key={cls}
                    className={`rounded-xl border ${conf.border} ${conf.cardBg} p-3.5 flex flex-col gap-1.5`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-2xs ${conf.textColor}`}>
                        <Icon name={conf.icon} className="text-[15px]" />
                      </span>
                      <span className="text-xs font-bold text-lp-on-surface">
                        {conf.name} ({conf.alias})
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-lp-tertiary">
                      {conf.badge}
                    </span>
                    <p className="text-[11px] text-lp-on-surface-variant leading-tight">
                      {conf.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Studio Header & Actions */}
      <div className="flex flex-col justify-between gap-4 border-b border-lp-surface-container pb-5 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary">
            <Icon name="restaurant_menu" className="text-[24px]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-lp-on-surface">
                Analisis Menu Engineering (Profitabilitas &amp; Popularitas)
              </h2>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-lp-primary">
                Kasavana-Smith F&amp;B Matrix
              </span>
            </div>
            <p className="text-xs text-lp-tertiary mt-0.5">
              Matriks rasio popularitas (volume terjual) vs profitabilitas (margin kotor) untuk optimalisasi harga, porsi resep, dan strategi promosi.
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1 rounded-xl border border-lp-surface-container bg-lp-surface-low p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-lp-surface-container-lowest text-lp-primary font-bold shadow-xs'
                : 'text-lp-tertiary hover:text-lp-on-surface'
            }`}
          >
            <Icon name="table_chart" className="text-[16px]" />
            <span>Tabel Detail</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              viewMode === 'matrix'
                ? 'bg-lp-surface-container-lowest text-lp-primary font-bold shadow-xs'
                : 'text-lp-tertiary hover:text-lp-on-surface'
            }`}
          >
            <Icon name="grid_view" className="text-[16px]" />
            <span>Matriks 2x2</span>
          </button>
        </div>
      </div>

      {/* Threshold & Health KPI Summary */}
      {thresholds && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-lp-surface-container/70 bg-lp-surface-low p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
              Ambang Omzet Rata-rata
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-lp-mono text-lg font-bold text-lp-on-surface">
                {formatIDR(thresholds.avgRevenue)}
              </span>
              <span className="text-[10px] text-lp-tertiary">/ menu</span>
            </div>
            <p className="mt-1 text-[10px] text-lp-tertiary">Batas pemisah volume tinggi vs rendah</p>
          </div>

          <div className="rounded-xl border border-lp-surface-container/70 bg-lp-surface-low p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
              Ambang Margin Rata-rata
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-lp-mono text-lg font-bold text-lp-on-surface">
                {formatIDR(thresholds.avgMargin)}
              </span>
              <span className="text-[10px] text-lp-tertiary">/ menu</span>
            </div>
            <p className="mt-1 text-[10px] text-lp-tertiary">Batas pemisah margin tinggi vs rendah</p>
          </div>

          <div className="rounded-xl border border-lp-surface-container/70 bg-lp-surface-low p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
              Total Menu Teranalisis
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-lp-mono text-lg font-bold text-lp-on-surface">
                {items.length}
              </span>
              <span className="text-xs font-semibold text-lp-tertiary">Menu F&amp;B</span>
            </div>
            <p className="mt-1 text-[10px] text-lp-tertiary">Omzet total {formatIDR(totalRevenue)}</p>
          </div>

          <div className="rounded-xl border border-lp-surface-container/70 bg-lp-surface-low p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
              Menu Bintang (Star)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-lp-mono text-lg font-bold text-emerald-700">
                {itemsByQuadrant.star.length}
              </span>
              <span className="text-xs font-semibold text-lp-tertiary">
                ({totalRevenue > 0 ? ((itemsByQuadrant.star.reduce((s, i) => s + i.revenue, 0) / totalRevenue) * 100).toFixed(0) : 0}% Omzet)
              </span>
            </div>
            <p className="mt-1 text-[10px] text-lp-tertiary">Penyumbang profit terbesar</p>
          </div>
        </div>
      )}

      {/* 4 Quadrant Interactive Filter Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(['star', 'plow_horse', 'puzzle', 'dog'] as MenuEngineeringClass[]).map((cls) => {
          const conf = QUADRANT_CONFIG[cls];
          const qItems = itemsByQuadrant[cls];
          const qRevenue = qItems.reduce((s, i) => s + i.revenue, 0);
          const qMargin = qItems.reduce((s, i) => s + i.margin, 0);
          const isSelected = selectedQuadrant === cls;

          return (
            <button
              key={cls}
              type="button"
              onClick={() => setSelectedQuadrant(isSelected ? 'all' : cls)}
              className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                conf.border
              } ${conf.cardBg} ${
                isSelected
                  ? 'ring-2 ring-lp-primary shadow-sm bg-lp-surface-container-lowest'
                  : 'opacity-95 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs ${conf.textColor}`}>
                      <Icon name={conf.icon} className="text-[18px]" />
                    </span>
                    <span className="text-xs font-bold text-lp-on-surface">
                      {conf.name} ({conf.alias})
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${conf.tagTone}`}>
                    {qItems.length} Menu
                  </span>
                </div>
                <p className="mt-2 text-[10px] font-semibold text-lp-tertiary">
                  {conf.badge}
                </p>
                <div className="mt-2 flex items-baseline justify-between border-t border-lp-surface-container/60 pt-2 text-xs">
                  <span className="text-[11px] text-lp-tertiary">Total Omzet:</span>
                  <span className="font-lp-mono font-bold text-lp-on-surface">
                    {formatIDR(qRevenue)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[11px] text-lp-tertiary">Laba Kotor:</span>
                  <span className="font-lp-mono font-bold text-emerald-700">
                    {formatIDR(qMargin)}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-white/80 p-2 text-[10px] text-lp-on-surface-variant leading-tight">
                <strong>Aksi:</strong> {conf.action}
              </div>
            </button>
          );
        })}
      </div>

      {/* Matrix 2x2 Visual View */}
      {viewMode === 'matrix' ? (
        <div className="rounded-2xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-lp-on-surface">
                Visualisasi Matriks Kuadran F&amp;B (2x2 Grid)
              </h3>
              <p className="text-xs text-lp-tertiary">
                Sumbu Y: Margin Keuntungan (Tinggi di atas, Rendah di bawah) · Sumbu X: Volume Penjualan (Tinggi di kiri, Rendah di kanan)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top-Left: Star */}
            <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white shadow-2xs">
                    <Icon name="star" className="text-[15px]" />
                  </span>
                  <span className="text-xs font-bold text-emerald-900">
                    STAR (Bintang)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Margin ↑ · Volume ↑ ({itemsByQuadrant.star.length})
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Menu paling sukses. Jaga konsistensi rasa dan letakkan di posisi terdepan kasir.
              </p>
              <div className="mt-2 flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {itemsByQuadrant.star.length === 0 ? (
                  <span className="text-xs text-lp-tertiary italic py-2">Belum ada menu di kuadran ini.</span>
                ) : (
                  itemsByQuadrant.star.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-emerald-100 shadow-2xs"
                    >
                      <span className="font-semibold text-lp-on-surface">{item.productName}</span>
                      <div className="flex items-center gap-3 text-right">
                        <span className="font-lp-mono text-[11px] text-lp-tertiary">{item.soldQty} terjual</span>
                        <span className="font-lp-mono font-bold text-emerald-700">{formatIDR(item.margin)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top-Right: Puzzle */}
            <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-600 text-white shadow-2xs">
                    <Icon name="extension" className="text-[15px]" />
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    PUZZLE (Teka-Teki)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Margin ↑ · Volume ↓ ({itemsByQuadrant.puzzle.length})
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                Sangat untung tapi kurang laris. Butuh up-selling kasir, foto menarik, atau promo bundling.
              </p>
              <div className="mt-2 flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {itemsByQuadrant.puzzle.length === 0 ? (
                  <span className="text-xs text-lp-tertiary italic py-2">Belum ada menu di kuadran ini.</span>
                ) : (
                  itemsByQuadrant.puzzle.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-amber-100 shadow-2xs"
                    >
                      <span className="font-semibold text-lp-on-surface">{item.productName}</span>
                      <div className="flex items-center gap-3 text-right">
                        <span className="font-lp-mono text-[11px] text-lp-tertiary">{item.soldQty} terjual</span>
                        <span className="font-lp-mono font-bold text-amber-700">{formatIDR(item.margin)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom-Left: Plow Horse */}
            <div className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-600 text-white shadow-2xs">
                    <Icon name="trending_up" className="text-[15px]" />
                  </span>
                  <span className="text-xs font-bold text-sky-900">
                    PLOW HORSE (Kuda Kerja)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                  Margin ↓ · Volume ↑ ({itemsByQuadrant.plow_horse.length})
                </span>
              </div>
              <p className="text-[11px] text-sky-800">
                Menu favorit pelanggan tapi margin tipis. Sesuaikan resep bahan atau naikkan harga bertahap (+5-10%).
              </p>
              <div className="mt-2 flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {itemsByQuadrant.plow_horse.length === 0 ? (
                  <span className="text-xs text-lp-tertiary italic py-2">Belum ada menu di kuadran ini.</span>
                ) : (
                  itemsByQuadrant.plow_horse.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-sky-100 shadow-2xs"
                    >
                      <span className="font-semibold text-lp-on-surface">{item.productName}</span>
                      <div className="flex items-center gap-3 text-right">
                        <span className="font-lp-mono text-[11px] text-lp-tertiary">{item.soldQty} terjual</span>
                        <span className="font-lp-mono font-bold text-sky-700">{formatIDR(item.margin)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom-Right: Dog */}
            <div className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-600 text-white shadow-2xs">
                    <Icon name="pets" className="text-[15px]" />
                  </span>
                  <span className="text-xs font-bold text-rose-900">
                    DOG (Beban)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                  Margin ↓ · Volume ↓ ({itemsByQuadrant.dog.length})
                </span>
              </div>
              <p className="text-[11px] text-rose-800">
                Kurang diminati dan margin kecil. Pertimbangkan hapus dari menu agar stok bahan tidak basi.
              </p>
              <div className="mt-2 flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {itemsByQuadrant.dog.length === 0 ? (
                  <span className="text-xs text-lp-tertiary italic py-2">Belum ada menu di kuadran ini.</span>
                ) : (
                  itemsByQuadrant.dog.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-rose-100 shadow-2xs"
                    >
                      <span className="font-semibold text-lp-on-surface">{item.productName}</span>
                      <div className="flex items-center gap-3 text-right">
                        <span className="font-lp-mono text-[11px] text-lp-tertiary">{item.soldQty} terjual</span>
                        <span className="font-lp-mono font-bold text-rose-700">{formatIDR(item.margin)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Table View */
        <div className="flex flex-col gap-3 rounded-2xl border border-lp-surface-container bg-lp-surface-container-lowest p-5 shadow-sm">
          {/* Table Filter Chips & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lp-surface-container/60 pb-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedQuadrant('all')}
                className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                  selectedQuadrant === 'all'
                    ? 'bg-lp-primary text-lp-on-primary font-bold shadow-2xs'
                    : 'bg-lp-surface-low text-lp-on-surface hover:bg-lp-surface-container'
                }`}
              >
                Semua ({items.length})
              </button>
              {(['star', 'plow_horse', 'puzzle', 'dog'] as MenuEngineeringClass[]).map((cls) => {
                const conf = QUADRANT_CONFIG[cls];
                const count = itemsByQuadrant[cls].length;
                const isSelected = selectedQuadrant === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedQuadrant(cls)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      isSelected
                        ? `${conf.tagTone} font-bold shadow-2xs`
                        : 'bg-lp-surface-low text-lp-tertiary hover:bg-lp-surface-container'
                    }`}
                  >
                    <Icon name={conf.icon} className="text-[13px]" />
                    <span>{conf.name} ({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-lp-tertiary"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama menu F&amp;B…"
                aria-label="Cari menu engineering"
                className="h-8 w-52 rounded-lg border border-lp-surface-container bg-lp-surface-low pl-8 pr-2.5 text-xs text-lp-on-surface placeholder:text-lp-tertiary outline-none transition focus:border-lp-primary focus:w-64"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-lp-tertiary hover:text-lp-on-surface"
                >
                  <Icon name="close" className="text-[12px]" />
                </button>
              )}
            </div>
          </div>

          {/* Sortable DataTable */}
          <DataTable
            head={['Produk Menu', 'Terjual', 'Total Omzet', 'HPP (COGS)', 'Laba Kotor (Margin)', 'Kuadran', 'Rekomendasi Aksi']}
            align={['left', 'right', 'right', 'right', 'right', 'center', 'left']}
            rows={filteredItems.map((item) => {
              const conf = QUADRANT_CONFIG[item.classification];
              const marginRatio = item.revenue > 0 ? (item.margin / item.revenue) * 100 : 0;
              const volumePct = Math.round((item.soldQty / maxSoldQty) * 100);

              return [
                <div key="prod" className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${conf.cardBg} ${conf.textColor}`}>
                    <Icon name={conf.icon} className="text-[15px]" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-lp-on-surface line-clamp-1">{item.productName}</span>
                    <span className="text-[10px] text-lp-tertiary">ID: {item.productId.slice(0, 8)}…</span>
                  </div>
                </div>,

                <div key="qty" className="flex flex-col items-end gap-1">
                  <span className="font-lp-mono font-bold text-lp-on-surface">
                    {formatNumber(item.soldQty)} Porsi
                  </span>
                  <div className="h-1.5 w-16 rounded-full bg-lp-surface-container overflow-hidden">
                    <div
                      className="h-full rounded-full bg-lp-primary"
                      style={{ width: `${volumePct}%` }}
                    />
                  </div>
                </div>,

                formatIDR(item.revenue),
                formatIDR(item.cogs),

                <div key="margin" className="flex flex-col items-end">
                  <span className="font-lp-mono font-bold text-emerald-700">
                    {formatIDR(item.margin)}
                  </span>
                  <span className="text-[10px] font-semibold text-lp-tertiary">
                    {marginRatio.toFixed(1)}% margin
                  </span>
                </div>,

                <span
                  key="class"
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${conf.tagTone}`}
                >
                  <Icon name={conf.icon} className="text-[12px]" />
                  <span>{conf.name}</span>
                </span>,

                <span key="rec" className="text-[11px] text-lp-on-surface-variant line-clamp-2 max-w-xs">
                  {conf.action}
                </span>,
              ];
            })}
          />
        </div>
      )}
    </div>
  );
}
