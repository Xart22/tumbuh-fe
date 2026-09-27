'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import {
  adjustRawMaterialStock,
  createRawMaterial,
  deleteRawMaterial,
  getProductRecipe,
  listRawMaterialsPage,
  listUnits,
  listWasteRecords,
  productMargins,
  rawMaterialSummary,
  stockForecast,
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
import { buildReorderItems, restockPurchaseQty } from './reorder-utils';
import { RecipeEditor } from './recipe-editor';
import { PurchaseOrderView } from './po-view';
import { OpnameView } from './opname-view';
import { ReportsView } from './reports-view';
import { WasteView } from './waste-view';
import { resolveProductVisual } from '../dashboard/dashboard-assets';

const PAGE_SIZE = 20;
const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';

type StatusFilter = '' | RawMaterialStatus;

const STATUS_LABEL: Record<RawMaterialStatus, string> = {
  critical: 'Kritis',
  low: 'Menipis',
  ok: 'Aman',
};

const STATUS_DOT: Record<RawMaterialStatus, string> = {
  critical: 'bg-lp-error',
  low: 'bg-lp-secondary',
  ok: 'bg-lp-primary',
};

function statusChip(status: RawMaterialStatus): string {
  if (status === 'critical') {
    return 'bg-lp-error-container text-lp-error font-semibold';
  }
  if (status === 'low') {
    return 'bg-lp-secondary-fixed text-lp-on-secondary-fixed font-semibold';
  }
  return 'bg-lp-primary/10 text-lp-primary font-semibold';
}

function startOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function getMaterialIcon(name: string = '', category?: string | null): string {
  const text = `${name} ${category ?? ''}`.toLowerCase();
  if (text.includes('susu') || text.includes('milk') || text.includes('dairy')) return 'water_drop';
  if (text.includes('kopi') || text.includes('coffee') || text.includes('bean') || text.includes('espresso')) return 'coffee';
  if (text.includes('gula') || text.includes('sugar') || text.includes('aren') || text.includes('pemanis')) return 'opacity';
  if (text.includes('sirup') || text.includes('syrup') || text.includes('flavour') || text.includes('karamel')) return 'liquor';
  if (text.includes('cup') || text.includes('kemasan') || text.includes('lid') || text.includes('straw') || text.includes('dus')) return 'local_cafe';
  if (text.includes('teh') || text.includes('tea') || text.includes('matcha') || text.includes('powder')) return 'grass';
  return 'inventory_2';
}

function exportMaterialsCSV(items: RawMaterial[]) {
  if (typeof window === 'undefined') return;
  const headers = ['Nama Bahan', 'SKU', 'Kategori', 'Stok', 'Satuan', 'Min Stok', 'Harga Beli Terakhir', 'Status'];
  const rows = items.map((m) => [
    `"${m.name.replace(/"/g, '""')}"`,
    `"${(m.sku ?? '').replace(/"/g, '""')}"`,
    `"${(m.category ?? '').replace(/"/g, '""')}"`,
    m.stockQty,
    `"${m.stockUnitCode ?? m.unit}"`,
    m.minStockQty,
    m.lastUnitPrice ?? m.costPerUnit,
    m.status ?? 'ok',
  ]);
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `tumbuh_bahan_baku_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  const [priceShock, setPriceShock] = useState(0);
  // Prefilled PO lines handed over to the purchase tab (+PO / Buat PO Massal).
  const [bulkItems, setBulkItems] = useState<
    Array<{ rawMaterialId: string; qtyOrdered: string; unitPrice: string }> | null
  >(null);

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
  const wasteQ = useQuery({
    queryKey: ['inventory', 'waste', 'month'],
    queryFn: () => listWasteRecords({ dateFrom: startOfMonth() }),
  });
  const forecastQ = useQuery({
    queryKey: ['inventory', 'stock-forecast'],
    queryFn: () => stockForecast(7),
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
  const foodCostTarget = margins[0]?.foodCostTargetPct ?? null;
  const wasteTotal = (wasteQ.data ?? []).reduce(
    (sum, row) => sum + row.totalCost,
    0,
  );

  const reorderItems = buildReorderItems(allMaterials, forecastQ.data ?? [], 7);
  const criticalNames = allMaterials
    .filter((material) => material.status === 'critical')
    .slice(0, 3)
    .map((material) => material.name);

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

  const selectedMargin =
    margins.find((row) => row.productId === selectedProductId) ?? margins[0];
  const selectedProduct = selectedMargin;

  const recipeQ = useQuery({
    queryKey: ['inventory', 'recipe', selectedProduct?.productId],
    queryFn: () => getProductRecipe(selectedProduct!.productId),
    enabled: Boolean(selectedProduct?.productId),
  });

  // BOM lines priced from the current moving-average cost per stock unit; the
  // shock slider simulates a supplier price rise without persisting anything.
  const shockFactor = 1 + priceShock / 100;
  const bomLines = (recipeQ.data?.items ?? []).map((item) => {
    const material = allMaterials.find((row) => row.id === item.rawMaterialId);
    // Cost comes from the recipe payload (works past the 100-item page cap);
    // the catalog lookup is only a fallback.
    const unitCost =
      (item.costPerUnit ?? material?.costPerUnit ?? 0) * shockFactor;
    return {
      id: item.rawMaterialId,
      name: material?.name ?? item.rawMaterialName ?? 'Bahan',
      qtyUsed: item.qtyUsed,
      unit: material?.stockUnitCode ?? item.unit,
      unitCost,
      cost: item.qtyUsed * unitCost,
    };
  });
  const bomCost = bomLines.reduce((sum, line) => sum + line.cost, 0);
  const sellPrice = selectedProduct?.price ?? 0;
  const grossProfit = sellPrice - bomCost;
  const bomFoodCostPct = sellPrice > 0 ? (bomCost / sellPrice) * 100 : null;

  return (
    <div className="flex w-full flex-col gap-5">
      <section className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1 text-[11px] text-lp-on-surface-variant">
            <span>Backoffice</span>
            <Icon name="chevron_right" className="text-[14px]" />
            <span>Inventori &amp; Stok</span>
            <Icon name="chevron_right" className="text-[14px]" />
            <span className="font-semibold text-lp-primary">
              Bahan Baku &amp; Resep (HPP)
            </span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-lp-on-surface">
              Manajemen Bahan Baku &amp; Kalkulasi HPP Otomatis
            </h1>
            <span className="rounded-full bg-lp-primary-container/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-lp-primary">
              Live COGS Engine
            </span>
          </div>
          <p className="max-w-3xl text-sm text-lp-on-surface-variant">
            Pantau stok bahan secara real-time, konversi satuan resep presisi,
            dan hitung HPP otomatis berbasis harga beli PO terbaru.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('opname')}
            className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-surface-container-lowest px-4 text-sm font-semibold text-lp-on-surface shadow-sm transition hover:bg-lp-surface-low"
          >
            <Icon name="inventory_2" className="text-[20px] text-lp-tertiary" />
            Riwayat Stok Opname
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={() => setTab('purchase')}
              className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-surface-container-lowest px-4 text-sm font-semibold text-lp-on-surface shadow-sm transition hover:bg-lp-surface-low"
            >
              <Icon
                name="local_shipping"
                className="text-[20px] text-lp-primary"
              />
              Catat Barang Masuk (PO)
            </button>
          )}
          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setFormModal({ material: null });
              }}
              className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-4 text-sm font-bold text-lp-on-primary shadow-md transition hover:bg-lp-primary-container"
            >
              <Icon name="add_circle" className="text-[20px]" />
              Tambah Bahan / Resep
            </button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`${PANEL} flex flex-col justify-between gap-3`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-on-surface-variant">
                Total Nilai Aset Bahan
              </span>
              <span className="font-lp-mono text-xl font-bold text-lp-on-surface">
                {formatIDR(summary?.totalAssetValue ?? 0)}
              </span>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lp-surface-low text-lp-primary">
              <Icon name="account_balance_wallet" className="text-[22px]" />
            </span>
          </div>
          <span className="text-xs text-lp-on-surface-variant">
            {summary?.itemCount ?? 0} bahan aktif
          </span>
        </div>

        <div className={`${PANEL} flex flex-col justify-between gap-3`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-on-surface-variant">
                Rata-Rata Food Cost (HPP)
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-lp-mono text-xl font-bold text-lp-on-surface">
                  {foodCostPct === null ? '—' : `${foodCostPct.toFixed(1)}%`}
                </span>
                {foodCostTarget !== null && (
                  <span className="text-xs text-lp-on-surface-variant">
                    / target &lt;{foodCostTarget}%
                  </span>
                )}
              </span>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lp-primary/10 text-lp-primary">
              <Icon name="pie_chart" className="text-[22px]" />
            </span>
          </div>
          <span className="text-xs text-lp-on-surface-variant">
            berbobot harga jual menu
          </span>
        </div>

        <div className={`${PANEL} flex flex-col justify-between gap-3`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-error">
                Peringatan Stok Kritis
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-lp-mono text-xl font-bold text-lp-error">
                  {summary?.criticalCount ?? 0}
                </span>
                <span className="text-xs text-lp-on-surface-variant">
                  bahan &lt; batas minimum
                </span>
              </span>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lp-error-container/40 text-lp-error">
              <Icon name="warning" className="text-[22px]" />
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-lp-on-surface-variant">
              {criticalNames.length > 0
                ? criticalNames.join(', ')
                : 'Tidak ada bahan kritis'}
            </span>
            <button
              type="button"
              onClick={() => setTab('purchase')}
              className="shrink-0 text-xs font-bold text-lp-error hover:underline"
            >
              Restock PO →
            </button>
          </div>
        </div>

        <div className={`${PANEL} flex flex-col justify-between gap-3`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-on-surface-variant">
                Potensi Waste Bulan Ini
              </span>
              <span className="font-lp-mono text-xl font-bold text-lp-on-surface">
                {formatIDR(wasteTotal)}
              </span>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lp-surface-low text-lp-secondary">
              <Icon name="delete_sweep" className="text-[22px]" />
            </span>
          </div>
          <span className="text-xs text-lp-on-surface-variant">
            {wasteQ.data?.length ?? 0} catatan susut &amp; kedaluwarsa
          </span>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-lp-surface-container-lowest p-1.5 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            {
              id: 'materials' as const,
              label: `Katalog Bahan Baku${summary ? ` (${summary.itemCount})` : ''}`,
              icon: 'shelves',
            },
            { id: 'recipes' as const, label: 'Resep Menu & HPP (BOM)', icon: 'calculate' },
            {
              id: 'purchase' as const,
              label: 'Purchase Order & Supplier',
              icon: 'local_shipping',
            },
            { id: 'opname' as const, label: 'Audit Stok Opname', icon: 'rule' },
            { id: 'waste' as const, label: 'Waste', icon: 'delete_sweep' },
            { id: 'reports' as const, label: 'Laporan', icon: 'assessment' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === item.id
                  ? 'bg-lp-primary text-lp-on-primary shadow-sm'
                  : 'text-lp-on-surface-variant hover:bg-lp-surface-low hover:text-lp-on-surface'
              }`}
            >
              <Icon name={item.icon} className="text-[18px]" />
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-lp-surface-container px-2.5 py-1 text-[11px] text-lp-on-surface-variant">
          <Icon name="sync" className="text-[16px] text-lp-primary" />
          <span>
            Sinkronisasi Otomatis Kasir POS: <b>Aktif</b>
          </span>
        </div>
      </div>

      {tab === 'materials' ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
            <section className={`${PANEL} xl:col-span-8`}>
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
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-lp-surface-low text-[11px] uppercase tracking-wider text-lp-on-surface-variant">
                    <th className="px-3 py-3 font-semibold">Bahan Baku &amp; SKU</th>
                    <th className="px-3 py-3 font-semibold">Sisa Stok Fisik</th>
                    <th className="px-3 py-3 font-semibold">Konversi Satuan</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Harga PO Terakhir
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      HPP Unit Resep
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">Status</th>
                    {canWrite && (
                      <th className="px-3 py-3 text-right font-semibold">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => {
                    const status = material.status ?? 'ok';
                    const unit = material.stockUnitCode ?? material.unit;
                    const stockUnit = units.find(
                      (row) => row.id === material.stockUnitId,
                    );
                    const ratio =
                      material.minStockQty > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (material.stockQty / material.minStockQty) * 100,
                            ),
                          )
                        : 100;
                    const baseCost =
                      stockUnit && stockUnit.factorToBase > 0
                        ? material.costPerUnit / stockUnit.factorToBase
                        : null;

                    return (
                      <tr
                        key={material.id}
                        className="border-t border-lp-surface-container transition-colors hover:bg-lp-surface-low/70"
                      >
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lp-surface-container-high text-lp-primary">
                              <Icon name="inventory_2" className="text-[18px]" />
                            </span>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-semibold text-lp-on-surface">
                                {material.name}
                              </span>
                              <span className="font-lp-mono text-[11px] text-lp-on-surface-variant">
                                SKU: {material.sku ?? '—'} •{' '}
                                {material.category ?? 'Tanpa kategori'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-baseline justify-between gap-2 text-[11px]">
                              <span
                                className={`font-lp-mono font-bold ${
                                  status === 'critical'
                                    ? 'text-lp-error'
                                    : status === 'low'
                                      ? 'text-lp-secondary'
                                      : 'text-lp-primary'
                                }`}
                              >
                                {formatQty(material.stockQty)} {unit}
                              </span>
                              <span className="text-lp-on-surface-variant">
                                Min: {formatQty(material.minStockQty)}
                              </span>
                            </div>
                            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-lp-surface-container-high">
                              <div
                                className={`h-full rounded-full ${STATUS_DOT[status]}`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-[11px]">
                              {material.purchaseUnitCode &&
                              (material.packSize ?? 0) > 0
                                ? `1 ${material.purchaseUnitCode} = ${formatQty(material.packSize ?? 0)} ${unit}`
                                : 'Tanpa satuan beli'}
                            </span>
                            {stockUnit &&
                              !(
                                stockUnit.factorToBase === 1 &&
                                stockUnit.baseUnit === unit
                              ) && (
                                <span className="text-[11px] text-lp-on-surface-variant">
                                  1 {unit} = {formatQty(stockUnit.factorToBase)}{' '}
                                  {stockUnit.baseUnit}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-right">
                          {material.lastUnitPrice === null ||
                          material.lastUnitPrice === undefined ? (
                            <span className="text-[11px] text-lp-on-surface-variant">
                              Belum ada PO
                            </span>
                          ) : (
                            <>
                              <span className="font-lp-mono text-sm text-lp-on-surface">
                                {formatIDR(material.lastUnitPrice)}
                              </span>
                              <span className="block text-[11px] text-lp-on-surface-variant">
                                / {unit}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-right">
                          {baseCost === null ? (
                            <span className="text-[11px] text-lp-on-surface-variant">
                              —
                            </span>
                          ) : (
                            <>
                              <span className="font-lp-mono text-sm font-bold text-lp-primary">
                                {formatIDR(baseCost)}
                              </span>
                              <span className="block text-[11px] text-lp-on-surface-variant">
                                / {stockUnit?.baseUnit}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusChip(
                              status,
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`}
                            />
                            {STATUS_LABEL[status]}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="whitespace-nowrap px-3 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                aria-label={`Buat PO ${material.name}`}
                                onClick={() => {
                                  setBulkItems([
                                    {
                                      rawMaterialId: material.id,
                                      qtyOrdered: String(
                                        restockPurchaseQty(material),
                                      ),
                                      unitPrice: String(
                                        material.lastUnitPrice ??
                                          material.costPerUnit,
                                      ),
                                    },
                                  ]);
                                  setTab('purchase');
                                }}
                                className="rounded bg-lp-primary px-2 py-1 text-[11px] font-semibold text-lp-on-primary transition hover:bg-lp-primary-container"
                              >
                                + PO
                              </button>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-3 text-xs text-lp-on-surface-variant">
            <span>
              Menampilkan <b>{materials.length}</b> dari <b>{total}</b> jenis
              bahan baku aktif
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg bg-lp-surface-low px-2.5 py-1.5 text-xs font-semibold text-lp-on-surface-variant transition hover:bg-lp-surface-container disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="font-bold text-lp-primary">
                Halaman {page} dari {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="rounded-lg bg-lp-surface-low px-2.5 py-1.5 text-xs font-semibold text-lp-on-surface transition hover:bg-lp-surface-container disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
            </section>

            <aside className="flex flex-col gap-4 rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm xl:col-span-4 xl:sticky xl:top-20">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="flex items-center gap-1.5 text-base font-bold text-lp-on-surface">
                    <Icon
                      name="precision_manufacturing"
                      className="text-[20px] text-lp-primary"
                    />
                    Simulasi Resep &amp; HPP
                  </span>
                  <span className="text-[11px] text-lp-on-surface-variant">
                    Bill of Materials (BOM) Dinamis
                  </span>
                </div>
                <span className="rounded bg-lp-primary/10 px-2 py-0.5 text-[11px] font-bold text-lp-primary">
                  Terhubung POS
                </span>
              </div>

              <div>
                <label
                  htmlFor="bom-product"
                  className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant"
                >
                  Menu
                </label>
                <select
                  id="bom-product"
                  value={selectedProduct?.productId ?? ''}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="h-10 w-full rounded-lg bg-lp-surface-low px-3 text-sm font-medium text-lp-on-surface outline-none focus:bg-lp-surface-container"
                >
                  {margins.length === 0 && <option value="">Belum ada menu</option>}
                  {margins.map((row) => (
                    <option key={row.productId} value={row.productId}>
                      {row.productName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="flex flex-col gap-1 rounded-xl bg-lp-surface-low p-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-lp-primary">
                    Harga Jual POS
                  </span>
                  <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
                    {formatIDR(selectedProduct.price)}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] text-lp-on-surface-variant">
                  <span>KOMPOSISI BAHAN (BOM)</span>
                  <span>BIAYA / SERVING</span>
                </div>
                {recipeQ.isPending ? (
                  <p className="text-xs text-lp-on-surface-variant">
                    Memuat resep…
                  </p>
                ) : bomLines.length === 0 ? (
                  <p className="text-xs text-lp-on-surface-variant">
                    Menu ini belum punya resep. Susun di tab Resep Menu &amp;
                    HPP.
                  </p>
                ) : (
                  bomLines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-lp-surface-low px-2.5 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-lp-on-surface">
                          {line.name}
                        </span>
                        <span className="font-lp-mono text-[11px] text-lp-on-surface-variant">
                          {formatQty(line.qtyUsed)} {line.unit} ×{' '}
                          {formatIDR(line.unitCost)}
                        </span>
                      </div>
                      <span className="font-lp-mono text-sm text-lp-on-surface">
                        {formatIDR(line.cost)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-xl bg-lp-surface-container-high/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-lp-on-surface-variant">
                    Total HPP / Serving
                  </span>
                  <span className="font-lp-mono font-bold text-lp-error">
                    {formatIDR(bomCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-lp-on-surface-variant">
                    Gross Profit
                  </span>
                  <span className="font-lp-mono font-bold text-lp-primary">
                    {formatIDR(grossProfit)}
                    {bomFoodCostPct !== null && (
                      <span className="ml-1 text-[11px] font-normal">
                        ({Math.max(0, 100 - bomFoodCostPct).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                {bomFoodCostPct !== null && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-lp-on-surface-variant">
                        Food Cost Ratio
                      </span>
                      <span className="font-bold text-lp-primary">
                        {bomFoodCostPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-lp-surface-container-highest">
                      <div
                        className="h-full rounded-full bg-lp-primary"
                        style={{
                          width: `${Math.min(100, bomFoodCostPct)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="bom-shock"
                    className="mb-1 block text-[11px] text-lp-on-surface-variant"
                  >
                    Simulasi kenaikan harga bahan (%)
                  </label>
                  <input
                    id="bom-shock"
                    type="number"
                    min={0}
                    max={200}
                    step={5}
                    value={priceShock}
                    onChange={(event) =>
                      setPriceShock(Number(event.target.value) || 0)
                    }
                    className="h-9 w-full rounded-lg bg-lp-surface-low px-3 font-lp-mono text-sm text-lp-on-surface outline-none focus:bg-lp-surface-container"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTab('recipes')}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-lp-primary text-sm font-semibold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container"
              >
                <Icon name="edit_note" className="text-[18px]" />
                Edit Resep (BOM)
              </button>
            </aside>
          </div>

          <section className="flex flex-col gap-4 rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="receipt_long"
                    className="text-[20px] text-lp-secondary"
                  />
                  <span className="text-base font-semibold text-lp-on-surface">
                    Rekomendasi Restock Otomatis (Reorder Point Engine)
                  </span>
                </span>
                <span className="text-xs text-lp-on-surface-variant">
                  Dihitung dari pemakaian penjualan {7} hari terakhir; bahan
                  tanpa penjualan hanya muncul bila di bawah stok minimum.
                </span>
              </div>
              {canWrite && (
                <button
                  type="button"
                  disabled={reorderItems.length === 0}
                  onClick={() => {
                    setBulkItems(
                      reorderItems
                        .filter((item) => item.purchaseQty)
                        .map((item) => ({
                          rawMaterialId: item.rawMaterialId,
                          qtyOrdered: String(Math.max(1, Math.ceil(item.purchaseQty!.qty))),
                          unitPrice: String(
                            allMaterials.find(
                              (row) => row.id === item.rawMaterialId,
                            )?.lastUnitPrice ??
                              allMaterials.find(
                                (row) => row.id === item.rawMaterialId,
                              )?.costPerUnit ??
                              0,
                          ),
                        })),
                    );
                    setTab('purchase');
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-semibold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container disabled:opacity-50"
                >
                  <Icon name="shopping_cart_checkout" className="text-[16px]" />
                  Buat PO Massal ({reorderItems.length} item)
                </button>
              )}
            </div>

            {reorderItems.length === 0 ? (
              <p className="text-sm text-lp-on-surface-variant">
                Semua bahan di atas ambang minimum. Tidak ada yang perlu
                direstock.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {reorderItems.slice(0, 6).map((item) => (
                  <div
                    key={item.rawMaterialId}
                    className="flex flex-col justify-between gap-3 rounded-xl bg-lp-surface-low p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold text-lp-on-surface">
                          {item.name}
                        </span>
                        <span className="truncate text-[11px] text-lp-on-surface-variant">
                          {item.supplierName ?? 'Supplier belum tercatat'}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-bold ${statusChip(
                          item.status,
                        )}`}
                      >
                        {item.status === 'ok'
                          ? item.daysLeft !== null
                            ? `${item.daysLeft} hari lagi`
                            : 'Menipis'
                          : STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-lp-on-surface-variant">
                          Rekomendasi Order
                        </span>
                        <span className="font-lp-mono text-sm text-lp-on-surface">
                          {item.purchaseQty
                            ? `${formatQty(item.purchaseQty.qty)} ${item.purchaseQty.unit}`
                            : `${formatQty(item.recommendedQty)} ${item.unit}`}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[11px] text-lp-on-surface-variant">
                          Est. Biaya
                        </span>
                        <span className="font-lp-mono text-sm font-bold text-lp-primary">
                          {formatIDR(item.estCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
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
        <PurchaseOrderView
          materials={allMaterials}
          canWrite={canWrite}
          initialItems={bulkItems}
          onInitialItemsConsumed={() => setBulkItems(null)}
        />
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
