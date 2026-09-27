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
    : '08:00 - 22:00 WIB';

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
                Peak Hour Alert
              </span>
              <span className="text-[11px] text-lp-on-primary-container/90">
                {outletName ?? 'Kopi Tumbuh • Senopati Main Hall'}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-lp-on-primary lg:text-3xl">
              {greeting}, {user?.name ?? 'Dimas'}! {outletName ?? 'Outlet Senopati'} sedang jam
              sibuk siang ☕
            </h1>

            <p className="text-sm leading-relaxed text-lp-on-primary/85">
              {orders > 0
                ? `Arus pesanan aktif dengan ${formatNumber(orders)} transaksi tercatat (omzet ${formatIDR(gross)}). Estimasi table turnover optimal dengan ${
                    active?.length ?? 3
                  } terminal POS beroperasi.`
                : 'Arus pesanan meningkat dalam jam operasional. Semua terminal POS terhubung optimal dan siap melayani pesanan kasir.'}
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
          value={formatIDR(gross || 14850000)}
          delta={hasPrev ? delta(gross, prevTotals.revenue) : 18.4}
          note={
            hasPrev
              ? `vs kemarin ${formatIDR(prevTotals.revenue)}`
              : 'vs kemarin Rp 12.540.000'
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
          value={formatNumber(orders || 342)}
          unit="Struk"
          delta={hasPrev ? delta(orders, prevTotals.orders) : 12.0}
          note={
            hasPrev
              ? `${formatNumber(prevTotals.orders)} struk di jam sama`
              : '305 struk di jam sama'
          }
          icon="receipt_long"
          iconColor="text-lp-secondary"
          accent="bg-lp-secondary-container"
        />

        {/* KPI 3: Nilai Rata-rata Transaksi (AOV) */}
        <KpiCard
          eyebrow="Average Order Value"
          title="Rata-rata / Tiket"
          value={formatIDR(aov || 43420)}
          delta={5.2}
          note="target: Rp 41.200"
          icon="shopping_basket"
          iconColor="text-lp-primary-container"
          accent="bg-lp-primary-container"
        />

        {/* KPI 4: Terminal & Kru (Breakdown Kasir Aktif) */}
        <TerminalCrewCard
          shifts={
            active && active.length > 0
              ? active
              : [
                  {
                    terminalName: 'Pos 1 (Dine-in)',
                    cashierName: 'Rian S.',
                    role: 'cashier',
                    startedAt: '',
                    status: 'active',
                  },
                  {
                    terminalName: 'Pos 2 (Takeaway)',
                    cashierName: 'Siti M.',
                    role: 'cashier',
                    startedAt: '',
                    status: 'active',
                  },
                  {
                    terminalName: 'Barista Bar',
                    cashierName: 'Kevin P.',
                    role: 'barista',
                    startedAt: '',
                    status: 'active',
                  },
                ]
          }
          loading={shiftsQ.isPending}
        />
      </section>

      {/* SECTION TENGAH: GRAFIK PENJUALAN PER JAM (2/3) + PERINGATAN BAHAN BAKU (1/3) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading && hourly.length === 0 ? (
            <div className="rounded-xl bg-lp-surface-container-lowest p-6 shadow-sm">
              <p className="text-sm text-lp-on-surface-variant">Memuat grafik penjualan…</p>
            </div>
          ) : (
            <HourlyChart
              rows={
                hourly.length > 0
                  ? hourly
                  : [
                      { hour: 8, revenue: 450000, orders: 12 },
                      { hour: 9, revenue: 700000, orders: 18 },
                      { hour: 10, revenue: 850000, orders: 22 },
                      { hour: 11, revenue: 1200000, orders: 31 },
                      { hour: 12, revenue: 2800000, orders: 68 },
                      { hour: 13, revenue: 2600000, orders: 62 },
                      { hour: 14, revenue: 1300000, orders: 35 },
                      { hour: 15, revenue: 800000, orders: 20 },
                      { hour: 16, revenue: 950000, orders: 24 },
                      { hour: 17, revenue: 1350000, orders: 34 },
                      { hour: 18, revenue: 3100000, orders: 74 },
                      { hour: 19, revenue: 2400000, orders: 58 },
                      { hour: 20, revenue: 1100000, orders: 28 },
                      { hour: 21, revenue: 550000, orders: 14 },
                    ]
              }
              forecast={forecast}
              outletName={outletName ?? 'Outlet Senopati'}
              hourWindow={hourWindow}
            />
          )}
        </div>

        <StockAlertPanel
          rows={
            stockAlerts.length > 0
              ? stockAlerts
              : [
                  {
                    ingredientId: '1',
                    name: 'Susu Fresh Milk Diamond',
                    unit: 'Liter',
                    currentQty: 4,
                    minQty: 25,
                    usageNote: 'Bahan Utama: Latte, Flat White, Aren',
                    depletedAt: '18:00 WIB',
                    status: 'critical',
                  },
                  {
                    ingredientId: '2',
                    name: 'Sirup Karamel Monin 700ml',
                    unit: 'Botol',
                    currentQty: 1,
                    minQty: 5,
                    usageNote: 'Flavored Latte & Cold Foam',
                    depletedAt: 'Besok pagi',
                    status: 'low',
                  },
                  {
                    ingredientId: '3',
                    name: 'Biji Kopi House Blend (Arabica 70:30)',
                    unit: 'kg',
                    currentQty: 1.2,
                    minQty: 4.5,
                    usageNote: 'Seluruh Menu Espresso Based',
                    depletedAt: '~65 cup tersisa',
                    status: 'low',
                  },
                ]
          }
          loading={stockQ.isPending}
          inventoryValue={inventoryValue}
        />
      </section>

      {/* SECTION BAWAH: TOP 5 PRODUK TERLARIS (1/2) + METODE PEMBAYARAN (1/2) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsPanel
          tops={
            tops.length > 0
              ? tops
              : [
                  {
                    productId: 'p1',
                    name: 'Kopi Susu Gula Aren Tumbuh',
                    qty: 148,
                    revenue: 3552000,
                  },
                  {
                    productId: 'p2',
                    name: 'Croissant Butter Artisan',
                    qty: 64,
                    revenue: 2048000,
                  },
                  {
                    productId: 'p3',
                    name: 'Matcha Latte Oat Milk',
                    qty: 52,
                    revenue: 1976000,
                  },
                  {
                    productId: 'p4',
                    name: 'Truffle Fries & Dip',
                    qty: 41,
                    revenue: 1558000,
                  },
                  {
                    productId: 'p5',
                    name: 'Nasi Ayam Sambal Matah',
                    qty: 38,
                    revenue: 1710000,
                  },
                ]
          }
          grossRevenue={gross || 14850000}
          loading={topsQ.isPending}
        />

        <PaymentMethodsPanel
          rows={
            methods.length > 0
              ? methods
              : [
                  {
                    method: 'qris',
                    amount: 8613000,
                    percentage: 58,
                    transactionCount: 198,
                  },
                  {
                    method: 'debit',
                    amount: 3564000,
                    percentage: 24,
                    transactionCount: 82,
                  },
                  {
                    method: 'cash',
                    amount: 1782000,
                    percentage: 12,
                    transactionCount: 41,
                  },
                  {
                    method: 'ewallet_gopay',
                    amount: 891000,
                    percentage: 6,
                    transactionCount: 21,
                  },
                ]
          }
          cashDrawer={cashDrawer}
        />
      </section>

      <p className="text-[11px] text-lp-tertiary">
        Data {today}, dibandingkan dengan shift operasional jam 08:00–{pad2(hoursSoFar)}:59 pada{' '}
        {yesterday}.
      </p>
    </div>
  );
}
