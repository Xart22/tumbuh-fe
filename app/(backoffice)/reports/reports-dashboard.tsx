'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { downloadSalesSummary } from '@/lib/api';
import { todayISO } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import {
  daysAgoISO,
  monthStartISO,
  prevRange,
  type Range,
  type ReportTabId,
} from './report-utils';
import { SalesTab } from './tabs/sales-tab';
import { MenuTab } from './tabs/menu-tab';
import { ProfitTab } from './tabs/profit-tab';
import { OperationsTab } from './tabs/operations-tab';
import { TaxTab } from './tabs/tax-tab';

const TABS: Array<{ id: ReportTabId; label: string; icon: string }> = [
  { id: 'penjualan', label: 'Penjualan', icon: 'query_stats' },
  { id: 'menu', label: 'Menu', icon: 'restaurant_menu' },
  { id: 'laba', label: 'Laba & Biaya', icon: 'account_balance_wallet' },
  { id: 'operasional', label: 'Operasional', icon: 'badge' },
  { id: 'pajak', label: 'Pajak & PB1', icon: 'receipt_long' },
];

export function ReportsDashboard() {
  const role = useAuthStore((s) => s.user?.role);
  const outletName = useAuthStore((s) => s.outletName);
  const [tab, setTab] = useState<ReportTabId>('penjualan');

  // Date range state: default to 7 days
  const [datePreset, setDatePreset] = useState<string>('7d');
  const [showCustomDate, setShowCustomDate] = useState(false);

  const [range, setRange] = useState<Range>(() => ({
    dateFrom: daysAgoISO(6),
    dateTo: todayISO(),
  }));
  const [applied, setApplied] = useState<Range>(range);
  const [compare, setCompare] = useState(false);
  const prev = useMemo(() => prevRange(applied), [applied]);

  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Quick preset selector
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    let newRange: Range;
    if (preset === 'today') {
      const today = todayISO();
      newRange = { dateFrom: today, dateTo: today };
      setShowCustomDate(false);
    } else if (preset === 'yesterday') {
      const yest = daysAgoISO(1);
      newRange = { dateFrom: yest, dateTo: yest };
      setShowCustomDate(false);
    } else if (preset === '7d') {
      newRange = { dateFrom: daysAgoISO(6), dateTo: todayISO() };
      setShowCustomDate(false);
    } else if (preset === '30d') {
      newRange = { dateFrom: daysAgoISO(29), dateTo: todayISO() };
      setShowCustomDate(false);
    } else if (preset === 'month') {
      newRange = { dateFrom: monthStartISO(), dateTo: todayISO() };
      setShowCustomDate(false);
    } else {
      setShowCustomDate(true);
      return;
    }
    setRange(newRange);
    setApplied(newRange);
  };

  const handleApplyCustomDate = () => {
    setApplied(range);
    setShowCustomDate(false);
  };

  if (role && !['owner', 'manager'].includes(role)) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-lp-error-container/60 bg-lp-error-container/20 p-4 text-sm font-semibold text-lp-error">
          Laporan hanya dapat diakses oleh Owner dan Manager outlet.
        </div>
      </div>
    );
  }

  async function exportCsv(kind: 'sales' | 'top', run: () => Promise<Blob>) {
    setExporting(kind);
    setExportError(null);
    try {
      const blob = await run();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        kind === 'sales'
          ? `Laporan_Penjualan_${applied.dateFrom}_sd_${applied.dateTo}.csv`
          : `Laporan_Produk_${applied.dateFrom}_sd_${applied.dateTo}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Gagal mengunduh laporan.',
      );
    } finally {
      setExporting(null);
    }
  }

  const presetLabels: Record<string, string> = {
    today: 'Hari Ini',
    yesterday: 'Kemarin',
    '7d': '7 Hari Terakhir',
    '30d': '30 Hari Terakhir',
    month: 'Bulan Ini',
    custom: 'Rentang Kustom',
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Toolbar: Filters & Export Actions */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Date Presets Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCustomDate(!showCustomDate)}
              className="flex h-11 items-center gap-2 rounded-lg border border-lp-surface-container bg-lp-surface-low px-4 text-xs font-semibold text-lp-on-surface transition-colors hover:bg-lp-surface-container shadow-2xs"
            >
              <Icon name="calendar_today" className="text-[18px] text-lp-primary" />
              <span>
                {presetLabels[datePreset] ?? 'Pilih Tanggal'} ({applied.dateFrom} s/d {applied.dateTo})
              </span>
              <Icon name="expand_more" className="text-[16px] text-lp-tertiary" />
            </button>

            {/* Presets Popup */}
            {showCustomDate && (
              <div className="absolute left-0 top-full z-50 mt-2 flex w-72 flex-col gap-1 rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-2 shadow-xl">
                {(
                  [
                    ['today', 'Hari Ini'],
                    ['yesterday', 'Kemarin'],
                    ['7d', '7 Hari Terakhir'],
                    ['30d', '30 Hari Terakhir'],
                    ['month', 'Bulan Ini'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handlePresetChange(id)}
                    className={`rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      datePreset === id
                        ? 'bg-lp-surface-low text-lp-primary'
                        : 'text-lp-on-surface hover:bg-lp-surface-low'
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <div className="my-1 border-t border-lp-surface-container" />

                <div className="flex flex-col gap-2 p-1">
                  <span className="text-[11px] font-bold text-lp-tertiary">Rentang Kustom</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={range.dateFrom}
                      onChange={(e) => setRange((r) => ({ ...r, dateFrom: e.target.value }))}
                      className="w-full rounded-md border border-lp-surface-container bg-lp-surface-low px-2 py-1 text-xs text-lp-on-surface"
                    />
                    <span className="text-xs text-lp-tertiary">-</span>
                    <input
                      type="date"
                      value={range.dateTo}
                      onChange={(e) => setRange((r) => ({ ...r, dateTo: e.target.value }))}
                      className="w-full rounded-md border border-lp-surface-container bg-lp-surface-low px-2 py-1 text-xs text-lp-on-surface"
                    />
                  </div>
                  <Button
                    onClick={handleApplyCustomDate}
                    className="mt-1 h-8 w-full rounded-md bg-lp-primary text-xs font-semibold text-lp-on-primary hover:bg-lp-primary-container"
                  >
                    Terapkan Rentang
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Active outlet (switched from the sidebar) */}
          <div className="flex h-11 items-center gap-2 rounded-lg border border-lp-surface-container bg-lp-surface-low px-4 text-xs font-semibold text-lp-on-surface shadow-2xs">
            <Icon name="storefront" className="text-[18px] text-lp-tertiary" />
            <span>{outletName ?? 'Outlet aktif'}</span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={compare}
            onClick={() => setCompare((v) => !v)}
            className={`flex h-11 items-center gap-2 rounded-lg border px-4 text-xs font-semibold shadow-2xs transition-colors ${
              compare
                ? 'border-lp-primary/40 bg-lp-primary/10 text-lp-primary'
                : 'border-lp-surface-container bg-lp-surface-low text-lp-on-surface hover:bg-lp-surface-container'
            }`}
          >
            <Icon name="compare_arrows" className="text-[18px]" />
            <span>Bandingkan periode sebelumnya</span>
          </button>
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            disabled={exporting !== null}
            onClick={() =>
              exportCsv('sales', () => downloadSalesSummary(applied.dateFrom, applied.dateTo))
            }
            className="flex h-11 items-center gap-2 rounded-lg border-lp-surface-container bg-lp-surface-low px-4 text-xs font-semibold text-lp-on-surface hover:bg-lp-surface-container shadow-2xs"
          >
            <Icon name="table_chart" className="text-[18px] text-lp-primary" />
            <span>{exporting === 'sales' ? 'Mengunduh…' : 'Export CSV'}</span>
          </Button>

          <Button
            onClick={() => window.print()}
            className="flex h-11 items-center gap-2 rounded-lg bg-lp-primary px-4 text-xs font-semibold text-lp-on-primary hover:bg-lp-primary-container shadow-sm"
          >
            <Icon name="picture_as_pdf" className="text-[18px]" />
            <span>Export PDF (.pdf)</span>
          </Button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-xl border border-lp-error-container/60 bg-lp-error-container/20 p-4 text-xs font-semibold text-lp-error">
          {exportError}
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-2xs whitespace-nowrap ${
              tab === item.id
                ? 'bg-lp-primary text-lp-on-primary shadow-sm'
                : 'border border-lp-surface-container bg-lp-surface-container-lowest text-lp-tertiary hover:bg-lp-surface-low hover:text-lp-on-surface'
            }`}
          >
            <Icon name={item.icon} className="text-[18px]" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab View */}
      {tab === 'penjualan' && (
        <SalesTab applied={applied} prev={compare ? prev : undefined} />
      )}
      {tab === 'menu' && (
        <MenuTab applied={applied} onSelectPreset={handlePresetChange} />
      )}
      {tab === 'laba' && (
        <ProfitTab applied={applied} prev={compare ? prev : undefined} />
      )}
      {tab === 'operasional' && <OperationsTab applied={applied} />}
      {tab === 'pajak' && <TaxTab />}
    </div>
  );
}
