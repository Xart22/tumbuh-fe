'use client';

import { useQuery } from '@tanstack/react-query';
import { breakEven, cashFlow, discountsVoids, profitLoss, wasteReport } from '@/lib/api';
import { formatIDR, formatNumber } from '@/lib/format';
import { Section, MetricCard, DataRow, DataTable } from '../reports-primitives';
import type { Range } from '../report-utils';

function FinanceTab({ applied, prev }: { applied: Range; prev?: Range }) {
  const month = applied.dateFrom.slice(0, 7);
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
  const cashDateLabel = new Date(`${applied.dateTo}T00:00:00`).toLocaleDateString(
    'id-ID',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );
  const profitQ = useQuery({
    queryKey: ['reports', 'profit-loss', applied.dateFrom, applied.dateTo],
    queryFn: () => profitLoss(applied.dateFrom, applied.dateTo),
  });
  const prevProfitQ = useQuery({
    queryKey: ['reports', 'profit-loss', 'prev', prev?.dateFrom, prev?.dateTo],
    queryFn: () => profitLoss(prev!.dateFrom, prev!.dateTo),
    enabled: Boolean(prev),
  });
  const cashQ = useQuery({
    queryKey: ['reports', 'cash-flow', applied.dateTo],
    queryFn: () => cashFlow(applied.dateTo),
  });
  const beQ = useQuery({
    queryKey: ['reports', 'break-even', month],
    queryFn: () => breakEven(month),
  });
  const prevData = prevProfitQ.data ?? null;
  const pctDelta = (curr: number, base?: number) =>
    base && base !== 0 ? ((curr - base) / base) * 100 : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-lp-on-surface">Laba Rugi (P&amp;L)</h2>
        <Section
          q={profitQ}
          render={(data) => (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Omzet Penjualan"
                  value={formatIDR(data.grossSales)}
                  delta={pctDelta(data.grossSales, prevData?.grossSales)}
                />
                <MetricCard label="HPP (COGS)" value={formatIDR(data.cogs)} />
                <MetricCard
                  label="Laba Kotor"
                  value={formatIDR(data.grossProfit)}
                  delta={pctDelta(data.grossProfit, prevData?.grossProfit)}
                />
                <MetricCard
                  label="Laba Bersih"
                  value={formatIDR(data.netProfit)}
                  delta={pctDelta(data.netProfit, prevData?.netProfit)}
                />
              </div>
              <div className="flex flex-col gap-2.5 text-xs">
                <DataRow label="Beban Operasional" value={formatIDR(data.operationalExpenses)} />
                <DataRow label="Beban Gaji" value={formatIDR(data.salaryExpenses)} />
                <DataRow label="Beban Sewa" value={formatIDR(data.rentExpense)} />
                <DataRow label="Beban Utilitas" value={formatIDR(data.utilityExpense)} />
                <DataRow label="Beban Lain-lain" value={formatIDR(data.otherExpenses)} />
                <div className="my-1 border-t border-lp-surface-container" />
                <DataRow label="Total Beban" value={formatIDR(data.totalExpenses)} />
              </div>
              <p className="text-xs text-lp-tertiary">
                Margin kotor{' '}
                <strong className="font-lp-mono">{data.grossMargin.toFixed(1)}%</strong> ·
                margin bersih{' '}
                <strong className="font-lp-mono">{data.netMargin.toFixed(1)}%</strong>
              </p>
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-lp-on-surface">
            Arus Kas Harian ({cashDateLabel})
          </h2>
          <Section
            q={cashQ}
            render={(data) => (
              <div className="flex flex-col gap-2.5 text-xs">
                <DataRow label="Masuk (Penjualan)" value={formatIDR(data.cashIn.total)} />
                <DataRow label="Keluar (Belanja Bahan)" value={formatIDR(data.cashOut.purchases)} />
                <DataRow label="Keluar (Biaya Operasional)" value={formatIDR(data.cashOut.expenses)} />
                <div className="my-1 border-t border-lp-surface-container" />
                <DataRow label="Saldo Awal Kasir" value={formatIDR(data.openingBalance)} />
                <DataRow label="Saldo Akhir Kasir" value={formatIDR(data.closingBalance)} />
              </div>
            )}
          />
        </div>

        <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-lp-on-surface">
            Analisis Titik Impas (BEP) — {monthLabel}
          </h2>
          <Section
            q={beQ}
            render={(data) => (
              <div className="flex flex-col gap-2.5 text-xs">
                <DataRow label="Omzet Berjalan" value={formatIDR(data.revenue)} />
                <DataRow label="Biaya Tetap (Fixed Cost)" value={formatIDR(data.fixedCost)} />
                <DataRow label="Biaya Variabel" value={formatIDR(data.variableCost)} />
                <DataRow label="Margin Kontribusi" value={`${data.contributionMarginRatio.toFixed(1)}%`} />
                <div className="my-1 border-t border-lp-surface-container" />
                <DataRow label="Omzet Titik Impas (Target BEP)" value={formatIDR(data.breakEvenRevenue)} />
                <DataRow label="Pencapaian Target" value={`${data.achievementPct.toFixed(1)}%`} />
                <DataRow label="Laba Bersih Estimasi" value={formatIDR(data.profit)} />
              </div>
            )}
          />
        </div>
      </div>
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
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Total Kejadian Waste" value={formatNumber(data.recordCount)} />
            <MetricCard label="Total Biaya Kerusakan" value={formatIDR(data.totalCost)} />
          </div>

          <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-lp-on-surface">Waste per Bahan Baku</h2>
            {data.byMaterial.length === 0 ? (
              <p className="text-sm text-lp-tertiary">Belum ada catatan waste bahan pada periode ini.</p>
            ) : (
              <DataTable
                head={['Bahan Baku', 'Qty Terbuang', 'Estimasi Biaya']}
                align={['left', 'right', 'right']}
                rows={data.byMaterial.map((row) => [
                  row.rawMaterialName,
                  `${formatNumber(row.qty)} ${row.unit}`,
                  formatIDR(row.cost),
                ])}
              />
            )}
          </div>
        </div>
      )}
    />
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
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Diskon Diberikan" value={formatIDR(data.totalDiscount)} />
            <MetricCard label="Order Berdiskon" value={formatNumber(data.discountedOrders)} />
            <MetricCard label="Order Di-Void" value={formatNumber(data.voidedOrderCount)} />
            <MetricCard label="Nilai Kerugian Void" value={formatIDR(data.voidedItemValue)} />
          </div>

          <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-lp-on-surface">Rincian Item yang Di-Void</h2>
            {data.voidedItems.length === 0 ? (
              <p className="text-sm text-lp-tertiary">Tidak ada pembatalan item pada periode ini.</p>
            ) : (
              <DataTable
                head={['Produk', 'Qty', 'Total Kerugian']}
                align={['left', 'right', 'right']}
                rows={data.voidedItems.map((row) => [
                  row.productName ?? '—',
                  formatNumber(row.qty),
                  formatIDR(row.total),
                ])}
              />
            )}
          </div>
        </div>
      )}
    />
  );
}

export function ProfitTab({ applied, prev }: { applied: Range; prev?: Range }) {
  return (
    <div className="flex flex-col gap-6">
      <FinanceTab applied={applied} prev={prev} />
      <WasteTab applied={applied} />
      <DiscountsTab applied={applied} />
    </div>
  );
}