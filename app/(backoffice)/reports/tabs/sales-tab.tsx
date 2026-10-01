'use client';

import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { categorySales, dailySummary, listShifts, outletComparison, paymentMethodsReport, profitSummary, salesSummary } from '@/lib/api';
import { formatIDR, formatNumber } from '@/lib/format';
import type { PaymentMethod } from '@/lib/types';
import { PAYMENT_LABELS, PAYMENT_METHODS } from '@/lib/types';
import { Section, Delta, DataTable } from '../reports-primitives';
import type { Range } from '../report-utils';

function SummaryTab({ applied, prev }: { applied: Range; prev?: Range }) {
  const [dailyQ, salesQ, methodsQ, categoriesQ] = useQueries({
    queries: [
      {
        queryKey: ['reports', 'daily', applied.dateTo],
        queryFn: () => dailySummary(applied.dateTo),
      },
      {
        queryKey: ['reports', 'sales', applied.dateFrom, applied.dateTo],
        queryFn: () => salesSummary(applied.dateFrom, applied.dateTo),
      },
      {
        queryKey: ['reports', 'methods', applied.dateFrom, applied.dateTo],
        queryFn: () => paymentMethodsReport(applied.dateFrom, applied.dateTo),
      },
      {
        queryKey: ['reports', 'by-category', applied.dateFrom, applied.dateTo],
        queryFn: () => categorySales(applied.dateFrom, applied.dateTo),
      },
    ],
  });
  const profitQ = useQuery({
    queryKey: ['reports', 'profit', applied.dateFrom, applied.dateTo],
    queryFn: () => profitSummary(applied.dateFrom, applied.dateTo),
  });
  const prevSalesQ = useQuery({
    queryKey: ['reports', 'sales', 'prev', prev?.dateFrom, prev?.dateTo],
    queryFn: () => salesSummary(prev!.dateFrom, prev!.dateTo),
    enabled: Boolean(prev),
  });
  const shiftsQ = useQuery({
    queryKey: ['shifts', 'list'],
    queryFn: () => listShifts({ limit: 10 }),
  });
  const weekQ = useQuery({
    queryKey: ['reports', 'week-trend', applied.dateTo],
    queryFn: async () => {
      const end = new Date(`${applied.dateTo}T00:00:00`);
      const days: string[] = [];
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        days.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        );
      }
      const sums = await Promise.all(days.map((d) => dailySummary(d)));
      return days.map((d, i) => ({ date: d, summary: sums[i] }));
    },
  });

  const daily = dailyQ.data ?? null;
  const sales = salesQ.data ?? null;
  const methods = methodsQ.data?.methods ?? [];
  const cashDrawer = methodsQ.data?.cashDrawer ?? null;
  const categories = categoriesQ.data ?? [];
  const categoryQty = categories.reduce((s, c) => s + (c.soldQty ?? 0), 0);
  const categoryRevenue = categories.reduce((s, c) => s + (c.revenue ?? 0), 0);
  const profit = profitQ.data ?? null;
  const shifts = shiftsQ.data ?? [];

  const grossSales = sales?.grossSales ?? daily?.grossSales ?? null;
  const netSales = sales?.netSales ?? daily?.netSales ?? grossSales;
  const totalOrders = sales?.totalOrders ?? daily?.totalOrders ?? null;
  const aov =
    grossSales !== null && totalOrders
      ? Math.round(grossSales / totalOrders)
      : null;
  const prevSales = prevSalesQ.data ?? null;
  const netDelta =
    prevSales?.netSales && netSales !== null
      ? ((netSales - prevSales.netSales) / prevSales.netSales) * 100
      : null;
  const ordersDelta =
    prevSales?.totalOrders && totalOrders !== null
      ? ((totalOrders - prevSales.totalOrders) / prevSales.totalOrders) * 100
      : null;
  const grossProfit = profit?.grossProfit ?? null;
  const cogs = profit?.cogs ?? null;
  const dailyTarget =
    daily?.dailyRevenueTarget && daily.dailyRevenueTarget > 0
      ? daily.dailyRevenueTarget
      : null;

  const methodsTotal = methods.reduce((sum, m) => sum + (m.amount ?? 0), 0);
  const cashlessAmount = methods
    .filter((m) => m.method !== 'cash')
    .reduce((sum, m) => sum + (m.amount ?? 0), 0);
  const cashlessPct =
    methodsTotal > 0 ? (cashlessAmount / methodsTotal) * 100 : null;

  const methodRows = methods.map((m) => {
    const name = m.method.toLowerCase();
    const color = name.includes('qris')
      ? 'bg-lp-primary'
      : name.includes('debit') ||
          name.includes('kartu') ||
          name.includes('edc') ||
          name.includes('credit')
        ? 'bg-lp-primary-fixed-dim'
        : name.includes('cash') || name.includes('tunai')
          ? 'bg-lp-secondary-container'
          : 'bg-lp-tertiary';
    const amount = m.amount ?? 0;
    return {
      label: (PAYMENT_METHODS as readonly string[]).includes(m.method)
        ? PAYMENT_LABELS[m.method as PaymentMethod]
        : m.method,
      count: m.transactionCount ?? 0,
      amount,
      color,
      share: methodsTotal > 0 ? (amount / methodsTotal) * 100 : 0,
    };
  });

  const weekRaw = (weekQ.data ?? []).map((row) => ({
    label: new Date(`${row.date}T00:00:00`).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
    }),
    rev: row.summary.grossSales ?? 0,
    orders: row.summary.totalOrders ?? row.summary.orderCount ?? 0,
  }));
  const weekMax = Math.max(
    ...weekRaw.map((d) => d.rev),
    dailyTarget ?? 0,
    1,
  );
  const weekPeak = weekRaw.reduce((m, d) => Math.max(m, d.rev), 0);
  const weekDays = weekRaw.map((d) => ({
    ...d,
    pct: Math.round((d.rev / weekMax) * 100),
    isPeak: weekPeak > 0 && d.rev === weekPeak,
  }));
  const targetPct = dailyTarget
    ? Math.min(100, (dailyTarget / weekMax) * 100)
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Summary KPI Cards (3 Cards) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* KPI 1: Net Sales */}
        <div className="relative overflow-hidden rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
              Total Penjualan Bersih
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lp-primary/10 text-lp-primary">
              <Icon name="payments" className="text-[20px]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-lp-sans text-sm font-semibold text-lp-tertiary">Rp</span>
            <span className="font-lp-mono text-2xl font-bold text-lp-on-surface">
              {netSales === null ? '—' : formatNumber(netSales)}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-lp-surface-container/60 text-xs">
            <span className="flex items-center gap-2 text-[11px] text-lp-tertiary">
              <Delta pct={netDelta} />
              Periode {applied.dateFrom} — {applied.dateTo}
            </span>
            {dailyTarget !== null && (
              <span className="text-[11px] text-lp-tertiary">
                Target harian {formatIDR(dailyTarget)}
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Total Receipts & AOV */}
        <div className="relative overflow-hidden rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
              Total Transaksi &amp; Struk
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lp-secondary-container/20 text-lp-secondary">
              <Icon name="receipt" className="text-[20px]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-lp-mono text-2xl font-bold text-lp-on-surface">
              {totalOrders === null ? '—' : formatNumber(totalOrders)}
            </span>
            <span className="text-sm font-semibold text-lp-tertiary">Struk</span>
          </div>
          <div className="mt-4 flex items-center justify-between pt-2 border-t border-lp-surface-container/60 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-lp-surface-container-high px-2 py-0.5 text-[11px] font-bold text-lp-secondary font-lp-mono">
              <Icon name="local_cafe" className="text-[13px]" />
              <span>{aov === null ? '—' : formatIDR(aov)}</span>
            </span>
            <span className="flex items-center gap-2 text-[11px] text-lp-tertiary">
              <Delta pct={ordersDelta} />
              Transaksi vs periode lalu
            </span>
          </div>
        </div>

        {/* KPI 3: Gross Profit & Margin */}
        <div className="relative overflow-hidden rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
              Gross Profit / Margin Kotor
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lp-surface-container-high text-lp-tertiary">
              <Icon name="donut_small" className="text-[20px]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-lp-sans text-sm font-semibold text-lp-tertiary">Rp</span>
            <span className="font-lp-mono text-2xl font-bold text-lp-on-surface">
              {grossProfit === null ? '—' : formatNumber(grossProfit)}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between pt-2 border-t border-lp-surface-container/60 text-xs">
            {profit ? (
              <>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-lp-primary-container px-2 py-0.5 text-[11px] font-bold text-lp-on-primary-container">
                  Margin {profit.grossMarginPct.toFixed(1)}%
                </span>
                <span className="text-[11px] text-lp-tertiary">
                  HPP: <strong className="font-lp-mono">{formatIDR(cogs ?? 0)}</strong>
                  {profit.costCoveragePct < 100 && (
                    <> · cakupan resep {profit.costCoveragePct.toFixed(0)}%</>
                  )}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-lp-tertiary">Belum ada data HPP</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Weekly Sales Trend & Target Chart (Stitch Bar Chart) */}
      <div className="flex flex-col gap-4 rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-lp-on-surface">
                Tren Penjualan Mingguan &amp; Perbandingan Target
              </h2>
              <span className="rounded bg-lp-surface-container-high px-2 py-0.5 text-[10px] font-bold text-lp-primary">
                Aktif
              </span>
            </div>
            <p className="text-xs text-lp-tertiary mt-0.5">
              Performa omzet harian 7 hari terakhir
              {dailyTarget !== null
                ? ` vs target harian ${formatIDR(dailyTarget)}`
                : ' (target harian belum diatur)'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-lp-primary" />
              <span className="text-lp-on-surface font-medium">Realisasi Omzet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-4 rounded-full bg-lp-secondary-container" />
              <span className="text-lp-on-surface font-medium">Garis Target</span>
            </div>
          </div>
        </div>

        {/* Visualized Grid & Bars */}
        <div className="relative w-full overflow-x-auto py-2 scrollbar-thin">
          <div className="min-w-[640px] flex flex-col gap-2">
            <div className="flex justify-between items-center text-[11px] text-lp-tertiary px-2">
              <span>Skala: Rp 0 - {formatIDR(weekMax)}</span>
              {dailyTarget !== null && (
                <span className="text-lp-secondary font-bold">
                  Target Harian: {formatIDR(dailyTarget)}
                </span>
              )}
            </div>

            <div className="relative h-64 w-full rounded-xl bg-lp-surface-low/70 p-4 flex items-end justify-between gap-4">
              {/* Target Line Reference */}
              {targetPct !== null && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-0 flex items-center px-4"
                  style={{ bottom: `${targetPct}%` }}
                >
                  <div className="w-full border-t-2 border-dashed border-lp-secondary-container/70" />
                </div>
              )}

              {/* Day Bars */}
              {weekDays.map((d, index) => (
                <div
                  key={index}
                  className="group relative z-10 flex h-full flex-1 flex-col items-center justify-end"
                >
                  {/* Hover Tooltip */}
                  <div className="pointer-events-none absolute bottom-full mb-2.5 hidden flex-col items-center z-30 whitespace-nowrap rounded-lg bg-lp-inverse-surface px-2.5 py-1.5 text-xs text-lp-inverse-on-surface shadow-xl group-hover:flex transition-all">
                    <span className="font-lp-mono font-bold text-lp-primary-fixed">
                      {formatIDR(d.rev)}
                    </span>
                    <span className="text-[10px] text-lp-inverse-on-surface/80">
                      {formatNumber(d.orders)} Struk {d.isPeak ? '· Puncak' : ''}
                    </span>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-lp-inverse-surface" />
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full max-w-[44px] rounded-t-md transition-all duration-200 cursor-pointer flex items-end justify-center pb-1 ${
                      d.isPeak
                        ? 'bg-lp-primary shadow-md hover:bg-lp-primary-container'
                        : 'bg-lp-primary/80 hover:bg-lp-primary'
                    }`}
                    style={{ height: `${d.pct}%` }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 font-lp-mono text-[10px] font-bold text-lp-on-primary transition-opacity">
                      {(d.rev / 1000000).toFixed(1)}jt
                    </span>
                  </div>

                  <span
                    className={`mt-2 text-xs select-none ${
                      d.isPeak ? 'font-bold text-lp-on-surface' : 'text-lp-tertiary font-medium'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Breakdown: 2-Column Responsive Grid (7 : 5) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column (7 cols): Sales by Category */}
        <div className="flex flex-col justify-between rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm xl:col-span-7">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-lp-on-surface">
                  Penjualan per Kategori Menu
                </h3>
                <p className="text-xs text-lp-tertiary">
                  Kontribusi omzet kategori menu utama outlet
                </p>
              </div>
              <Button
                asChild
                variant="ghost"
                className="h-8 gap-1 rounded-lg bg-lp-surface-low px-2.5 text-xs font-semibold text-lp-primary hover:bg-lp-surface-container"
              >
                <Link href="/menu">
                  <span>Kelola Menu</span>
                  <Icon name="arrow_forward" className="text-[15px]" />
                </Link>
              </Button>
            </div>

            {/* Category Table */}
            <div className="overflow-x-auto mt-1 scrollbar-thin">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="rounded-lg bg-lp-surface-low text-lp-tertiary font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">Kategori / Menu Utama</th>
                    <th className="py-2.5 px-3 text-center">Kuantitas</th>
                    <th className="py-2.5 px-3 text-right">Total Gross Sales</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Kontribusi %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lp-surface-container/60">
                  {categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-xs text-lp-tertiary"
                      >
                        Belum ada penjualan per kategori pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat, i) => (
                      <tr key={i} className="hover:bg-lp-surface-low/50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lp-primary/10 text-lp-primary">
                              <Icon name="coffee" className="text-[18px]" />
                            </div>
                            <span className="font-semibold text-lp-on-surface">{cat.category}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-lp-mono font-medium text-lp-on-surface">
                          {formatNumber(cat.soldQty)} item
                        </td>
                        <td className="py-3 px-3 text-right font-lp-mono font-bold text-lp-on-surface">
                          {formatIDR(cat.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-block rounded-full bg-lp-surface-container-high px-2 py-0.5 font-lp-mono font-bold text-lp-on-surface text-[10px]">
                            {grossSales && grossSales > 0
                              ? ((cat.revenue / grossSales) * 100).toFixed(1)
                              : '0'}
                            %
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-lp-surface-low px-3.5 py-2.5 text-xs text-lp-tertiary border border-lp-surface-container/60">
              <span>
                Total Terjual:{' '}
                <strong className="font-lp-mono font-bold text-lp-on-surface">
                  {formatNumber(categoryQty)} Pcs Menu
                </strong>
              </span>
              <span>
                Total Bruto:{' '}
                <strong className="font-lp-mono font-bold text-lp-primary">
                  {formatIDR(categoryRevenue)}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Payment Channels & Settlement */}
        <div className="flex flex-col justify-between rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm xl:col-span-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-lp-on-surface">
                  Metode &amp; Saluran Pembayaran
                </h3>
                <p className="text-xs text-lp-tertiary">
                  Distribusi settlement kasir dan gateway
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lp-primary-container text-lp-on-primary-container">
                <Icon name="account_balance_wallet" className="text-[20px]" />
              </div>
            </div>

            {/* Segmented Progress Bar */}
            {methodRows.length > 0 && cashlessPct !== null && (
              <div className="flex flex-col gap-1.5">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-lp-surface-low">
                  {methodRows.map((row) => (
                    <div
                      key={row.label}
                      className={`h-full ${row.color}`}
                      style={{ width: `${row.share}%` }}
                      title={`${row.label} ${row.share.toFixed(0)}%`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-lp-tertiary font-medium">
                  <span>Non-Tunai: {cashlessPct.toFixed(0)}%</span>
                  <span>Uang Fisik: {(100 - cashlessPct).toFixed(0)}%</span>
                </div>
              </div>
            )}

            {/* Channels List */}
            <div className="flex flex-col gap-2 pt-1 text-xs">
              {methodRows.length === 0 ? (
                <p className="py-4 text-center text-xs text-lp-tertiary">
                  Belum ada transaksi pembayaran pada periode ini.
                </p>
              ) : (
                methodRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-lg bg-lp-surface-low p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${row.color}`} />
                      <div className="flex flex-col">
                        <span className="font-semibold text-lp-on-surface">{row.label}</span>
                        <span className="text-[10px] text-lp-tertiary">
                          {row.count} Transaksi
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-lp-mono font-bold text-lp-on-surface">
                        {formatIDR(row.amount)}
                      </div>
                      <span className="font-lp-mono text-[10px] font-bold text-lp-primary">
                        {row.share.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reconciliation Badge */}
          {cashDrawer && (
            <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-lp-primary/20 bg-lp-primary/10 p-3 text-xs">
              <Icon name="verified" className="text-[22px] text-lp-primary shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-lp-primary">
                  {cashDrawer.variance === 0
                    ? 'Kas Drawer Seimbang'
                    : `Selisih Kas ${formatIDR(cashDrawer.variance)}`}
                </span>
                <span className="text-[11px] text-lp-tertiary">
                  Tercatat {formatIDR(cashDrawer.expectedCash)} · Dihitung{' '}
                  {formatIDR(cashDrawer.countedCash)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Section: Daily Cashier Shift Summary */}
      <div className="flex flex-col gap-4 rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lp-primary/10 text-lp-primary">
              <Icon name="point_of_sale" className="text-[20px]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-lp-on-surface">
                Ringkasan Shift Kasir Hari Ini
              </h3>
              <p className="text-xs text-lp-tertiary">
                Audit rekonsiliasi kas tunai dan operasional kasir harian
              </p>
            </div>
          </div>
          <span className="rounded-full bg-lp-primary-container px-3 py-1 text-xs font-semibold text-lp-on-primary-container">
            {shifts.length} Shift Terakhir
          </span>
        </div>

        {shifts.length === 0 ? (
          <p className="text-sm text-lp-tertiary">
            Belum ada riwayat shift pada outlet ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {shifts.slice(0, 4).map((shift) => {
              const opened = new Date(shift.openedAt);
              const closed = shift.closedAt ? new Date(shift.closedAt) : null;
              const fmtTime = (d: Date) =>
                d.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              const variance =
                closed && shift.expectedCash !== null
                  ? (shift.closingCash ?? 0) - shift.expectedCash
                  : null;
              return (
                <div
                  key={shift.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-lp-surface-container/70 bg-lp-surface-low p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lp-primary/10 text-lp-primary">
                      <Icon name="schedule" className="text-[18px]" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-lp-on-surface">
                          {shift.shiftName ?? 'Shift'} (
                          {fmtTime(opened)}
                          {closed ? ` - ${fmtTime(closed)}` : ' - sekarang'})
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            shift.status === 'open'
                              ? 'bg-lp-primary-fixed text-lp-on-primary-fixed'
                              : 'bg-lp-surface-container text-lp-tertiary'
                          }`}
                        >
                          {shift.status === 'open' ? 'Berjalan' : 'Selesai'}
                        </span>
                      </div>
                      <span className="text-xs text-lp-tertiary">
                        Kasir: {shift.employeeName ?? '—'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-lp-surface-container-lowest p-3 border border-lp-surface-container/60 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-lp-tertiary font-medium">
                        Modal Awal Kas
                      </span>
                      <span className="font-lp-mono font-bold text-lp-on-surface">
                        {formatIDR(shift.openingCash)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-lp-tertiary font-medium">
                        Kas Dihitung
                      </span>
                      <span className="font-lp-mono font-bold text-lp-primary">
                        {shift.closingCash === null
                          ? '—'
                          : formatIDR(shift.closingCash)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-lp-tertiary font-medium">
                        Selisih
                      </span>
                      <span
                        className={`font-lp-mono font-bold ${
                          variance !== null && variance !== 0
                            ? 'text-lp-error'
                            : 'text-lp-on-surface'
                        }`}
                      >
                        {variance === null ? '—' : formatIDR(variance)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OutletTab({ applied }: { applied: Range }) {
  const q = useQuery({
    queryKey: ['reports', 'outlet-comparison', applied.dateFrom, applied.dateTo],
    queryFn: () => outletComparison(applied.dateFrom, applied.dateTo),
  });

  return (
    <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-lp-on-surface">
        Perbandingan Kinerja Antar Cabang Outlet
      </h2>
      <Section
        q={q}
        render={(data) =>
          data.items.length === 0 ? (
            <p className="text-sm text-lp-tertiary">Belum ada data perbandingan cabang.</p>
          ) : (
            <DataTable
              head={['Cabang Outlet', 'Total Transaksi', 'Total Omzet', 'Rata-rata Basket']}
              align={['left', 'right', 'right', 'right']}
              rows={data.items.map((row) => [
                row.outletName,
                formatNumber(row.orderCount),
                formatIDR(row.revenue),
                formatIDR(row.averageOrderValue),
              ])}
            />
          )
        }
      />
    </div>
  );
}

export function SalesTab({ applied, prev }: { applied: Range; prev?: Range }) {
  return (
    <div className="flex flex-col gap-6">
      <SummaryTab applied={applied} prev={prev} />
      <OutletTab applied={applied} />
    </div>
  );
}