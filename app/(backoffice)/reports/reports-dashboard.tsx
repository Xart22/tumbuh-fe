'use client';

import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Alert, Button, Card, Field, Input, Spinner } from '@/components/pos-ui';
import {
  dailySummary,
  hourlySales,
  paymentMethodsBreakdown,
  salesSummary,
  topProducts,
} from '@/lib/api';
import { formatIDR, formatNumber, todayISO } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';

type Range = { dateFrom: string; dateTo: string };

export function ReportsDashboard() {
  const role = useAuthStore((s) => s.user?.role);
  const [range, setRange] = useState<Range>(() => {
    const today = todayISO();
    return { dateFrom: today, dateTo: today };
  });
  // Draft edits stay local; queries run against the applied range so every
  // "Terapkan" (and remount) hits cache instead of the network.
  const [applied, setApplied] = useState<Range>(range);

  const [dailyQ, salesQ, topsQ, hourlyQ, methodsQ] = useQueries({
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
        queryKey: ['reports', 'top', applied.dateFrom, applied.dateTo],
        queryFn: () => topProducts(applied.dateFrom, applied.dateTo, 10),
      },
      {
        queryKey: ['reports', 'hourly', applied.dateTo],
        queryFn: () => hourlySales(applied.dateTo),
      },
      {
        queryKey: ['reports', 'methods', applied.dateFrom, applied.dateTo],
        queryFn: () => paymentMethodsBreakdown(applied.dateFrom, applied.dateTo),
      },
    ],
  });

  const daily = dailyQ.data ?? null;
  const sales = salesQ.data ?? null;
  const tops = topsQ.data ?? [];
  const hourly = hourlyQ.data ?? [];
  const methods = methodsQ.data ?? [];
  const loading =
    dailyQ.isPending ||
    salesQ.isPending ||
    topsQ.isPending ||
    hourlyQ.isPending ||
    methodsQ.isPending;
  const failed = [dailyQ, salesQ, topsQ, hourlyQ, methodsQ].find((q) => q.isError);
  const error = failed
    ? failed.error instanceof Error
      ? failed.error.message
      : 'Gagal memuat laporan.'
    : null;

  // BE gates every /v1/reports route with @Roles('owner', 'manager') —
  // showing the dashboard to a supervisor would just be a 403 wall.
  if (role && !['owner', 'manager'].includes(role)) {
    return (
      <div className="p-6">
        <Alert kind="error">
          Laporan hanya untuk owner dan manager.
        </Alert>
      </div>
    );
  }

  const peak = Math.max(...hourly.map((h) => h.revenue ?? 0), 1);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Dari">
          <Input
            type="date"
            value={range.dateFrom}
            onChange={(e) =>
              setRange((r) => ({ ...r, dateFrom: e.target.value }))
            }
          />
        </Field>
        <Field label="Sampai">
          <Input
            type="date"
            value={range.dateTo}
            onChange={(e) => setRange((r) => ({ ...r, dateTo: e.target.value }))}
          />
        </Field>
        <Button onClick={() => setApplied(range)} disabled={loading}>
          {loading ? 'Memuat…' : 'Terapkan'}
        </Button>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {loading ? (
        <Spinner label="Memuat laporan…" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Omzet hari terakhir"
              value={formatIDR(daily?.grossSales ?? 0)}
            />
            <Metric
              label="Transaksi"
              value={formatNumber(sales?.totalOrders ?? 0)}
            />
            <Metric
              label="Rata-rata / transaksi"
              value={formatIDR(sales?.averageOrderValue ?? 0)}
            />
            <Metric
              label="Diskon"
              value={formatIDR(sales?.discountAmount ?? 0)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Penjualan per jam
              </h2>
              {hourly.length === 0 ? (
                <p className="text-sm text-muted">Belum ada data.</p>
              ) : (
                <div className="flex h-40 items-end gap-1">
                  {hourly.map((row) => (
                    <div
                      key={row.hour}
                      className="flex flex-1 flex-col items-center gap-1"
                      title={`${row.hour}:00 · ${formatIDR(row.revenue ?? 0)}`}
                    >
                      <div
                        className="w-full rounded-t bg-teal-700"
                        style={{
                          height: `${Math.max(((row.revenue ?? 0) / peak) * 100, 2)}%`,
                        }}
                      />
                      <span className="text-[9px] text-muted">{row.hour}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Metode pembayaran
              </h2>
              {methods.length === 0 ? (
                <p className="text-sm text-muted">Belum ada data.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {methods.map((m) => (
                    <li
                      key={m.method}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted">{m.method}</span>
                      <span className="text-ink">
                        {formatIDR(m.amount ?? 0)}
                        {m.percentage !== undefined && (
                          <span className="ml-2 text-xs text-muted">
                            {m.percentage.toFixed(0)}%
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Produk terlaris
            </h2>
            {tops.length === 0 ? (
              <p className="text-sm text-muted">Belum ada penjualan.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2">Produk</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Omzet</th>
                  </tr>
                </thead>
                <tbody>
                  {tops.map((p, index) => (
                    <tr
                      key={p.productId ?? index}
                      className="border-t border-[var(--line)]"
                    >
                      <td className="py-2 text-ink">{p.name ?? '—'}</td>
                      <td className="py-2 text-right text-ink">
                        {formatNumber(p.qty ?? 0)}
                      </td>
                      <td className="py-2 text-right text-ink">
                        {formatIDR(p.revenue ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
    </Card>
  );
}
