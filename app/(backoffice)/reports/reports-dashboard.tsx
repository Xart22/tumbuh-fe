'use client';

import { useState } from 'react';
import {
  useQueries,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { Alert, Button, Card, Field, Input, Spinner } from '@/components/pos-ui';
import {
  breakEven,
  byOrderType,
  byTable,
  cashFlow,
  cashierSales,
  categorySales,
  dailySummary,
  discountsVoids,
  downloadSalesSummary,
  downloadTopProducts,
  employeeSales,
  hourlySales,
  listProducts,
  menuEngineering,
  outletComparison,
  paymentMethodsReport,
  payroll,
  productTrend,
  profitLoss,
  salesSummary,
  taxSummary,
  topProducts,
  wasteReport,
} from '@/lib/api';
import { formatIDR, formatNumber, monthISO, todayISO } from '@/lib/format';
import type {
  MenuEngineeringClass,
  ByOrderTypeReport,
} from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';

type Range = { dateFrom: string; dateTo: string };

type TabId =
  | 'ringkasan'
  | 'produk'
  | 'kasir'
  | 'operasional'
  | 'diskon'
  | 'keuangan'
  | 'pajak'
  | 'waste'
  | 'payroll'
  | 'outlet';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'produk', label: 'Produk' },
  { id: 'kasir', label: 'Kasir' },
  { id: 'operasional', label: 'Operasional' },
  { id: 'diskon', label: 'Diskon & Void' },
  { id: 'keuangan', label: 'Keuangan' },
  { id: 'pajak', label: 'Pajak' },
  { id: 'waste', label: 'Waste' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'outlet', label: 'Outlet' },
];

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'Dine-in',
  takeaway: 'Take away',
  delivery: 'Delivery',
};

const CLASS_LABELS: Record<MenuEngineeringClass, string> = {
  star: 'Star',
  plow_horse: 'Plow Horse',
  puzzle: 'Puzzle',
  dog: 'Dog',
};

const CLASS_TONE: Record<MenuEngineeringClass, string> = {
  star: 'bg-teal-900 text-teal-200',
  plow_horse: 'bg-amber-950 text-amber-200',
  puzzle: 'bg-indigo-950 text-indigo-200',
  dog: 'bg-red-950 text-red-300',
};

export function ReportsDashboard() {
  const role = useAuthStore((s) => s.user?.role);
  const [tab, setTab] = useState<TabId>('ringkasan');
  const [range, setRange] = useState<Range>(() => {
    const today = todayISO();
    return { dateFrom: today, dateTo: today };
  });
  // Draft edits stay local; queries run against the applied range so every
  // "Terapkan" (and remount) hits cache instead of the network.
  const [applied, setApplied] = useState<Range>(range);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // BE gates every /v1/reports route with @Roles('owner', 'manager') —
  // showing the dashboard to a supervisor would just be a 403 wall.
  if (role && !['owner', 'manager'].includes(role)) {
    return (
      <div className="p-6">
        <Alert kind="error">Laporan hanya untuk owner dan manager.</Alert>
      </div>
    );
  }

  async function exportCsv(
    kind: 'sales' | 'top',
    run: () => Promise<Blob>,
  ) {
    setExporting(kind);
    setExportError(null);
    try {
      const blob = await run();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = kind === 'sales' ? 'sales-summary.csv' : 'top-products.csv';
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
        <Button onClick={() => setApplied(range)}>Terapkan</Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="ghost"
            disabled={exporting !== null}
            onClick={() =>
              exportCsv('sales', () =>
                downloadSalesSummary(applied.dateFrom, applied.dateTo),
              )
            }
          >
            {exporting === 'sales' ? 'Mengunduh…' : 'Ekspor Penjualan (CSV)'}
          </Button>
          <Button
            variant="ghost"
            disabled={exporting !== null}
            onClick={() =>
              exportCsv('top', () =>
                downloadTopProducts(applied.dateFrom, applied.dateTo),
              )
            }
          >
            {exporting === 'top' ? 'Mengunduh…' : 'Ekspor Produk (CSV)'}
          </Button>
        </div>
      </div>

      {exportError && <Alert kind="error">{exportError}</Alert>}

      <nav className="flex flex-wrap gap-1" aria-label="Kategori laporan">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? 'bg-teal-600 text-white'
                : 'border border-[var(--line)] text-muted hover:bg-[var(--panel-2)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'ringkasan' && <SummaryTab applied={applied} />}
      {tab === 'produk' && <ProductsTab applied={applied} />}
      {tab === 'kasir' && <CashierTab applied={applied} />}
      {tab === 'operasional' && <OpsTab applied={applied} />}
      {tab === 'diskon' && <DiscountsTab applied={applied} />}
      {tab === 'keuangan' && <FinanceTab applied={applied} />}
      {tab === 'pajak' && <TaxTab />}
      {tab === 'waste' && <WasteTab applied={applied} />}
      {tab === 'payroll' && <PayrollTab />}
      {tab === 'outlet' && <OutletTab applied={applied} />}
    </main>
  );
}

function Section<T>({
  q,
  render,
}: {
  q: UseQueryResult<T>;
  render: (data: T) => React.ReactNode;
}) {
  if (q.isPending) return <Spinner />;
  if (q.isError) {
    return (
      <Alert kind="error">
        {q.error instanceof Error ? q.error.message : 'Gagal memuat laporan.'}
      </Alert>
    );
  }
  if (q.data === undefined) {
    return <p className="text-sm text-muted">Belum ada data.</p>;
  }
  return <>{render(q.data)}</>;
}

function SummaryTab({ applied }: { applied: Range }) {
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
        queryFn: () => paymentMethodsReport(applied.dateFrom, applied.dateTo),
      },
    ],
  });

  const daily = dailyQ.data ?? null;
  const sales = salesQ.data ?? null;
  const tops = topsQ.data ?? [];
  const hourly = hourlyQ.data ?? [];
  const methods = methodsQ.data?.methods ?? [];
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

  const peak = Math.max(...hourly.map((h) => h.revenue ?? 0), 1);

  return (
    <div className="flex flex-col gap-4">
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
                <Rows
                  rows={methods.map((m) => [
                    m.method,
                    `${formatIDR(m.amount ?? 0)}${
                      m.percentage !== undefined
                        ? ` · ${m.percentage.toFixed(0)}%`
                        : ''
                    }`,
                  ])}
                />
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
              <DataTable
                head={['Produk', 'Qty', 'Omzet']}
                align={['left', 'right', 'right']}
                rows={tops.map((p) => [
                  p.name ?? '—',
                  formatNumber(p.qty ?? 0),
                  formatIDR(p.revenue ?? 0),
                ])}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function ProductsTab({ applied }: { applied: Range }) {
  const categoriesQ = useQuery({
    queryKey: ['reports', 'by-category', applied.dateFrom, applied.dateTo],
    queryFn: () => categorySales(applied.dateFrom, applied.dateTo),
  });
  const engineeringQ = useQuery({
    queryKey: ['reports', 'menu-engineering', applied.dateFrom, applied.dateTo],
    queryFn: () => menuEngineering(applied.dateFrom, applied.dateTo),
  });
  const productsQ = useQuery({
    queryKey: ['reports', 'products-for-trend'],
    queryFn: listProducts,
  });
  const [productId, setProductId] = useState('');
  const trendQ = useQuery({
    queryKey: ['reports', 'product-trend', productId],
    queryFn: () => productTrend(productId, 30),
    enabled: productId !== '',
  });

  const byCategory = categoriesQ.data ?? [];
  const products = productsQ.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Penjualan per kategori
        </h2>
        {categoriesQ.isPending ? (
          <Spinner />
        ) : categoriesQ.isError ? (
          <Alert kind="error">
            {categoriesQ.error instanceof Error
              ? categoriesQ.error.message
              : 'Gagal memuat.'}
          </Alert>
        ) : byCategory.length === 0 ? (
          <p className="text-sm text-muted">Belum ada data.</p>
        ) : (
          <DataTable
            head={['Kategori', 'Qty', 'Omzet']}
            align={['left', 'right', 'right']}
            rows={byCategory.map((row) => [
              row.category,
              formatNumber(row.soldQty),
              formatIDR(row.revenue),
            ])}
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Menu engineering
        </h2>
        <Section
          q={engineeringQ}
          render={(data) =>
            data.items.length === 0 ? (
              <p className="text-sm text-muted">Belum ada penjualan.</p>
            ) : (
              <>
                {data.thresholds && (
                  <p className="mb-3 text-xs text-muted">
                    Ambang: omzet rata-rata {formatIDR(data.thresholds.avgRevenue)}{' '}
                    · margin rata-rata{' '}
                    {formatIDR(data.thresholds.avgMargin)}
                  </p>
                )}
                <DataTable
                  head={['Produk', 'Qty', 'Omzet', 'Margin', 'Klasifikasi']}
                  align={['left', 'right', 'right', 'right', 'center']}
                  rows={data.items.map((item) => [
                    item.productName,
                    formatNumber(item.soldQty),
                    formatIDR(item.revenue),
                    formatIDR(item.margin),
                    <span
                      key={item.productId}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CLASS_TONE[item.classification]}`}
                    >
                      {CLASS_LABELS[item.classification]}
                    </span>,
                  ])}
                />
              </>
            )
          }
        />
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Tren produk (30 hari)</h2>
          <Field label="Produk">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="min-w-56 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-ink outline-none focus:border-teal-600"
            >
              <option value="">Pilih produk…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {productId === '' ? (
          <p className="text-sm text-muted">Pilih produk untuk melihat tren.</p>
        ) : (
          <Section
            q={trendQ}
            render={(data) =>
              data.points.length === 0 ? (
                <p className="text-sm text-muted">Belum ada penjualan.</p>
              ) : (
                <DataTable
                  head={['Tanggal', 'Qty', 'Omzet']}
                  align={['left', 'right', 'right']}
                  rows={data.points.map((point) => [
                    point.date,
                    formatNumber(point.qty),
                    formatIDR(point.revenue),
                  ])}
                />
              )
            }
          />
        )}
      </Card>
    </div>
  );
}

function CashierTab({ applied }: { applied: Range }) {
  const byCashierQ = useQuery({
    queryKey: ['reports', 'by-cashier', applied.dateFrom, applied.dateTo],
    queryFn: () => cashierSales(applied.dateFrom, applied.dateTo),
  });
  const employeeQ = useQuery({
    queryKey: ['reports', 'employee-sales', applied.dateFrom, applied.dateTo],
    queryFn: () => employeeSales(applied.dateFrom, applied.dateTo),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Penjualan per kasir
        </h2>
        <Section
          q={byCashierQ}
          render={(rows) =>
            rows.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data.</p>
            ) : (
              <DataTable
                head={['Kasir', 'Transaksi', 'Omzet']}
                align={['left', 'right', 'right']}
                rows={rows.map((row) => [
                  row.cashier,
                  formatNumber(row.orderCount),
                  formatIDR(row.revenue),
                ])}
              />
            )
          }
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Kinerja karyawan
        </h2>
        <Section
          q={employeeQ}
          render={(data) =>
            data.employees.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data.</p>
            ) : (
              <DataTable
                head={[
                  'Nama',
                  'Transaksi',
                  'Lunas',
                  'Bruto',
                  'Diskon',
                  'Netto',
                ]}
                align={['left', 'right', 'right', 'right', 'right', 'right']}
                rows={data.employees.map((row) => [
                  row.cashierName,
                  formatNumber(row.orderCount),
                  formatNumber(row.paidOrders),
                  formatIDR(row.grossSales),
                  formatIDR(row.discountAmount),
                  formatIDR(row.netSales),
                ])}
              />
            )
          }
        />
      </Card>
    </div>
  );
}

function OpsTab({ applied }: { applied: Range }) {
  const typeQ = useQuery({
    queryKey: ['reports', 'by-order-type', applied.dateFrom, applied.dateTo],
    queryFn: () => byOrderType(applied.dateFrom, applied.dateTo),
  });
  const tableQ = useQuery({
    queryKey: ['reports', 'by-table', applied.dateFrom, applied.dateTo],
    queryFn: () => byTable(applied.dateFrom, applied.dateTo),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">Tipe pesanan</h2>
        <Section
          q={typeQ}
          render={(data: ByOrderTypeReport) =>
            data.items.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data.</p>
            ) : (
              <DataTable
                head={['Tipe', 'Transaksi', 'Omzet', 'Porsi']}
                align={['left', 'right', 'right', 'right']}
                rows={data.items.map((row) => [
                  row.orderType
                    ? (ORDER_TYPE_LABELS[row.orderType] ?? row.orderType)
                    : 'Tanpa tipe',
                  formatNumber(row.orderCount),
                  formatIDR(row.revenue),
                  `${row.sharePct.toFixed(1)}%`,
                ])}
              />
            )
          }
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">Penjualan per meja</h2>
        <Section
          q={tableQ}
          render={(data) =>
            data.items.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data.</p>
            ) : (
              <DataTable
                head={['Meja', 'Transaksi', 'Omzet', 'Rata-rata']}
                align={['left', 'right', 'right', 'right']}
                rows={data.items.map((row) => [
                  row.tableName,
                  formatNumber(row.orderCount),
                  formatIDR(row.revenue),
                  formatIDR(row.averageSpend),
                ])}
              />
            )
          }
        />
      </Card>
    </div>
  );
}

function DiscountsTab({ applied }: { applied: Range }) {
  const q = useQuery({
    queryKey: ['reports', 'discounts-voids', applied.dateFrom, applied.dateTo],
    queryFn: () => discountsVoids(applied.dateFrom, applied.dateTo),
  });

  return (
    <Section
      q={q}
      render={(data) => (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total diskon" value={formatIDR(data.totalDiscount)} />
            <Metric
              label="Order berdiskon"
              value={formatNumber(data.discountedOrders)}
            />
            <Metric
              label="Order void"
              value={formatNumber(data.voidedOrderCount)}
            />
            <Metric
              label="Nilai item void"
              value={formatIDR(data.voidedItemValue)}
            />
          </div>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Diskon per sumber
            </h2>
            {data.bySource.length === 0 ? (
              <p className="text-sm text-muted">Belum ada diskon.</p>
            ) : (
              <Rows
                rows={data.bySource.map((row) => [
                  row.source,
                  formatIDR(row.amount),
                ])}
              />
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Item di-void
            </h2>
            {data.voidedItems.length === 0 ? (
              <p className="text-sm text-muted">Belum ada item void.</p>
            ) : (
              <DataTable
                head={['Produk', 'Qty', 'Nilai']}
                align={['left', 'right', 'right']}
                rows={data.voidedItems.map((row) => [
                  row.productName ?? '—',
                  formatNumber(row.qty),
                  formatIDR(row.total),
                ])}
              />
            )}
          </Card>
        </div>
      )}
    />
  );
}

function FinanceTab({ applied }: { applied: Range }) {
  const month = applied.dateTo.slice(0, 7);
  const profitQ = useQuery({
    queryKey: ['reports', 'profit-loss', applied.dateFrom, applied.dateTo],
    queryFn: () => profitLoss(applied.dateFrom, applied.dateTo),
  });
  const cashQ = useQuery({
    queryKey: ['reports', 'cash-flow', applied.dateTo],
    queryFn: () => cashFlow(applied.dateTo),
  });
  const beQ = useQuery({
    queryKey: ['reports', 'break-even', month],
    queryFn: () => breakEven(month),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Laba rugi (periode)
        </h2>
        <Section
          q={profitQ}
          render={(data) => (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Omzet" value={formatIDR(data.revenue)} />
                <Metric label="COGS" value={formatIDR(data.cogs)} />
                <Metric label="Waste" value={formatIDR(data.wasteCost)} />
                <Metric
                  label="Laba kotor"
                  value={formatIDR(data.grossProfit)}
                />
              </div>
              <p className="text-xs text-muted">
                Margin kotor {data.grossMarginPct.toFixed(1)}% · cakupan biaya{' '}
                {data.costCoveragePct.toFixed(1)}% ({data.costedItems}/
                {data.itemCount} item ber-HPP)
              </p>
            </div>
          )}
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Arus kas harian
        </h2>
        <Section
          q={cashQ}
          render={(data) => (
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Masuk (penjualan)" value={formatIDR(data.cashIn.total)} />
              <Row
                label="Keluar (belanja)"
                value={formatIDR(data.cashOut.purchases)}
              />
              <Row
                label="Keluar (operasional)"
                value={formatIDR(data.cashOut.expenses)}
              />
              <Row label="Saldo awal" value={formatIDR(data.openingBalance)} />
              <Row label="Saldo akhir" value={formatIDR(data.closingBalance)} />
            </div>
          )}
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Titik impas ({month})
        </h2>
        <Section
          q={beQ}
          render={(data) => (
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Omzet" value={formatIDR(data.revenue)} />
              <Row label="Biaya tetap" value={formatIDR(data.fixedCost)} />
              <Row label="Biaya variabel" value={formatIDR(data.variableCost)} />
              <Row
                label="Margin kontribusi"
                value={`${data.contributionMarginRatio.toFixed(1)}%`}
              />
              <Row
                label="Omzet titik impas"
                value={formatIDR(data.breakEvenRevenue)}
              />
              <Row
                label="Pencapaian"
                value={`${data.achievementPct.toFixed(1)}%`}
              />
              <Row label="Laba" value={formatIDR(data.profit)} />
            </div>
          )}
        />
      </Card>
    </div>
  );
}

function TaxTab() {
  const [month, setMonth] = useState(monthISO());
  const q = useQuery({
    queryKey: ['reports', 'tax-summary', month],
    queryFn: () => taxSummary(month),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <Field label="Bulan">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </Field>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Rekap pajak ({month})
        </h2>
        <Section
          q={q}
          render={(data) => (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Order lunas"
                  value={formatNumber(data.paidOrderCount)}
                />
                <Metric
                  label="Omzet bruto"
                  value={formatIDR(data.grossRevenue)}
                />
                <Metric
                  label="PPN dipungut"
                  value={formatIDR(data.vatCollected)}
                />
                <Metric
                  label={`PPh final ${data.pphFinalRate}%`}
                  value={formatIDR(data.pphFinal)}
                />
              </div>
              {data.taxInvoices.length > 0 && (
                <DataTable
                  head={['No. Faktur', 'Pajak', 'Status']}
                  align={['left', 'right', 'left']}
                  rows={data.taxInvoices.map((inv) => [
                    inv.invoiceNumber,
                    formatIDR(inv.taxAmount),
                    inv.status,
                  ])}
                />
              )}
            </div>
          )}
        />
      </Card>
    </div>
  );
}

function WasteTab({ applied }: { applied: Range }) {
  const q = useQuery({
    queryKey: ['reports', 'waste', applied.dateFrom, applied.dateTo],
    queryFn: () => wasteReport(applied.dateFrom, applied.dateTo),
  });

  return (
    <Section
      q={q}
      render={(data) => (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Catatan waste" value={formatNumber(data.recordCount)} />
            <Metric label="Total biaya" value={formatIDR(data.totalCost)} />
          </div>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Per alasan
            </h2>
            {data.byReason.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data.</p>
            ) : (
              <DataTable
                head={['Alasan', 'Qty', 'Biaya']}
                align={['left', 'right', 'right']}
                rows={data.byReason.map((row) => [
                  row.reason,
                  formatNumber(row.qty),
                  formatIDR(row.cost),
                ])}
              />
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Per bahan
            </h2>
            {data.byMaterial.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data.</p>
            ) : (
              <DataTable
                head={['Bahan', 'Qty', 'Biaya']}
                align={['left', 'right', 'right']}
                rows={data.byMaterial.map((row) => [
                  row.rawMaterialName,
                  `${formatNumber(row.qty)} ${row.unit}`,
                  formatIDR(row.cost),
                ])}
              />
            )}
          </Card>
        </div>
      )}
    />
  );
}

function PayrollTab() {
  const [month, setMonth] = useState(monthISO());
  const q = useQuery({
    queryKey: ['reports', 'payroll', month],
    queryFn: () => payroll(month),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <Field label="Bulan">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </Field>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Rekap payroll ({month})
        </h2>
        <Section
          q={q}
          render={(rows) =>
            rows.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data.</p>
            ) : (
              <DataTable
                head={[
                  'Nama',
                  'Jam',
                  'Gaji pokok',
                  'Bayar waktu',
                  'Komisi',
                  'Total',
                ]}
                align={['left', 'right', 'right', 'right', 'right', 'right']}
                rows={rows.map((row) => [
                  row.employeeName,
                  formatNumber(row.hours),
                  formatIDR(row.baseSalary),
                  formatIDR(row.timePay),
                  formatIDR(row.commission),
                  formatIDR(row.grossPay),
                ])}
              />
            )
          }
        />
      </Card>
    </div>
  );
}

function OutletTab({ applied }: { applied: Range }) {
  const q = useQuery({
    queryKey: [
      'reports',
      'outlet-comparison',
      applied.dateFrom,
      applied.dateTo,
    ],
    queryFn: () => outletComparison(applied.dateFrom, applied.dateTo),
  });

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-ink">
        Perbandingan outlet
      </h2>
      <Section
        q={q}
        render={(data) =>
          data.items.length === 0 ? (
            <p className="text-sm text-muted">Belum ada data.</p>
          ) : (
            <DataTable
              head={['Outlet', 'Transaksi', 'Omzet', 'Rata-rata']}
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
    </Card>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function Rows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map(([label, value]) => (
        <li key={label}>
          <Row label={label} value={value} />
        </li>
      ))}
    </ul>
  );
}

function DataTable({
  head,
  rows,
  align = [],
}: {
  head: string[];
  rows: React.ReactNode[][];
  align?: Array<'left' | 'right' | 'center'>;
}) {
  const alignClass = (index: number) => {
    const a = align[index] ?? 'left';
    if (a === 'right') return 'text-right';
    if (a === 'center') return 'text-center';
    return 'text-left';
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-muted">
            {head.map((label, index) => (
              <th key={label} className={`pb-2 ${alignClass(index)}`}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-[var(--line)]">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`py-2 text-ink ${alignClass(cellIndex)}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
