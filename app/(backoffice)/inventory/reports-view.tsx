'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import {
  expiringMaterials,
  inventoryValuation,
  listRawMaterialsPage,
  listStockMutations,
  productMargins,
  profitSummary,
} from '@/lib/api';
import { formatIDR, formatQty, monthISO, todayISO } from '@/lib/format';

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';
const inputCls =
  'h-10 rounded-lg bg-lp-surface-container-low px-3 text-sm font-medium text-lp-on-surface outline-none focus:bg-lp-surface-container';

const MUTATION_LABEL: Record<string, string> = {
  purchase: 'Pembelian',
  sale: 'Penjualan',
  adjustment: 'Penyesuaian',
  waste: 'Waste',
  transfer_in: 'Transfer masuk',
  transfer_out: 'Transfer keluar',
  opname: 'Opname',
};

export function ReportsView() {
  const [range, setRange] = useState({
    dateFrom: `${monthISO()}-01`,
    dateTo: todayISO(),
  });
  const [applied, setApplied] = useState(range);
  const [materialId, setMaterialId] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);

  const valuationQ = useQuery({
    queryKey: ['reports', 'inventory-valuation'],
    queryFn: inventoryValuation,
  });
  const profitQ = useQuery({
    queryKey: ['reports', 'profit', applied],
    queryFn: () => profitSummary(applied.dateFrom, applied.dateTo),
  });
  const marginsQ = useQuery({
    queryKey: ['reports', 'margins'],
    queryFn: productMargins,
  });
  const materialsQ = useQuery({
    queryKey: ['reports', 'materials'],
    queryFn: () => listRawMaterialsPage({ page: 1, limit: 100 }),
  });
  const ledgerQ = useQuery({
    queryKey: ['reports', 'ledger', materialId],
    queryFn: () => listStockMutations({ rawMaterialId: materialId, limit: 100 }),
    enabled: materialId !== '',
  });
  const expiryQ = useQuery({
    queryKey: ['reports', 'expiring', expiryDays],
    queryFn: () => expiringMaterials(expiryDays),
  });

  const valuation = valuationQ.data;
  const profit = profitQ.data;
  const margins = marginsQ.data ?? [];
  const materials = materialsQ.data?.items ?? [];
  const ledger = ledgerQ.data ?? [];

  const targetPct = margins.find(
    (row) => row.foodCostTargetPct !== undefined,
  )?.foodCostTargetPct;
  // Food cost for the period is weighted: total COGS ÷ total revenue.
  const actualFoodCostPct =
    profit && profit.revenue > 0
      ? (profit.cogs / profit.revenue) * 100
      : null;

  return (
    <div className="flex flex-col gap-4">
      <section className={`${PANEL} flex flex-wrap items-end gap-3`}>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-lp-on-surface-variant">
          Dari
          <input
            type="date"
            value={range.dateFrom}
            onChange={(event) =>
              setRange((value) => ({ ...value, dateFrom: event.target.value }))
            }
            aria-label="Laporan dari tanggal"
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-lp-on-surface-variant">
          Sampai
          <input
            type="date"
            value={range.dateTo}
            onChange={(event) =>
              setRange((value) => ({ ...value, dateTo: event.target.value }))
            }
            aria-label="Laporan sampai tanggal"
            className={inputCls}
          />
        </label>
        <button
          type="button"
          onClick={() => setApplied(range)}
          disabled={profitQ.isFetching}
          className="h-10 rounded-lg bg-lp-primary px-4 text-sm font-bold text-lp-on-primary transition hover:bg-lp-primary-container disabled:opacity-60"
        >
          {profitQ.isFetching ? 'Memuat…' : 'Terapkan'}
        </button>
        <p className="ml-auto text-[11px] text-lp-tertiary">
          Metode biaya: rata-rata bergerak · per outlet
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={PANEL}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            Nilai Persediaan
          </span>
          <div className="mt-1 font-lp-mono text-xl font-bold text-lp-on-surface">
            {formatIDR(valuation?.totalAssetValue ?? 0)}
          </div>
          <span className="text-[11px] text-lp-tertiary">
            {valuation?.itemCount ?? 0} bahan · {valuation?.criticalCount ?? 0}{' '}
            kritis
          </span>
        </div>
        <div className={PANEL}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            Laba Kotor ({applied.dateFrom} → {applied.dateTo})
          </span>
          <div className="mt-1 font-lp-mono text-xl font-bold text-lp-on-surface">
            {formatIDR(profit?.grossProfit ?? 0)}
          </div>
          <span className="text-[11px] text-lp-tertiary">
            margin {profit ? profit.grossMarginPct.toFixed(1) : '0.0'}% · omzet{' '}
            {formatIDR(profit?.revenue ?? 0)}
          </span>
        </div>
        <div className={PANEL}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            HPP Terjual + Waste
          </span>
          <div className="mt-1 font-lp-mono text-xl font-bold text-lp-on-surface">
            {formatIDR(profit?.cogs ?? 0)}
          </div>
          <span className="text-[11px] text-lp-tertiary">
            waste {formatIDR(profit?.wasteCost ?? 0)}
            {profit && profit.costCoveragePct < 100
              ? ` · cakupan biaya ${profit.costCoveragePct.toFixed(0)}% (${profit.uncostedItems} item tanpa resep)`
              : ''}
          </span>
        </div>
        <div className={PANEL}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            Food Cost (periode)
          </span>
          <div className="mt-1 font-lp-mono text-xl font-bold text-lp-on-surface">
            {actualFoodCostPct === null
              ? '—'
              : `${actualFoodCostPct.toFixed(1)}%`}
          </div>
          <span className="text-[11px] text-lp-tertiary">
            {targetPct ? `target < ${targetPct}%` : 'target belum diatur'}
          </span>
        </div>
      </section>

      <section className={PANEL}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-lp-on-surface">
            Harga Jual Ideal per Menu
          </h2>
          <span className="text-[11px] text-lp-tertiary">
            ideal = HPP ÷ target food cost
          </span>
        </div>
        {marginsQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
        ) : margins.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">
            Belum ada produk dengan resep untuk dihitung.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Menu</th>
                  <th className="pb-2 text-right">Harga Jual</th>
                  <th className="pb-2 text-right">HPP</th>
                  <th className="pb-2 text-right">Food Cost</th>
                  <th className="pb-2 text-right">Harga Ideal</th>
                  <th className="pb-2 text-right">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {margins.map((row) => {
                  const gap =
                    row.idealPrice === null || row.idealPrice === undefined
                      ? null
                      : row.price - row.idealPrice;
                  const under =
                    row.foodCostPct !== null &&
                    row.foodCostPct !== undefined &&
                    targetPct !== undefined &&
                    row.foodCostPct > targetPct;
                  return (
                    <tr
                      key={row.productId}
                      className="border-t border-lp-surface-container"
                    >
                      <td className="py-2 text-lp-on-surface">
                        {row.productName}
                      </td>
                      <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                        {formatIDR(row.price)}
                      </td>
                      <td className="py-2 text-right font-lp-mono text-lp-on-surface-variant">
                        {formatIDR(row.cogs)}
                      </td>
                      <td
                        className={`py-2 text-right font-lp-mono ${
                          under ? 'text-lp-error' : 'text-lp-primary'
                        }`}
                      >
                        {row.foodCostPct === null ||
                        row.foodCostPct === undefined
                          ? '—'
                          : `${row.foodCostPct.toFixed(1)}%`}
                      </td>
                      <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                        {row.idealPrice == null ? '—' : formatIDR(row.idealPrice)}
                      </td>
                      <td
                        className={`py-2 text-right font-lp-mono ${
                          gap !== null && gap < 0
                            ? 'text-lp-error'
                            : 'text-lp-tertiary'
                        }`}
                      >
                        {gap === null
                          ? '—'
                          : `${gap >= 0 ? '+' : ''}${formatIDR(gap)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={PANEL}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-lp-on-surface">
            Mendekati Kedaluwarsa
          </h2>
          <select
            value={expiryDays}
            onChange={(event) => setExpiryDays(Number(event.target.value))}
            aria-label="Rentang hari kedaluwarsa"
            className={inputCls}
          >
            <option value={7}>7 hari</option>
            <option value={14}>14 hari</option>
            <option value={30}>30 hari</option>
          </select>
        </div>

        {expiryQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
        ) : (expiryQ.data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">
            Tidak ada bahan yang mendekati kedaluwarsa dalam {expiryDays} hari.
          </p>
        ) : (
          <>
            <p className="mb-2 text-[11px] text-lp-tertiary">
              {expiryQ.data?.expiredCount ?? 0} sudah kedaluwarsa ·{' '}
              {expiryQ.data?.soonCount ?? 0} mendekati
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-lp-tertiary">
                    <th className="pb-2">Bahan</th>
                    <th className="pb-2">Sumber</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2">Kedaluwarsa</th>
                    <th className="pb-2 text-right">Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {(expiryQ.data?.items ?? []).map((row, index) => (
                    <tr
                      key={`${row.source}-${row.rawMaterialId}-${index}`}
                      className="border-t border-lp-surface-container"
                    >
                      <td className="py-2 text-lp-on-surface">{row.name}</td>
                      <td className="py-2 text-[11px] text-lp-tertiary">
                        {row.source === 'batch'
                          ? `Batch${row.lot ? ` ${row.lot}` : ''}`
                          : 'Bahan'}
                      </td>
                      <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                        {formatQty(row.qty)} {row.unit}
                      </td>
                      <td className="py-2 text-lp-on-surface-variant">
                        {row.expiresAt
                          ? new Date(row.expiresAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            row.status === 'expired'
                              ? 'bg-lp-error-container text-lp-on-error-container'
                              : 'bg-lp-secondary-fixed/60 text-lp-on-secondary-container'
                          }`}
                        >
                          {row.daysLeft === null
                            ? '—'
                            : row.daysLeft < 0
                              ? `${Math.abs(row.daysLeft)} hari lalu`
                              : `${row.daysLeft} hari`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className={PANEL}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-lp-on-surface">
            Kartu Stok
          </h2>
          <select
            value={materialId}
            onChange={(event) => setMaterialId(event.target.value)}
            aria-label="Pilih bahan untuk kartu stok"
            className={inputCls}
          >
            <option value="">Pilih bahan…</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </div>

        {materialId === '' ? (
          <p className="text-sm text-lp-on-surface-variant">
            Pilih bahan untuk melihat riwayat masuk/keluar.
          </p>
        ) : ledgerQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
        ) : ledger.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">
            Belum ada pergerakan stok untuk bahan ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Tanggal</th>
                  <th className="pb-2">Jenis</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Sebelum</th>
                  <th className="pb-2 text-right">Sesudah</th>
                  <th className="pb-2 text-right">Harga</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-lp-surface-container"
                  >
                    <td className="py-2 text-lp-on-surface-variant">
                      {new Date(row.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 text-lp-on-surface">
                      {MUTATION_LABEL[row.mutationType] ?? row.mutationType}
                    </td>
                    <td
                      className={`py-2 text-right font-lp-mono ${
                        row.qty < 0 ? 'text-lp-error' : 'text-lp-primary'
                      }`}
                    >
                      {row.qty > 0 ? '+' : ''}
                      {formatQty(row.qty)} {row.unit}
                    </td>
                    <td className="py-2 text-right font-lp-mono text-lp-on-surface-variant">
                      {formatQty(row.qtyBefore)}
                    </td>
                    <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                      {formatQty(row.qtyAfter)}
                    </td>
                    <td className="py-2 text-right font-lp-mono text-lp-on-surface-variant">
                      {row.unitCost === null ? '—' : formatIDR(row.unitCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {profitQ.isError && (
        <p className="text-xs text-lp-error">
          <Icon name="error" className="mr-1 align-middle text-[14px]" />
          Gagal memuat laporan laba.
        </p>
      )}
    </div>
  );
}
