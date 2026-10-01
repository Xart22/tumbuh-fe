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
  yesterdayISO,
} from '@/lib/dashboard-math';
import { HourlyChart } from './hourly-chart';
import { formatIDR, formatNumber, todayISO } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import { KpiCard, TerminalCrewCard } from './kpi-card';
import { PaymentMethodsPanel } from './payment-method-panel';
import { StockAlertPanel } from './stock-alert-panel';
import { TargetEditor } from './target-editor';
import { TopProductsPanel } from './top-products-panel';

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

  const [
    dailyQ,
    salesQ,
    topsQ,
    hourlyQ,
    methodsQ,
    prevHourlyQ,
    shiftsQ,
    forecastQ,
    stockQ,
    valuationQ,
  ] = useQueries({
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

  const busyHours = hourly.filter((row) => (row.revenue ?? 0) > 0);
  const hourWindow = busyHours.length
    ? `${pad2(busyHours[0].hour)}:00–${pad2(busyHours[busyHours.length - 1].hour + 1)}:00 WIB`
    : null;

  const now = new Date();
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
      {/* BANNER SAMBUTAN OPERASIONAL */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-lp-primary via-lp-primary-container to-lp-primary p-6 text-lp-on-primary shadow-md">
        {/* Ambient organic glow blur */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-lp-primary-fixed-dim/20 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-16 h-80 w-80 rounded-full bg-lp-secondary-container/15 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex max-w-2xl flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lp-on-primary/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
                <span
                  className={`h-2 w-2 rounded-full bg-lp-primary-fixed ${
                    isPeakNow ? 'animate-ping' : ''
                  }`}
                />
                {isPeakNow ? 'Peak Hour' : 'Jam Operasional'}
              </span>
              {outletName && (
                <span className="text-[11px] text-lp-on-primary-container/90">
                  {outletName}
                </span>
              )}
            </div>

            <h1
              suppressHydrationWarning
              className="text-2xl font-bold tracking-tight text-lp-on-primary lg:text-3xl"
            >
              {greeting}, {user?.name ?? 'Pengguna'}!
            </h1>

            <p className="text-sm leading-relaxed text-lp-on-primary/85">
              {orders > 0
                ? `Arus pesanan aktif dengan ${formatNumber(orders)} transaksi tercatat (omzet ${formatIDR(gross)}).`
                : 'Belum ada transaksi tercatat hari ini.'}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5 self-start lg:self-center">
            <Button
              asChild
              className="h-11 gap-2 rounded-lg bg-lp-surface-container-lowest px-4 text-lp-primary shadow-sm transition-all hover:bg-lp-surface-low"
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
              className="h-11 gap-2 rounded-lg bg-lp-on-primary/10 px-4 text-lp-on-primary backdrop-blur-md transition-all hover:bg-lp-on-primary/20 hover:text-lp-on-primary"
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

      {/* 4 CARD KPI FINANSIAL & OPERASIONAL */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Omzet Hari Ini */}
        <KpiCard
          eyebrow="Omzet Hari Ini"
          title="Total Penjualan Kotor"
          value={formatIDR(gross)}
          delta={hasPrev ? delta(gross, prevTotals.revenue) : null}
          note={
            hasPrev
              ? `vs kemarin ${formatIDR(prevTotals.revenue)}`
              : 'Belum ada data pembanding'
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

        {/* KPI 2: Total Transaksi */}
        <KpiCard
          eyebrow="Total Transaksi"
          title="Volume Struk"
          value={formatNumber(orders)}
          unit="Struk"
          delta={hasPrev ? delta(orders, prevTotals.orders) : null}
          note={
            hasPrev
              ? `${formatNumber(prevTotals.orders)} struk di jam sama`
              : 'Belum ada data pembanding'
          }
          icon="receipt_long"
          iconColor="text-lp-secondary"
          accent="bg-lp-secondary-container"
        />

        {/* KPI 3: Nilai Rata-rata Transaksi (AOV) */}
        <KpiCard
          eyebrow="Average Order Value"
          title="Rata-rata / Tiket"
          value={formatIDR(aov)}
          delta={null}
          note="Belum ada data pembanding"
          icon="shopping_basket"
          iconColor="text-lp-primary-container"
          accent="bg-lp-primary-container"
        />

        {/* KPI 4: Terminal & Kru (Breakdown Kasir Aktif) */}
        <TerminalCrewCard
          shifts={active}
          loading={shiftsQ.isPending}
        />
      </section>

      {/* SECTION TENGAH: GRAFIK PENJUALAN PER JAM (2/3) + PERINGATAN BAHAN BAKU (1/3) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
        <div className="flex flex-col lg:col-span-2">
          {loading && hourly.length === 0 ? (
            <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
              <p className="text-sm text-lp-on-surface-variant">Memuat grafik penjualan…</p>
            </div>
          ) : (
            <HourlyChart
              rows={hourly}
              yesterdayRows={prevHourly}
              forecast={forecast}
              outletName={outletName ?? undefined}
              hourWindow={hourWindow}
              className="h-full"
            />
          )}
        </div>

        <div className="flex flex-col lg:col-span-1">
          <StockAlertPanel
            rows={stockAlerts}
            loading={stockQ.isPending}
            inventoryValue={inventoryValue}
            className="h-full"
          />
        </div>
      </section>

      {/* SECTION BAWAH: TOP 5 PRODUK TERLARIS (1/2) + METODE PEMBAYARAN (1/2) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsPanel
          tops={tops}
          grossRevenue={gross}
          loading={topsQ.isPending}
        />

        <PaymentMethodsPanel
          rows={methods}
          cashDrawer={cashDrawer}
        />
      </section>

      <p suppressHydrationWarning className="text-[11px] text-lp-tertiary">
        {hoursSoFar >= 8
          ? `Data ${today}, dibandingkan dengan shift operasional jam 08:00–${pad2(hoursSoFar)}:59 pada ${yesterday}.`
          : `Data ${today}, dibandingkan dengan hari operasional sebelumnya (${yesterday}).`}
      </p>
    </div>
  );
}
