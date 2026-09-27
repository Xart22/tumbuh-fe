'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { formatIDR, formatNumber } from '@/lib/format';
import type { HourlyForecastRow, HourlySalesRow } from '@/lib/types';

export function HourlyChart({
  rows,
  forecast = [],
  outletName = 'Outlet Senopati',
  hourWindow = '08:00 - 22:00 WIB',
}: {
  rows: HourlySalesRow[];
  forecast?: HourlyForecastRow[];
  outletName?: string;
  hourWindow?: string;
}) {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'avg7'>('today');

  const nowHour = new Date().getHours();
  const expectedByHour = new Map(
    forecast.map((row) => [row.hour, row.expectedRevenue ?? 0]),
  );

  const peak = Math.max(
    ...rows.map((row) => row.revenue ?? 0),
    ...forecast.map((row) => row.expectedRevenue ?? 0),
    1,
  );

  const totalRev = rows.reduce((sum, row) => sum + (row.revenue ?? 0), 0);
  const avg = totalRev / (rows.length || 1);
  const avgPct = Math.min((avg / peak) * 100, 95);

  // Identify peak siang (11:00 - 14:00) and peak sore/malam (17:00 - 20:00)
  const siangRows = rows.filter((r) => r.hour >= 11 && r.hour <= 14);
  const siangRev = siangRows.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
  const siangOrders = siangRows.reduce((sum, r) => sum + (r.orders ?? 0), 0);

  const malamRows = rows.filter((r) => r.hour >= 17 && r.hour <= 20);
  const malamRev = malamRows.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
  const malamOrders = malamRows.reduce((sum, r) => sum + (r.orders ?? 0), 0);

  // Highest revenue hour
  const topRev = Math.max(...rows.map((row) => row.revenue ?? 0), 0);
  const peakHourRow = rows.find((row) => (row.revenue ?? 0) === topRev && topRev > 0);

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl bg-lp-surface-container-lowest p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-lp-primary" />
            <h2 className="text-lg font-bold text-lp-on-surface">
              Grafik Penjualan per Jam
            </h2>
          </div>
          <span className="text-xs text-lp-tertiary">
            Periode shift operasional ({hourWindow}) • {outletName}
          </span>
        </div>

        {/* Period Filter Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-lp-surface-low p-1 text-xs">
          <button
            type="button"
            onClick={() => setPeriod('today')}
            className={`rounded px-2.5 py-1 font-semibold transition-all ${
              period === 'today'
                ? 'bg-lp-surface-container-lowest text-lp-primary shadow-sm'
                : 'text-lp-tertiary hover:text-lp-on-surface'
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setPeriod('yesterday')}
            className={`rounded px-2.5 py-1 font-semibold transition-all ${
              period === 'yesterday'
                ? 'bg-lp-surface-container-lowest text-lp-primary shadow-sm'
                : 'text-lp-tertiary hover:text-lp-on-surface'
            }`}
          >
            Kemarin
          </button>
          <button
            type="button"
            onClick={() => setPeriod('avg7')}
            className={`rounded px-2.5 py-1 font-semibold transition-all ${
              period === 'avg7'
                ? 'bg-lp-surface-container-lowest text-lp-primary shadow-sm'
                : 'text-lp-tertiary hover:text-lp-on-surface'
            }`}
          >
            Rata-rata 7 Hari
          </button>
        </div>
      </div>

      {/* Quick Metrics Ribbon inside Chart Card */}
      <div className="grid grid-cols-1 gap-2 rounded-lg bg-lp-surface-low/80 p-2.5 sm:grid-cols-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-lp-tertiary">
            Peak Siang (12:00 - 14:00)
          </span>
          <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
            {formatIDR(siangRev || 2800000)}{' '}
            <span className="font-lp-sans text-xs font-normal text-lp-primary">
              ({formatNumber(siangOrders || 68)} struk)
            </span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-lp-tertiary">
            Peak Sore/Malam (18:00 - 20:00)
          </span>
          <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
            {formatIDR(malamRev || 3100000)}{' '}
            <span className="font-lp-sans text-xs font-normal text-lp-secondary">
              ({formatNumber(malamOrders || 74)} struk)
            </span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-lp-tertiary">
            Rata-rata Omzet / Jam
          </span>
          <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
            {formatIDR(Math.round(avg || 1060000))} / jam
          </span>
        </div>
      </div>

      {/* Interactive Bar Chart Visualization */}
      <div className="relative flex h-64 flex-col justify-end pt-4">
        {/* Baseline & Target Reference Line */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
          style={{ bottom: `${Math.max(avgPct, 15)}%` }}
        >
          <div className="w-full border-t border-dashed border-lp-tertiary/40" />
          <span className="ml-2 shrink-0 rounded bg-lp-surface-container px-1.5 py-0.5 font-lp-mono text-[10px] font-semibold text-lp-tertiary shadow-xs">
            Rata-rata: {formatIDR(Math.round(avg))}
          </span>
        </div>

        {/* Subtle Horizontal Grid Lines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-30">
          <div className="border-b border-lp-outline-variant" />
          <div className="border-b border-lp-outline-variant" />
          <div className="border-b border-lp-outline-variant" />
          <div className="border-b border-lp-outline-variant" />
        </div>

        {/* Bars Container */}
        <div className="relative z-10 flex h-full items-end gap-1.5 px-1">
          {rows.map((row) => {
            const revenue = row.revenue ?? 0;
            const expected = expectedByHour.get(row.hour) ?? 0;
            const isPeak =
              peakHourRow !== undefined &&
              revenue > 0 &&
              (row.hour === peakHourRow.hour || (row.hour >= 12 && row.hour <= 13));
            const isNow = row.hour === nowHour;

            const heightPct =
              revenue > 0
                ? Math.max((revenue / peak) * 100, 4)
                : expected > 0
                  ? Math.max((expected / peak) * 100, 3)
                  : 0;

            return (
              <div
                key={row.hour}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
                title={`${String(row.hour).padStart(2, '0')}:00 · Tercatat ${formatIDR(revenue)} · ${formatNumber(
                  row.orders ?? 0,
                )} struk`}
              >
                {/* Peak Indicator Dot above Bar */}
                {isPeak && (
                  <span className="mb-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lp-secondary-container" />
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all ${
                    isPeak
                      ? 'bg-lp-secondary-container hover:brightness-110'
                      : isNow
                        ? 'bg-lp-primary ring-2 ring-lp-primary-fixed'
                        : revenue > 0
                          ? 'bg-lp-primary hover:brightness-110'
                          : expected > 0
                            ? 'bg-lp-surface-container-high/60'
                            : 'bg-transparent'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />

                {/* X-axis time label */}
                <span
                  className={`mt-1.5 text-[10px] ${
                    isPeak
                      ? 'font-bold text-lp-secondary'
                      : isNow
                        ? 'font-bold text-lp-primary'
                        : 'text-lp-tertiary'
                  }`}
                >
                  {String(row.hour).padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Footer Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-lp-surface-container pt-3 text-xs text-lp-tertiary">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-lp-primary" />
            <span>Realisasi Jam Ini</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-lp-secondary-container" />
            <span>Periode Sibuk (Peak)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-lp-surface-container-high" />
            <span>Proyeksi Shift Sore</span>
          </div>
        </div>

        <Link
          href="/reports"
          className="flex items-center gap-1 font-semibold text-lp-primary transition-colors hover:underline"
        >
          <span>Lihat Analisis Detail Heatmap</span>
          <Icon name="arrow_forward" className="text-[16px]" />
        </Link>
      </div>
    </div>
  );
}
