'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import {
  adjustRawMaterialStock,
  createRawMaterial,
  deleteRawMaterial,
  listRawMaterialsPage,
  listUnits,
  productMargins,
  rawMaterialSummary,
  updateRawMaterial,
  type RawMaterialPageQuery,
} from '@/lib/api';
import { formatIDR, formatQty } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import type { RawMaterial, RawMaterialStatus } from '@/lib/types';
import {
  MaterialFormModal,
  StockAdjustModal,
  type MaterialFormValues,
  type StockAdjustValues,
} from './material-modals';
import { RecipeEditor } from './recipe-editor';
import { PurchaseOrderView } from './po-view';
import { OpnameView } from './opname-view';
import { ReportsView } from './reports-view';
import { WasteView } from './waste-view';

const PAGE_SIZE = 20;
const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';

type StatusFilter = '' | RawMaterialStatus;

const STATUS_LABEL: Record<RawMaterialStatus, string> = {
  critical: 'Kritis',
  low: 'Menipis',
  ok: 'Aman',
};

function statusChip(status: RawMaterialStatus): string {
  if (status === 'critical') {
    return 'bg-lp-error-container text-lp-on-error-container';
  }
  if (status === 'low') {
    return 'bg-lp-secondary-fixed/60 text-lp-on-secondary-container';
  }
  return 'bg-lp-primary-fixed/40 text-lp-on-primary-fixed';
}

export function InventoryView() {
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = Boolean(
    role && ['owner', 'manager', 'supervisor'].includes(role),
  );
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<
    'materials' | 'recipes' | 'purchase' | 'opname' | 'waste' | 'reports'
  >('materials');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [formModal, setFormModal] = useState<{
    material: RawMaterial | null;
  } | null>(null);
  const [adjustModal, setAdjustModal] = useState<RawMaterial | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query: RawMaterialPageQuery = {
    page,
    limit: PAGE_SIZE,
    search: debounced || undefined,
    category: category || undefined,
    status: status || undefined,
  };

  const materialsQ = useQuery({
    queryKey: ['inventory', 'materials', query],
    queryFn: () => listRawMaterialsPage(query),
  });
  // Full list for the recipe editor (cost per unit per selected row).
  const allMaterialsQ = useQuery({
    queryKey: ['inventory', 'materials', 'all'],
    queryFn: () => listRawMaterialsPage({ page: 1, limit: 100 }),
  });
  const unitsQ = useQuery({
    queryKey: ['units'],
    queryFn: listUnits,
  });
  const marginsQ = useQuery({
    queryKey: ['reports', 'margins'],
    queryFn: productMargins,
  });
  const summaryQ = useQuery({
    queryKey: ['inventory', 'materials', 'summary'],
    queryFn: rawMaterialSummary,
  });

  const materials = materialsQ.data?.items ?? [];
  const total = materialsQ.data?.total ?? 0;
  const totalPages = materialsQ.data?.totalPages ?? 1;
  const allMaterials = allMaterialsQ.data?.items ?? [];
  const units = unitsQ.data ?? [];
  const margins = marginsQ.data ?? [];
  const summary = summaryQ.data;
  // Distinct categories present in the catalog, for the filter chips.
  const categories = Array.from(
    new Set(allMaterials.map((item) => item.category).filter(Boolean)),
  ) as string[];
  // Weighted (total COGS / total menu price), not the mean of per-item ratios.
  const menuRevenue = margins.reduce((sum, row) => sum + row.price, 0);
  const menuCogs = margins.reduce((sum, row) => sum + row.cogs, 0);
  const foodCostPct = menuRevenue > 0 ? (menuCogs / menuRevenue) * 100 : null;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['inventory', 'materials'] });

  const saveM = useMutation({
    mutationFn: (values: MaterialFormValues) => {
      const input = {
        name: values.name.trim(),
        sku: values.sku?.trim() || undefined,
        category: values.category?.trim() || undefined,
        stockUnitId: values.stockUnitId || undefined,
        purchaseUnitId: values.purchaseUnitId || null,
        packSize: values.packSize || 1,
        expiresAt: values.expiresAt ? values.expiresAt : null,
        stockQty: values.stockQty,
        minStockQty: values.minStockQty,
        costPerUnit: values.costPerUnit,
      };
      return formModal?.material
        ? updateRawMaterial(formModal.material.id, input)
        : createRawMaterial(input);
    },
    onSuccess: () => {
      setFormModal(null);
      setFormError(null);
      void invalidate();
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan bahan.'),
  });

  const adjustM = useMutation({
    mutationFn: (values: StockAdjustValues) =>
      adjustRawMaterialStock(adjustModal!.id, {
        qty: values.qty,
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      setAdjustModal(null);
      setFormError(null);
      void invalidate();
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Gagal menyesuaikan stok.'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteRawMaterial(id),
    onSuccess: () => void invalidate(),
  });

  const selectedMargin = margins.find(
    (row) => row.productId === selectedProductId,
  );
  const selectedProduct = selectedMargin ?? margins[0];

  return (
    <div className="flex w-full flex-col gap-5">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lp-primary-fixed/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-lp-on-primary-fixed-variant">
            Inventori &amp; Stok
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-lp-on-surface">
            Manajemen Bahan Baku &amp; HPP
          </h1>
          <p className="text-sm text-lp-on-surface-variant">
            Pantau stok bahan dan hitung HPP otomatis berbasis resep.
          </p>
        </div>
        {canWrite && tab === 'materials' && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setFormModal({ material: null });
            }}
            className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-4 text-sm font-bold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container"
          >
            <Icon name="add_circle" className="text-[20px]" />
            Tambah Bahan
          </button>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={PANEL}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            Total Nilai Aset Bahan
          </span>
          <div className="mt-1 font-lp-mono text-xl font-bold text-lp-on-surface">
            {formatIDR(summary?.totalAssetValue ?? 0)}
          </div>
          <span className="text-[11px] text-lp-tertiary">
            {summary?.itemCount ?? 0} bahan aktif
          </span>
        </div>
        <div className={PANEL}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            Peringatan Stok
          </span>
          <div className="mt-1 font-lp-mono text-xl font-bold text-lp-on-surface">
            {summary?.criticalCount ?? 0}{' '}
            <span
              className={
                (summary?.criticalCount ?? 0) > 0
                  ? 'text-lp-error'
                  : 'text-lp-primary'
              }
            >
              kritis
            </span>
          </div>
          <span className="text-[11px] text-lp-tertiary">
            {summary?.lowCount ?? 0} bahan menipis
          </span>
        </div>
        <div className={PANEL}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            Rata-Rata Food Cost (HPP)
          </span>
          <div className="mt-1 font-lp-mono text-xl font-bold text-lp-on-surface">
            {foodCostPct === null ? '—' : `${foodCostPct.toFixed(1)}%`}
          </div>
          <span className="text-[11px] text-lp-tertiary">
            berbobot harga jual menu
          </span>
        </div>
      </section>

      <div className="flex flex-wrap gap-1 border-b border-lp-surface-container">
        {[
          { id: 'materials' as const, label: 'Bahan Baku', icon: 'shelves' },
          { id: 'recipes' as const, label: 'Resep & HPP', icon: 'calculate' },
          {
            id: 'purchase' as const,
            label: 'Purchase Order',
            icon: 'local_shipping',
          },
          { id: 'opname' as const, label: 'Stok Opname', icon: 'rule' },
          { id: 'waste' as const, label: 'Waste', icon: 'delete_sweep' },
          { id: 'reports' as const, label: 'Laporan', icon: 'assessment' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? 'border-lp-primary text-lp-primary'
                : 'border-transparent text-lp-on-surface-variant hover:text-lp-on-surface'
            }`}
          >
            <Icon name={item.icon} className="text-[18px]" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'materials' ? (
        <section className={PANEL}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-lp-on-surface-variant"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari bahan baku…"
                aria-label="Cari bahan baku"
                className="h-10 w-full rounded-lg bg-lp-surface-container-low pl-10 pr-3 text-sm text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container"
              />
            </div>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
              aria-label="Filter status stok"
              className="h-10 rounded-lg bg-lp-surface-container-low px-3 text-sm font-medium text-lp-on-surface outline-none focus:bg-lp-surface-container"
            >
              <option value="">Semua Status</option>
              <option value="critical">Kritis (&lt; minimum)</option>
              <option value="low">Menipis</option>
              <option value="ok">Stok Aman</option>
            </select>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              aria-label="Filter kategori bahan"
              className="h-10 rounded-lg bg-lp-surface-container-low px-3 text-sm font-medium text-lp-on-surface outline-none focus:bg-lp-surface-container"
            >
              <option value="">Semua Kategori</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {materialsQ.isPending ? (
            <p className="text-sm text-lp-on-surface-variant">Memuat bahan…</p>
          ) : materialsQ.isError ? (
            <p className="text-sm text-lp-error">
              {materialsQ.error instanceof Error
                ? materialsQ.error.message
                : 'Gagal memuat bahan.'}
            </p>
          ) : materials.length === 0 ? (
            <p className="text-sm text-lp-on-surface-variant">
              Belum ada bahan baku yang cocok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-lp-tertiary">
                    <th className="pb-2">Bahan Baku &amp; SKU</th>
                    <th className="pb-2">Kategori</th>
                    <th className="pb-2 text-right">Sisa Stok</th>
                    <th className="pb-2 text-right">Min</th>
                    <th className="pb-2 text-right">Harga / Satuan</th>
                    <th className="pb-2">Status</th>
                    {canWrite && <th className="pb-2 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr
                      key={material.id}
                      className="border-t border-lp-surface-container"
                    >
                      <td className="py-2.5">
                        <span className="block font-semibold text-lp-on-surface">
                          {material.name}
                        </span>
                        <span className="font-lp-mono text-[11px] text-lp-tertiary">
                          {material.sku ?? material.stockUnitCode ?? material.unit}
                        </span>
                      </td>
                      <td className="py-2.5 text-lp-on-surface-variant">
                        {material.category ?? '—'}
                      </td>
                      <td className="py-2.5 text-right font-lp-mono text-lp-on-surface">
                        {formatQty(material.stockQty)}{' '}
                        {material.stockUnitCode ?? material.unit}
                      </td>
                      <td className="py-2.5 text-right font-lp-mono text-lp-on-surface-variant">
                        {formatQty(material.minStockQty)}{' '}
                        {material.stockUnitCode ?? material.unit}
                      </td>
                      <td className="py-2.5 text-right font-lp-mono text-lp-on-surface">
                        {formatIDR(material.costPerUnit)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusChip(
                            material.status ?? 'ok',
                          )}`}
                        >
                          {STATUS_LABEL[material.status ?? 'ok']}
                        </span>
                      </td>
                      {canWrite && (
                        <td className="py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              aria-label={`Sesuaikan stok ${material.name}`}
                              onClick={() => {
                                setFormError(null);
                                setAdjustModal(material);
                              }}
                              className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface"
                            >
                              <Icon name="swap_vert" className="text-[18px]" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Edit ${material.name}`}
                              onClick={() => {
                                setFormError(null);
                                setFormModal({ material });
                              }}
                              className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface"
                            >
                              <Icon name="edit" className="text-[18px]" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Hapus ${material.name}`}
                              disabled={deleteM.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Hapus bahan "${material.name}"?`,
                                  )
                                ) {
                                  deleteM.mutate(material.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-lp-surface-container pt-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-lp-tertiary">
                Halaman {page} dari {totalPages} · {total} bahan
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          )}
        </section>
      ) : tab === 'recipes' ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={PANEL}>
            <h2 className="mb-2 text-base font-semibold text-lp-on-surface">
              Menu &amp; HPP
            </h2>
            {marginsQ.isPending ? (
              <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
            ) : margins.length === 0 ? (
              <p className="text-sm text-lp-on-surface-variant">
                Belum ada produk untuk dihitung HPP-nya.
              </p>
            ) : (
              <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
                {margins.map((row) => {
                  const active = selectedProduct?.productId === row.productId;
                  return (
                    <button
                      key={row.productId}
                      type="button"
                      onClick={() => setSelectedProductId(row.productId)}
                      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'bg-lp-primary-container text-lp-on-primary-container'
                          : 'text-lp-on-surface hover:bg-lp-surface-container'
                      }`}
                    >
                      <span className="truncate">{row.productName}</span>
                      <span className="shrink-0 font-lp-mono text-xs">
                        {row.marginPct.toFixed(0)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`${PANEL} lg:col-span-2`}>
            {selectedProduct ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-lp-on-surface">
                    Resep: {selectedProduct.productName}
                  </h2>
                  <span className="text-xs text-lp-tertiary">
                    HPP {formatIDR(selectedProduct.cogs)}
                  </span>
                </div>
                <RecipeEditor
                  product={{
                    id: selectedProduct.productId,
                    name: selectedProduct.productName,
                    basePrice: selectedProduct.price,
                  }}
                  materials={allMaterials}
                />
              </>
            ) : (
              <p className="text-sm text-lp-on-surface-variant">
                Pilih menu di kiri untuk melihat &amp; menyusun resepnya.
              </p>
            )}
          </div>
        </section>
      ) : tab === 'purchase' ? (
        <PurchaseOrderView materials={allMaterials} canWrite={canWrite} />
      ) : tab === 'opname' ? (
        <OpnameView canWrite={canWrite} />
      ) : tab === 'waste' ? (
        <WasteView materials={allMaterials} canWrite={canWrite} />
      ) : (
        <ReportsView />
      )}

      {formModal && (
        <MaterialFormModal
          material={formModal.material}
          units={units}
          pending={saveM.isPending}
          errorMessage={formError}
          onClose={() => setFormModal(null)}
          onSubmit={(values) => saveM.mutate(values)}
          onUnitsChanged={() =>
            queryClient.invalidateQueries({ queryKey: ['units'] })
          }
        />
      )}
      {adjustModal && (
        <StockAdjustModal
          material={adjustModal}
          pending={adjustM.isPending}
          errorMessage={formError}
          onClose={() => setAdjustModal(null)}
          onSubmit={(values) => adjustM.mutate(values)}
        />
      )}
    </div>
  );
}
