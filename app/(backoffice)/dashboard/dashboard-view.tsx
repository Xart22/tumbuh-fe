'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import {
  activeShifts,
  dailySummary,
  downloadDailySummary,
  hourlyForecast,
  hourlySales,
  inventoryValuation,
  lowStockLevels,
  paymentMethodsReport,
  salesSummary,
  topProducts,
} from '@/lib/api';
import {
  delta,
  pad2,
  sameHoursTotals,
  topHourlyWindows,
  yesterdayISO,
} from '@/lib/dashboard-math';
import { HourlyChart } from './hourly-chart';
import { formatIDR, formatNumber, todayISO } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import { KpiCard } from './kpi-card';
import { PaymentMethodsPanel } from './payment-method-panel';
import { StockAlertPanel } from './stock-alert-panel';
import { TargetEditor } from './target-editor';

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';

export function DashboardView() {
  const user = useAuthStore((s) => s.user);
  const outletName = useAuthStore((s) => s.outletName);
  const outletId = useAuthStore((s) => s.outletId);
  const today = todayISO();
  const [yesterday] = useState(() => yesterdayISO(new Date()));
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const blob = await downloadDailySummary(today);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `ringkasan-harian-${today}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Gagal mengunduh berkas.',
      );
    } finally {
      setDownloading(false);
    }
  }

  const [dailyQ, salesQ, topsQ, hourlyQ, methodsQ, prevHourlyQ, shiftsQ, forecastQ, stockQ, valuationQ] =
    useQueries({
      queries: [
        {
          queryKey: ['reports', 'daily', today],
          queryFn: () => dailySummary(today),
        },
        {
          queryKey: ['reports', 'sales', today, today],
          queryFn: () => salesSummary(today, today),
        },
        {
          queryKey: ['reports', 'top', today, today],
          queryFn: () => topProducts(today, today, 5),
        },
        {
          queryKey: ['reports', 'hourly', today],
          queryFn: () => hourlySales(today),
        },
        {
          queryKey: ['reports', 'methods', today, today],
          queryFn: () => paymentMethodsReport(today, today),
        },
        {
          queryKey: ['reports', 'hourly', yesterday],
          queryFn: () => hourlySales(yesterday),
        },
        {
          queryKey: ['shifts', 'active'],
          queryFn: activeShifts,
        },
        {
          queryKey: ['reports', 'forecast', today],
          queryFn: () => hourlyForecast(today),
        },
        {
          queryKey: ['inventory', 'stock-levels'],
          queryFn: lowStockLevels,
        },
        {
          queryKey: ['reports', 'inventory-valuation'],
          queryFn: inventoryValuation,
        },
      ],
    });

  const daily = dailyQ.data ?? null;
  const sales = salesQ.data ?? null;
  const tops = topsQ.data ?? [];
  const hourly = hourlyQ.data ?? [];
  const methods = methodsQ.data?.methods ?? [];
  const cashDrawer = methodsQ.data?.cashDrawer ?? null;
  const prevHourly = prevHourlyQ.data ?? [];
  const active = shiftsQ.data ?? null;
  const forecast = forecastQ.data ?? [];
  const stockAlerts = stockQ.data ?? [];
  const inventoryValue = valuationQ.data?.totalAssetValue ?? null;
  const queries = [dailyQ, salesQ, topsQ, hourlyQ, methodsQ];
  const loading = queries.some((q) => q.isPending);
  const failed = queries.find((q) => q.isError);
  const error = failed
    ? failed.error instanceof Error
      ? failed.error.message
      : 'Gagal memuat ringkasan.'
    : null;

  const gross = sales?.grossSales ?? daily?.grossSales ?? 0;
  const orders = sales?.totalOrders ?? daily?.totalOrders ?? 0;
  const dailyTarget = daily?.dailyRevenueTarget ?? 0;
  const targetPct = dailyTarget > 0 ? (gross / dailyTarget) * 100 : null;
  const canEditTarget = Boolean(
    user && ['owner', 'manager'].includes(user.role),
  );
  const aov = sales?.averageOrderValue ?? (orders > 0 ? gross / orders : 0);
  const hoursSoFar = new Date().getHours();
  const prevTotals = sameHoursTotals(prevHourly, hoursSoFar);
  const hasPrev = prevTotals.hasData;

  const peakHour = hourly.reduce(
    (best, row) => ((row.revenue ?? 0) > (best.revenue ?? 0) ? row : best),
    hourly[0],
  );
  const windows = topHourlyWindows(hourly, 2);
  const perHour = hourly.length ? gross / hourly.length : 0;
  const topRevenue = tops.reduce((sum, p) => sum + (p.revenue ?? 0), 0);
  const topShare = gross > 0 ? (topRevenue / gross) * 100 : null;
  // Trading window = hours that actually have revenue. The BE returns all 24
  // buckets, so min/max of the array would claim a 00:00–23:00 shift.
  const busyHours = hourly.filter((row) => (row.revenue ?? 0) > 0);
  const hourWindow = busyHours.length
    ? `${pad2(busyHours[0].hour)}:00–${pad2(busyHours[busyHours.length - 1].hour + 1)}:00`
    : null;

  const now = new Date();
  const clock = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateLabel = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const currentHourRow = hourly.find((row) => row.hour === now.getHours());
  const prevHourRevenue = hourly.find((row) => row.hour === now.getHours() - 1)?.revenue ?? 0;
  // Order-flow delta needs a non-zero baseline; otherwise absence, not 0%.
  const flowDelta =
    currentHourRow && prevHourRevenue > 0
      ? (((currentHourRow.revenue ?? 0) - prevHourRevenue) / prevHourRevenue) * 100
      : null;
  const isPeakNow = Boolean(
    peakHour && (peakHour.revenue ?? 0) > 0 && peakHour.hour === now.getHours(),
  );
  const hourOfDay = now.getHours();
  const greeting =
    hourOfDay < 11
      ? 'Selamat Pagi'
      : hourOfDay < 15
        ? 'Selamat Siang'
        : hourOfDay < 19
          ? 'Selamat Sore'
          : 'Selamat Malam';

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-lp-primary via-lp-primary-container to-lp-primary-fixed p-6 text-lp-on-primary shadow-md">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-lp-primary-fixed-dim/20 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex max-w-2xl flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lp-on-primary/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPeakNow ? 'animate-ping bg-lp-primary-fixed' : 'bg-lp-primary-fixed'
                  }`}
                />
                {isPeakNow ? 'Peak Hour Alert' : `${dateLabel} · ${clock}`}
              </span>
              <span className="text-[11px] text-lp-on-primary-container/90">
                {outletName ?? 'Semua outlet'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-lp-on-primary">
              {greeting}, {user?.name ?? 'Owner'} 👋
            </h1>
            <p className="text-sm leading-relaxed text-lp-on-primary/85">
              {orders > 0
                ? `Hari ini ${formatNumber(orders)} transaksi tercatat dengan omzet ${formatIDR(gross)}. Jam tersibuk sejauh ini ${peakHour?.hour ?? 0}:00.`
                : 'Belum ada transaksi hari ini. Buka kasir untuk mulai menjual.'}
              {flowDelta !== null &&
                ` Arus pesanan ${flowDelta >= 0 ? 'naik' : 'turun'} ${Math.abs(
                  flowDelta,
                ).toFixed(0)}% dalam 1 jam terakhir.`}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 self-start lg:self-center">
            <Button
              asChild
              className="h-11 gap-2 bg-lp-surface-container-lowest px-4 text-lp-primary shadow-sm hover:bg-lp-surface-low"
            >
              <Link href="/pos">
                <Icon name="point_of_sale" className="text-[20px]" filled />
                <span>Buka Kasir POS</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={downloading}
              onClick={handleDownload}
              className="h-11 gap-2 bg-lp-on-primary/10 px-4 text-lp-on-primary backdrop-blur-md hover:bg-lp-on-primary/20 hover:text-lp-on-primary"
            >
              <Icon name="download" className="text-[20px]" />
              <span>{downloading ? 'Mengunduh…' : 'Download Ringkasan Harian'}</span>
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-lp-error/30 bg-lp-error-container px-3 py-2 text-sm text-lp-error">
          {error}
        </div>
      )}

      {downloadError && (
        <div className="rounded-lg border border-lp-error/30 bg-lp-error-container px-3 py-2 text-sm text-lp-error">
          {downloadError}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          eyebrow="Omzet Hari Ini"
          title="Total Penjualan Kotor"
          value={formatIDR(gross)}
          delta={hasPrev ? delta(gross, prevTotals.revenue) : null}
          note={
            hasPrev
              ? `vs kemarin ${formatIDR(prevTotals.revenue)}`
              : 'Belum ada data kemarin'
          }
          icon="payments"
          accent="bg-lp-primary"
          action={
            dailyTarget > 0 || canEditTarget ? (
              <>
                <span className="text-[11px] text-lp-tertiary">
                  {dailyTarget > 0 && targetPct !== null
                    ? `Target ${formatIDR(dailyTarget)} · ${targetPct.toFixed(0)}% tercapai`
                    : 'Target harian belum diatur'}
                </span>
                <TargetEditor
                  outletId={outletId}
                  current={dailyTarget}
                  canEdit={canEditTarget}
                />
              </>
            ) : null
          }
        />
        <KpiCard
          eyebrow="Total Transaksi"
          title="Volume Struk"
          value={formatNumber(orders)}
          unit="struk"
          delta={hasPrev ? delta(orders, prevTotals.orders) : null}
          note={
            hasPrev
              ? `${formatNumber(prevTotals.orders)} struk jam sama kemarin`
              : 'Belum ada data kemarin'
          }
          icon="receipt_long"
          accent="bg-lp-secondary-container"
        />
        <KpiCard
          eyebrow="Average Order Value"
          title="Rata-rata / Tiket"
          value={formatIDR(aov)}
          note={`dari ${formatNumber(orders)} transaksi`}
          icon="shopping_basket"
          accent="bg-lp-primary-container"
        />
        <KpiCard
          eyebrow="Terminal & Kru"
          title="Kasir Aktif"
          value={shiftsQ.isPending ? '—' : formatNumber(active?.length ?? 0)}
          unit="terminal"
          note={
            !active || active.length === 0
              ? 'Belum ada kasir aktif'
              : active
                  .slice(0, 2)
                  .map((s) => s.cashierName ?? s.terminalName)
                  .join(', ') + (active.length > 2 ? ` +${active.length - 2}` : '')
          }
          icon="badge"
          accent="bg-lp-primary-container"
        />
      </section>

      {/* Middle row: chart (2/3) + stock alert (1/3) — matches the design. */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${PANEL} lg:col-span-2`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-lp-primary" />
              <h2 className="text-base font-semibold text-lp-on-surface">
                Penjualan per Jam
              </h2>
            </div>
            {hourWindow && (
              <span className="text-[11px] text-lp-tertiary">{hourWindow}</span>
            )}
          </div>
          {loading ? (
            <p className="text-sm text-lp-on-surface-variant">Memuat ringkasan…</p>
          ) : hourly.length === 0 ? (
            <p className="text-sm text-lp-on-surface-variant">Belum ada data.</p>
          ) : (
            <>
              {windows.length > 0 && (
                <div className="mb-3 grid grid-cols-1 gap-2 rounded-lg bg-lp-surface-low/70 p-2 sm:grid-cols-3">
                  {windows.map((w) => (
                    <div key={w.from} className="flex flex-col">
                      <span className="text-[11px] font-semibold text-lp-tertiary">
                        Puncak {w.label}
                      </span>
                      <span className="font-lp-mono text-sm font-semibold text-lp-on-surface">
                        {formatIDR(w.revenue)}
                      </span>
                    </div>
                  ))}
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-lp-tertiary">
                      Rata-rata Omzet / Jam
                    </span>
                    <span className="font-lp-mono text-sm font-semibold text-lp-on-surface">
                      {formatIDR(Math.round(perHour))}
                    </span>
                  </div>
                </div>
              )}
              <HourlyChart rows={hourly} forecast={forecast} />
            </>
          )}
        </div>

        <StockAlertPanel
          rows={stockAlerts}
          loading={stockQ.isPending}
          inventoryValue={inventoryValue}
        />
      </section>

      {/* Bottom row: top products (1/2) + payment methods (1/2). */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={PANEL}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-lp-on-surface">
              Top 5 Produk Hari Ini
            </h2>
            <Link
              href="/reports"
              className="text-[11px] font-semibold text-lp-primary hover:underline"
            >
              Lihat semua
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-lp-on-surface-variant">Memuat ringkasan…</p>
          ) : tops.length === 0 ? (
            <p className="text-sm text-lp-on-surface-variant">
              Belum ada penjualan hari ini.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Produk</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Omzet</th>
                </tr>
              </thead>
              <tbody>
                {tops.map((product, index) => (
                  <tr
                    key={product.productId ?? index}
                    className="border-t border-lp-surface-container"
                  >
                    <td className="py-2 text-lp-on-surface">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-lp-surface-low text-[11px] font-bold text-lp-primary">
                        {index + 1}
                      </span>
                      {product.name ?? '—'}
                    </td>
                    <td className="py-2 text-right text-lp-on-surface">
                      {formatNumber(product.qty ?? 0)}
                    </td>
                    <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                      {formatIDR(product.revenue ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && tops.length > 0 && topShare !== null && (
            <div className="mt-2 flex items-center justify-between border-t border-lp-surface-container pt-2">
              <span className="text-[11px] text-lp-tertiary">
                Top {tops.length} produk menyumbang {topShare.toFixed(0)}% omzet
              </span>
              <Link
                href="/reports"
                className="text-[11px] font-semibold text-lp-primary hover:underline"
              >
                Lihat laporan lengkap
              </Link>
            </div>
          )}
        </div>

        <div className={PANEL}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-lp-on-surface">
                Metode Pembayaran Terpopuler
              </h2>
              <p className="text-xs text-lp-tertiary">
                Distribusi transaksi non-tunai vs tunai hari ini.
              </p>
            </div>
            <Link
              href="/reports"
              className="shrink-0 text-[11px] font-semibold text-lp-primary hover:underline"
            >
              Detail
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-lp-on-surface-variant">Memuat ringkasan…</p>
          ) : methods.length === 0 ? (
            <p className="text-sm text-lp-on-surface-variant">Belum ada data.</p>
          ) : (
            <PaymentMethodsPanel rows={methods} cashDrawer={cashDrawer} />
          )}
        </div>
      </section>

      <p className="text-[11px] text-lp-tertiary">
        Data {today}, dibandingkan dengan jam 00:00–{pad2(hoursSoFar)}:59 pada{' '}
        {yesterday}.
      </p>
    </div>
  );
}
