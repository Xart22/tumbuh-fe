'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { formatIDR, formatNumber } from '@/lib/format';
import type { HourlyForecastRow, HourlySalesRow } from '@/lib/types';

export function HourlyChart({
  rows,
  yesterdayRows = [],
  forecast = [],
  outletName,
  hourWindow,
  className = '',
}: {
  rows: HourlySalesRow[];
  yesterdayRows?: HourlySalesRow[];
  forecast?: HourlyForecastRow[];
  outletName?: string;
  hourWindow?: string | null;
  className?: string;
}) {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'avg7'>('today');

  const nowHour = new Date().getHours();

  if (rows.length === 0 && yesterdayRows.length === 0 && forecast.length === 0) {
    return (
      <div
        className={`flex h-full min-h-[420px] flex-col items-center justify-center gap-2.5 rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 text-center shadow-sm ${className}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lp-primary/10 text-lp-primary">
          <Icon name="bar_chart" className="text-[28px]" />
        </div>
        <p className="text-sm font-semibold text-lp-on-surface">
          Belum ada data penjualan
        </p>
        <p className="max-w-[240px] text-xs text-lp-tertiary">
          Grafik muncul setelah ada transaksi tercatat hari ini.
        </p>
      </div>
    );
  }

  // Pick dataset based on selected period tab
  const activeRows =
    period === 'yesterday' && yesterdayRows.length > 0
      ? yesterdayRows
      : period === 'avg7' && forecast.length > 0
        ? forecast.map((f) => ({
            hour: f.hour,
            revenue: f.expectedRevenue ?? 0,
            orders: 0,
          }))
        : rows;

  const expectedByHour = new Map(
    forecast.map((row) => [row.hour, row.expectedRevenue ?? 0]),
  );

  const peak = Math.max(
    ...activeRows.map((row) => row.revenue ?? 0),
    ...forecast.map((row) => row.expectedRevenue ?? 0),
    1,
  );

  const totalRev = activeRows.reduce((sum, row) => sum + (row.revenue ?? 0), 0);
  const activeCount = activeRows.filter((r) => (r.revenue ?? 0) > 0).length;
  const avg = totalRev > 0 ? totalRev / (activeCount || activeRows.length || 1) : 0;
  const avgPct = Math.min((avg / peak) * 100, 92);

  // Peak siang (11:00 - 14:00) and peak malam (17:00 - 20:00)
  const siangRows = activeRows.filter((r) => r.hour >= 11 && r.hour <= 14);
  const siangRev = siangRows.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
  const siangOrders = siangRows.reduce((sum, r) => sum + (r.orders ?? 0), 0);

  const malamRows = activeRows.filter((r) => r.hour >= 17 && r.hour <= 20);
  const malamRev = malamRows.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
  const malamOrders = malamRows.reduce((sum, r) => sum + (r.orders ?? 0), 0);

  // Highest revenue hour
  const topRev = Math.max(...activeRows.map((row) => row.revenue ?? 0), 0);
  const peakHourRow = activeRows.find((row) => (row.revenue ?? 0) === topRev && topRev > 0);

  return (
    <div
      className={`flex h-full min-h-[420px] flex-col justify-between gap-5 rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lp-primary/10 text-lp-primary">
            <Icon name="query_stats" className="text-[20px]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-lp-on-surface">
              Grafik Penjualan per Jam
            </h2>
            <span className="text-xs text-lp-tertiary">
              Shift operasional{hourWindow ? ` (${hourWindow})` : ''}
              {outletName ? ` • ${outletName}` : ''}
            </span>
          </div>
        </div>

        {/* Period Filter Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-lp-surface-container/60 bg-lp-surface-low p-1 text-xs">
          <button
            type="button"
            onClick={() => setPeriod('today')}
            className={`rounded-md px-3 py-1 font-semibold transition-all ${
              period === 'today'
                ? 'bg-lp-surface-container-lowest text-lp-primary shadow-xs'
                : 'text-lp-tertiary hover:text-lp-on-surface'
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setPeriod('yesterday')}
            className={`rounded-md px-3 py-1 font-semibold transition-all ${
              period === 'yesterday'
                ? 'bg-lp-surface-container-lowest text-lp-primary shadow-xs'
                : 'text-lp-tertiary hover:text-lp-on-surface'
            }`}
          >
            Kemarin
          </button>
          <button
            type="button"
            onClick={() => setPeriod('avg7')}
            className={`rounded-md px-3 py-1 font-semibold transition-all ${
              period === 'avg7'
                ? 'bg-lp-surface-container-lowest text-lp-primary shadow-xs'
                : 'text-lp-tertiary hover:text-lp-on-surface'
            }`}
          >
            Rata-rata 7 Hari
          </button>
        </div>
      </div>

      {/* Quick Metrics Ribbon inside Chart Card */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-lp-surface-container/70 bg-lp-surface-low/80 p-3 sm:grid-cols-3">
        <div className="flex flex-col justify-between gap-1 rounded-lg bg-lp-surface-container-lowest/80 p-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            <span>Peak Siang</span>
            <span className="font-lp-mono text-[10px] text-lp-tertiary">11:00–14:00</span>
          </div>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
              {formatIDR(siangRev)}
            </span>
            {siangOrders > 0 && (
              <span className="font-lp-sans text-xs font-semibold text-lp-primary">
                ({formatNumber(siangOrders)} struk)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-1 rounded-lg bg-lp-surface-container-lowest/80 p-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            <span>Peak Malam</span>
            <span className="font-lp-mono text-[10px] text-lp-tertiary">17:00–20:00</span>
          </div>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
              {formatIDR(malamRev)}
            </span>
            {malamOrders > 0 && (
              <span className="font-lp-sans text-xs font-semibold text-lp-secondary">
                ({formatNumber(malamOrders)} struk)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-1 rounded-lg bg-lp-surface-container-lowest/80 p-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            <span>Rata-rata / Jam</span>
            <span className="font-lp-mono text-[10px] text-lp-tertiary">Aktif</span>
          </div>
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
              {formatIDR(Math.round(avg))}
            </span>
            <span className="text-[11px] text-lp-tertiary">/ jam</span>
          </div>
        </div>
      </div>

      {/* Interactive Bar Chart Visualization */}
      <div className="relative flex flex-1 min-h-[220px] flex-col justify-end pt-6 pb-1">
        {/* Subtle Horizontal Grid Lines */}
        <div className="pointer-events-none absolute inset-x-0 inset-y-6 flex flex-col justify-between opacity-35">
          <div className="border-b border-dashed border-lp-outline-variant/60" />
          <div className="border-b border-dashed border-lp-outline-variant/60" />
          <div className="border-b border-dashed border-lp-outline-variant/60" />
        </div>

        {/* Baseline & Target Reference Line */}
        {avg > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex items-center transition-all duration-300"
            style={{ bottom: `${Math.max(avgPct, 12)}%` }}
          >
            <div className="w-full border-t border-dashed border-lp-primary/40" />
            <span className="ml-2 shrink-0 rounded border border-lp-surface-container bg-lp-surface-container-lowest px-2 py-0.5 font-lp-mono text-[10px] font-semibold text-lp-primary shadow-2xs">
              Rata-rata: {formatIDR(Math.round(avg))}
            </span>
          </div>
        )}

        {/* Bars Container */}
        <div className="relative z-10 flex h-full items-end gap-1 sm:gap-1.5 px-0.5">
          {activeRows.map((row) => {
            const revenue = row.revenue ?? 0;
            const expected = expectedByHour.get(row.hour) ?? 0;
            const isPeak =
              peakHourRow !== undefined &&
              revenue > 0 &&
              (row.hour === peakHourRow.hour || (row.hour >= 12 && row.hour <= 13 && revenue >= peak * 0.75));
            const isNow = period === 'today' && row.hour === nowHour;

            const heightPct =
              revenue > 0
                ? Math.max((revenue / peak) * 100, 5)
                : expected > 0
                  ? Math.max((expected / peak) * 100, 4)
                  : 0;

            const hourLabel = String(row.hour).padStart(2, '0');
            const showTick = activeRows.length <= 16 || row.hour % 2 === 0 || isPeak || isNow;

            return (
              <div
                key={row.hour}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                {/* Rich Tooltip on Hover */}
                <div className="pointer-events-none absolute bottom-full mb-2.5 hidden flex-col items-center z-30 whitespace-nowrap rounded-lg border border-lp-outline-variant/40 bg-lp-inverse-surface px-2.5 py-1.5 text-xs text-lp-inverse-on-surface shadow-xl group-hover:flex transition-all">
                  <div className="flex items-center gap-1.5 font-bold text-lp-inverse-on-surface">
                    <span>Pukul {hourLabel}:00</span>
                    {isPeak && (
                      <span className="rounded bg-lp-secondary-container px-1 py-0.2 text-[9px] font-bold text-lp-on-secondary-container uppercase">
                        Peak
                      </span>
                    )}
                    {isNow && (
                      <span className="rounded bg-lp-primary px-1 py-0.2 text-[9px] font-bold text-lp-on-primary uppercase">
                        Saat Ini
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-lp-mono font-bold text-lp-primary-fixed">
                    {formatIDR(revenue)}
                  </div>
                  <div className="text-[10px] text-lp-inverse-on-surface/75">
                    {formatNumber(row.orders ?? 0)} transaksi
                    {expected > 0 && revenue === 0 && ` · Proyeksi ${formatIDR(expected)}`}
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-lp-inverse-surface" />
                </div>

                {/* Peak Indicator Dot above Bar */}
                {isPeak && (
                  <span className="mb-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lp-secondary-container ring-2 ring-lp-secondary-container/30" />
                )}

                {/* Bar */}
                {heightPct > 0 ? (
                  <div
                    className={`w-full max-w-[26px] rounded-t transition-all duration-200 cursor-pointer ${
                      isPeak
                        ? 'bg-lp-secondary-container hover:brightness-110 shadow-xs'
                        : isNow
                          ? 'bg-lp-primary ring-2 ring-lp-primary-fixed shadow-xs hover:brightness-110'
                          : revenue > 0
                            ? 'bg-lp-primary hover:bg-lp-primary-container'
                            : 'bg-lp-surface-container-high/80 hover:bg-lp-surface-container-highest'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  <div className="h-1 w-full max-w-[12px] rounded-full bg-lp-surface-container-high/60 group-hover:bg-lp-primary/40 transition-colors" />
                )}

                {/* X-axis time label */}
                <span
                  className={`mt-2 text-[10px] select-none ${
                    isPeak
                      ? 'font-bold text-lp-secondary'
                      : isNow
                        ? 'font-bold text-lp-primary underline underline-offset-2'
                        : showTick
                          ? 'font-medium text-lp-tertiary'
                          : 'opacity-0'
                  }`}
                >
                  {hourLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Footer Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-lp-surface-container pt-3.5 text-xs text-lp-tertiary">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-lp-primary" />
            <span className="font-medium text-lp-on-surface">Realisasi Transaksi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-lp-secondary-container" />
            <span className="font-medium text-lp-secondary">Jam Sibuk (Peak)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-lp-surface-container-high" />
            <span className="font-medium text-lp-tertiary">Proyeksi (Forecast)</span>
          </div>
        </div>

        <Link
          href="/reports"
          className="inline-flex items-center gap-1 font-semibold text-lp-primary transition-all hover:text-lp-primary-container hover:underline"
        >
          <span>Lihat Analisis Detail Heatmap</span>
          <Icon name="arrow_forward" className="text-[16px]" />
        </Link>
      </div>
    </div>
  );
}
