'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownSearch } from '@/components/ui/dropdown-search';
import { apiUrl } from '@/lib/api-client';
import {
  adjustRawMaterialStock,
  createRawMaterial,
  deleteRawMaterial,
  getProductRecipe,
  listAllRawMaterials,
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
import { buildReorderItems, restockStockQty } from './reorder-utils';
import { recipeQtyInStockUnit } from './unit-convert';
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

/** Local calendar date as `YYYY-MM-DD` (never UTC — avoids the WIB off-by-one). */
function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function startOfMonth(): string {
  return `${todayISO().slice(0, 7)}-01`;
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
  link.setAttribute('download', `tumbuh_bahan_baku_${todayISO()}.csv`);
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
    'materials' | 'purchase' | 'audit' | 'recipes'
  >('materials');
  const [auditSubTab, setAuditSubTab] = useState<'opname' | 'waste' | 'reports'>('opname');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
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
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterial | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [priceShock, setPriceShock] = useState(0);
  const [showShock, setShowShock] = useState(false);
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
    queryFn: listAllRawMaterials,
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
  const allMaterials = allMaterialsQ.data ?? [];
  const units = unitsQ.data ?? [];
  const margins = useMemo(() => marginsQ.data ?? [], [marginsQ.data]);
  const marginOptions = margins.map((row) => ({
    value: row.productId,
    label: row.productName,
    badge: row.categoryName ?? undefined,
    subLabel: `Jual: ${formatIDR(row.price)}`,
  }));

  const filteredMargins = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    return margins.filter((row) => {
      const matchSearch =
        !q ||
        row.productName.toLowerCase().includes(q) ||
        (row.categoryName ?? '').toLowerCase().includes(q);
      const rowFoodCost = row.price > 0 ? (row.cogs / row.price) * 100 : 0;
      if (recipeFilter === 'healthy') {
        return matchSearch && rowFoodCost > 0 && rowFoodCost <= 30;
      }
      if (recipeFilter === 'warning') {
        return matchSearch && rowFoodCost > 30 && rowFoodCost <= 35;
      }
      if (recipeFilter === 'critical') {
        return matchSearch && rowFoodCost > 35;
      }
      return matchSearch;
    });
  }, [margins, recipeSearch, recipeFilter]);

  const healthyCount = useMemo(
    () =>
      margins.filter(
        (m) => m.price > 0 && m.cogs > 0 && (m.cogs / m.price) * 100 <= 30,
      ).length,
    [margins],
  );
  const warningCount = useMemo(
    () => margins.filter((m) => m.price > 0 && (m.cogs / m.price) * 100 > 35).length,
    [margins],
  );
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
    // Cost is per stock unit, so convert a recipe stored in another unit first.
    const stockUnit =
      item.rawMaterialUnit ?? material?.stockUnitCode ?? item.unit;
    const qtyInStockUnit = recipeQtyInStockUnit(
      item.qtyUsed,
      item.unit,
      stockUnit,
      units,
    );
    // Cost comes from the recipe payload (works past the 100-item page cap);
    // the catalog lookup is only a fallback.
    const unitCost =
      (item.costPerUnit ?? material?.costPerUnit ?? 0) * shockFactor;
    return {
      id: item.rawMaterialId,
      name: material?.name ?? item.rawMaterialName ?? 'Bahan',
      qtyUsed: qtyInStockUnit,
      unit: stockUnit,
      unitCost,
      cost: qtyInStockUnit * unitCost,
    };
  });
  const bomCost = bomLines.reduce((sum, line) => sum + line.cost, 0);
  const sellPrice = selectedProduct?.price ?? 0;
  const grossProfit = sellPrice - bomCost;
  const bomFoodCostPct = sellPrice > 0 ? (bomCost / sellPrice) * 100 : null;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Top Bar & Breadcrumbs */}
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-[11px] text-lp-on-surface-variant">
            <span>Backoffice</span>
            <Icon name="chevron_right" className="text-[14px]" />
            <span>Inventori &amp; Stok</span>
            <Icon name="chevron_right" className="text-[14px]" />
            <span className="font-semibold text-lp-primary">
              Bahan Baku &amp; Resep (HPP)
            </span>
          </nav>
          <h1 className="font-lp-sans text-2xl font-bold tracking-tight text-lp-on-surface">
            Manajemen Bahan Baku &amp; Kalkulasi HPP Otomatis
          </h1>
          <p className="max-w-3xl text-sm text-lp-on-surface-variant">
            Pantau stok bahan baku gudang/bar secara real-time, konversi satuan resep presisi, dan hitung HPP otomatis berbasis harga beli PO terbaru.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTab('audit');
              setAuditSubTab('opname');
            }}
            className="flex h-11 items-center gap-2 rounded-lg bg-lp-surface-container-lowest px-4 text-sm font-semibold text-lp-on-surface shadow-sm transition hover:bg-lp-surface-low"
          >
            <Icon name="inventory_2" className="text-[20px] text-lp-on-surface-variant" />
            <span>Riwayat Stok Opname</span>
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={() => setTab('purchase')}
              className="flex h-11 items-center gap-2 rounded-lg bg-lp-surface-container-lowest px-4 text-sm font-semibold text-lp-on-surface shadow-sm transition hover:bg-lp-surface-low"
            >
              <Icon
                name="local_shipping"
                className="text-[20px] text-lp-primary"
              />
              <span>+ Catat Barang Masuk (PO)</span>
            </button>
          )}
          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setFormModal({ material: null });
              }}
              className="flex h-11 items-center gap-2 rounded-lg bg-lp-primary px-5 text-sm font-bold text-lp-on-primary shadow-md transition hover:bg-lp-primary-container"
            >
              <Icon name="add_circle" className="text-[20px]" />
              <span>Tambah Bahan / Resep</span>
            </button>
          )}
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Nilai Aset Bahan */}
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-on-surface-variant">
                Total Nilai Aset Bahan
              </span>
              <span className="font-lp-mono text-2xl font-bold text-lp-on-surface">
                {formatIDR(summary?.totalAssetValue ?? 0)}
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lp-surface-low text-lp-primary">
              <Icon name="account_balance_wallet" className="text-[22px]" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-lp-on-surface-variant">
              {summary?.itemCount ?? 0} item aktif
            </span>
          </div>
        </div>

        {/* Card 2: Rata-Rata Food Cost */}
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-on-surface-variant">
                Rata-Rata Food Cost (HPP)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-lp-mono text-2xl font-bold text-lp-on-surface">
                  {foodCostPct === null ? '—' : `${foodCostPct.toFixed(1)}%`}
                </span>
                {foodCostTarget != null && (
                  <span className="text-xs text-lp-on-surface-variant">
                    / target &lt;{foodCostTarget}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lp-primary/10 text-lp-primary">
              <Icon name="pie_chart" className="text-[22px]" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            {foodCostPct !== null && foodCostTarget != null ? (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  foodCostPct <= foodCostTarget
                    ? 'bg-lp-primary/10 text-lp-primary'
                    : 'bg-lp-error-container text-lp-error'
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    foodCostPct <= foodCostTarget ? 'bg-lp-primary' : 'bg-lp-error'
                  }`}
                />
                {foodCostPct <= foodCostTarget ? 'Sesuai target' : 'Di atas target'}
              </span>
            ) : (
              <span className="text-[11px] text-lp-on-surface-variant">
                Target food cost belum diatur
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Peringatan Stok Kritis */}
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-error">
                Peringatan Stok Kritis
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-lp-mono text-2xl font-bold text-lp-error">
                  {summary?.criticalCount ?? 0} Bahan
                </span>
                <span className="text-xs text-lp-on-surface-variant">
                  &lt; batas minimum
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lp-error-container/40 text-lp-error">
              <Icon name="warning" className="text-[22px]" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="max-w-[180px] truncate text-xs text-lp-on-surface-variant">
              {criticalNames.length > 0 ? criticalNames.join(', ') : 'Stok semua bahan aman'}
            </span>
            <button
              type="button"
              onClick={() => setTab('purchase')}
              className="text-[11px] font-bold text-lp-error hover:underline"
            >
              Restock PO →
            </button>
          </div>
        </div>

        {/* Card 4: Potensi Waste Bulan Ini */}
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-on-surface-variant">
                Potensi Waste Bulan Ini
              </span>
              <span className="font-lp-mono text-2xl font-bold text-lp-on-surface">
                {formatIDR(wasteTotal)}
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lp-surface-low text-lp-secondary">
              <Icon name="delete_sweep" className="text-[22px]" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-lp-on-surface-variant">
              Susut &amp; kedaluwarsa bar
            </span>
            <button
              type="button"
              onClick={() => {
                setTab('audit');
                setAuditSubTab('waste');
              }}
              className="text-xs font-bold text-lp-secondary hover:underline flex items-center gap-0.5"
            >
              <span>Kelola Waste</span>
              <Icon name="arrow_forward" className="text-[14px]" />
            </button>
          </div>
        </div>
      </section>

      {/* Sub-Navigation Pill Tabs (4 Operational Pillars) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            {
              id: 'materials' as const,
              label: `Stok & Bahan Baku (${summary?.itemCount ?? materials.length})`,
              icon: 'shelves',
            },
            {
              id: 'purchase' as const,
              label: 'Pengadaan & Supplier (PO)',
              icon: 'local_shipping',
            },
            {
              id: 'audit' as const,
              label: 'Audit & Kontrol Kebocoran',
              icon: 'rule',
            },
            {
              id: 'recipes' as const,
              label: 'Analisis HPP & Resep (BOM Engine)',
              icon: 'calculate',
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                tab === item.id
                  ? 'bg-lp-primary text-lp-on-primary shadow-xs'
                  : 'text-lp-on-surface-variant hover:bg-lp-surface-low hover:text-lp-on-surface'
              }`}
            >
              <Icon name={item.icon} className="text-[18px]" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'materials' ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
            {/* Left Column: Raw Material Inventory Table (8 Cols) */}
            <section className={`${PANEL} xl:col-span-8`}>
              {/* Filter and Search Ribbon */}
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-lp-on-surface-variant"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari bahan, SKU (cth: BB-KOP-01), atau kategori..."
                    aria-label="Cari bahan baku"
                    className="h-10 w-full rounded-lg bg-lp-surface-container-low pl-9 pr-4 text-sm text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant transition-colors focus:bg-lp-surface-container"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(event) => {
                        setCategory(event.target.value);
                        setPage(1);
                      }}
                      aria-label="Filter kategori bahan"
                      className="h-10 cursor-pointer appearance-none rounded-lg bg-lp-surface-container-low pl-3 pr-8 text-xs font-semibold text-lp-on-surface outline-none transition-colors hover:bg-lp-surface-container"
                    >
                      <option value="">Semua Kategori</option>
                      {categories.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="expand_more"
                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[18px] text-lp-on-surface-variant"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(event) => {
                        setStatus(event.target.value as StatusFilter);
                        setPage(1);
                      }}
                      aria-label="Filter status stok"
                      className="h-10 cursor-pointer appearance-none rounded-lg bg-lp-surface-container-low pl-3 pr-8 text-xs font-semibold text-lp-on-surface outline-none transition-colors hover:bg-lp-surface-container"
                    >
                      <option value="">Semua Status</option>
                      <option value="critical">Kritis (&lt; Minimum)</option>
                      <option value="low">Menipis (Hampir Habis)</option>
                      <option value="ok">Stok Aman</option>
                    </select>
                    <Icon
                      name="expand_more"
                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[18px] text-lp-on-surface-variant"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => exportMaterialsCSV(materials)}
                    title="Export CSV Bahan Baku"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-lp-surface-container-low text-lp-on-surface-variant transition-colors hover:bg-lp-surface-container hover:text-lp-on-surface"
                  >
                    <Icon name="download" className="text-[18px]" />
                  </button>
                </div>
              </div>

              {materialsQ.isPending ? (
                <p className="py-6 text-center text-sm text-lp-on-surface-variant">Memuat bahan baku…</p>
              ) : materialsQ.isError ? (
                <p className="py-6 text-center text-sm text-lp-error">
                  {materialsQ.error instanceof Error
                    ? materialsQ.error.message
                    : 'Gagal memuat bahan.'}
                </p>
              ) : materials.length === 0 ? (
                <p className="py-8 text-center text-sm text-lp-on-surface-variant">
                  Belum ada bahan baku yang cocok dengan pencarian / filter.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-lp-surface-container-low text-[11px] font-semibold uppercase tracking-wider text-lp-on-surface-variant">
                        <th className="rounded-l-lg px-3 py-3">Bahan Baku &amp; SKU</th>
                        <th className="px-3 py-3">Sisa Stok Fisik</th>
                        <th className="px-3 py-3">Konversi Satuan</th>
                        <th className="px-3 py-3 text-right">Harga PO Terakhir</th>
                        <th className="px-3 py-3 text-right">HPP Unit Resep</th>
                        <th className="px-3 py-3 text-center">Status</th>
                        {canWrite && (
                          <th className="rounded-r-lg px-3 py-3 text-right">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lp-surface-container/60">
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
                        const iconName = getMaterialIcon(material.name, material.category);

                        return (
                          <tr
                            key={material.id}
                            className="transition-colors hover:bg-lp-surface-container-low/70"
                          >
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                    status === 'critical'
                                      ? 'bg-lp-error-container/40 text-lp-error'
                                      : status === 'low'
                                        ? 'bg-lp-secondary-container/30 text-lp-secondary'
                                        : 'bg-lp-surface-container-high text-lp-primary'
                                  }`}
                                >
                                  <Icon name={iconName} className="text-[18px]" />
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
                                  <span className="text-[11px] text-lp-on-surface-variant">
                                    Min: {formatQty(material.minStockQty)} {unit}
                                  </span>
                                </div>
                                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-lp-surface-container-high">
                                  <div
                                    className={`h-full rounded-full ${
                                      status === 'critical'
                                        ? 'bg-lp-error'
                                        : status === 'low'
                                          ? 'bg-lp-secondary-container'
                                          : 'bg-lp-primary'
                                    }`}
                                    style={{ width: `${ratio}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex flex-col text-[11px]">
                                <span className="font-medium text-lp-on-surface">
                                  {material.purchaseUnitCode &&
                                  (material.packSize ?? 0) > 0
                                    ? `1 ${material.purchaseUnitCode} = ${formatQty(material.packSize ?? 0)} ${unit}`
                                    : `1 ${unit} (satuan dasar)`}
                                </span>
                                {stockUnit &&
                                  !(
                                    stockUnit.factorToBase === 1 &&
                                    stockUnit.baseUnit === unit
                                  ) && (
                                    <span className="text-lp-on-surface-variant">
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
                                  <span className="font-lp-mono text-sm font-semibold text-lp-on-surface">
                                    {formatIDR(material.lastUnitPrice)}
                                  </span>
                                  <span className="block text-[11px] text-lp-on-surface-variant">
                                    / {unit}
                                  </span>
                                </>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-right">
                              <span className="font-lp-mono text-sm font-bold text-lp-primary">
                                {formatIDR(material.costPerUnit)}
                              </span>
                              <span className="block text-[11px] text-lp-on-surface-variant">
                                / {unit}
                              </span>
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
                                            restockStockQty(material),
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
                                    onClick={() => setMaterialToDelete(material)}
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

              {/* Pagination & Summary Footer */}
              <div className="flex items-center justify-between gap-2 pt-3 text-xs text-lp-on-surface-variant">
                <span>
                  Menampilkan <b>{materials.length}</b> dari <b>{total}</b> jenis bahan baku aktif
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

            {/* Right Column: Live Recipe BOM & Auto-HPP Breakdown (4 Cols) */}
            <aside className="sticky top-20 flex flex-col gap-4 rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm xl:col-span-4">
              {/* Panel Header */}
              <span className="flex items-center gap-1.5 text-base font-bold text-lp-on-surface">
                <Icon
                  name="precision_manufacturing"
                  className="text-[20px] text-lp-primary"
                />
                Simulasi Resep &amp; HPP
              </span>

              {/* Selected Recipe Profile Card */}
              {selectedProduct && (
                <div className="flex items-center gap-3 rounded-xl bg-lp-surface-low p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-lp-surface-container shadow-sm">
                    {selectedProduct.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={apiUrl(selectedProduct.imageUrl)}
                        alt={selectedProduct.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lp-tertiary">
                        <Icon name="image" className="text-[22px]" />
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    {selectedProduct.categoryName && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-lp-primary">
                        {selectedProduct.categoryName}
                      </span>
                    )}
                    <h3 className="truncate font-semibold text-lp-on-surface">
                      {selectedProduct.productName}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                      <span className="text-lp-on-surface-variant">Harga Jual POS:</span>
                      <span className="font-lp-mono font-bold text-lp-on-surface">
                        {formatIDR(selectedProduct.price)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Selector Dropdown */}
              <div>
                <label
                  htmlFor="bom-product"
                  className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant"
                >
                  Pilih Menu untuk Simulasi
                </label>
                <DropdownSearch
                  id="bom-product"
                  value={selectedProduct?.productId ?? ''}
                  onChange={(val) => setSelectedProductId(val)}
                  placeholder="Pilih Menu untuk Simulasi…"
                  searchPlaceholder="Cari nama menu / kategori…"
                  options={marginOptions}
                />
              </div>

              {/* Component Line Items (BOM Table) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between pb-1 text-[11px] font-semibold text-lp-on-surface-variant">
                  <span>KOMPOSISI BAHAN (BOM)</span>
                  <span>BIAYA / SERVING</span>
                </div>
                {recipeQ.isPending ? (
                  <p className="py-2 text-xs text-lp-on-surface-variant">
                    Memuat resep…
                  </p>
                ) : bomLines.length === 0 ? (
                  <p className="rounded-lg bg-lp-surface-low p-3 text-xs text-lp-on-surface-variant">
                    Menu ini belum punya resep. Susun komposisi di tab Resep Menu &amp; HPP.
                  </p>
                ) : (
                  bomLines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-lp-surface-low px-2.5 py-2 transition-colors hover:bg-lp-surface-container"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-lp-on-surface">
                          {line.name}
                        </span>
                        <span className="font-lp-mono text-[11px] text-lp-on-surface-variant">
                          {formatQty(line.qtyUsed)} {line.unit} × {formatIDR(line.unitCost)}
                        </span>
                      </div>
                      <span className="font-lp-mono text-xs font-semibold text-lp-on-surface">
                        {formatIDR(line.cost)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Calculation Summary Card */}
              <div className="flex flex-col gap-2 rounded-xl bg-lp-surface-container-high/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-lp-on-surface-variant">
                    Total HPP (Cost per Serving):
                  </span>
                  <span className="font-lp-mono text-sm font-bold text-lp-error">
                    {formatIDR(bomCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-lp-on-surface-variant">
                    Harga Jual Kasir (Net):
                  </span>
                  <span className="font-lp-mono text-sm text-lp-on-surface">
                    {formatIDR(sellPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-lp-surface-container-highest pt-1 text-xs">
                  <span className="font-bold text-lp-on-surface">
                    Gross Profit (Margin Kotor):
                  </span>
                  <span className="font-lp-mono text-sm font-bold text-lp-primary">
                    {formatIDR(grossProfit)}
                    {bomFoodCostPct !== null && (
                      <span className="ml-1 text-[11px] font-normal text-lp-primary">
                        ({(100 - bomFoodCostPct).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                {bomFoodCostPct !== null && (
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-lp-on-surface-variant">
                        Food Cost Ratio
                      </span>
                      <span className="font-bold text-lp-primary">
                        {bomFoodCostPct.toFixed(1)}%
                        {foodCostTarget != null &&
                          ` (${
                            bomFoodCostPct <= foodCostTarget
                              ? 'Sehat & Menguntungkan'
                              : 'Perlu Efisiensi'
                          })`}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-lp-surface-container-highest">
                      <div
                        className={`h-full rounded-full transition-all ${
                          foodCostTarget != null && bomFoodCostPct > foodCostTarget
                            ? 'bg-lp-secondary-container'
                            : 'bg-lp-primary'
                        }`}
                        style={{
                          width: `${Math.min(100, bomFoodCostPct)}%`,
                        }}
                      />
                    </div>
                    {foodCostTarget != null && (
                      <div className="flex justify-between text-[10px] text-lp-on-surface-variant">
                        <span>0%</span>
                        <span>Target &lt;{foodCostTarget}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shock Simulation (Collapsible) */}
              {showShock && (
                <div className="flex flex-col gap-1.5 rounded-lg bg-lp-surface-low p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-lp-on-surface-variant">
                    <span>Simulasi Kenaikan Harga Bahan</span>
                    <span className="font-lp-mono font-bold text-lp-primary">+{priceShock}%</span>
                  </div>
                  <input
                    id="bom-shock"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={priceShock}
                    onChange={(event) =>
                      setPriceShock(Number(event.target.value) || 0)
                    }
                    className="w-full cursor-pointer accent-lp-primary"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowShock((prev) => !prev)}
                  className={`flex h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition ${
                    showShock
                      ? 'bg-lp-primary text-lp-on-primary'
                      : 'bg-lp-surface-container text-lp-on-surface hover:bg-lp-surface-container-high'
                  }`}
                >
                  <Icon name="trending_up" className="text-[16px]" />
                  <span>Simulasi Kenaikan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('recipes')}
                  className="flex h-10 items-center justify-center gap-1 rounded-lg bg-lp-primary px-2 text-xs font-semibold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container"
                >
                  <Icon name="edit_note" className="text-[16px]" />
                  <span>Edit Resep (BOM)</span>
                </button>
              </div>
            </aside>
          </div>

          {/* Bottom Interactive Section: Reorder Point Engine */}
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
                  Dihitung berdasarkan kecepatan penjualan (sales velocity) 7 hari terakhir di POS cabang.
                </span>
              </div>
              {canWrite && (
                <button
                  type="button"
                  disabled={reorderItems.length === 0}
                  onClick={() => {
                    setBulkItems(
                      reorderItems.map((item) => ({
                        rawMaterialId: item.rawMaterialId,
                        // POs are received in stock units, so order the stock-unit
                        // recommendation — never the purchase-unit count.
                        qtyOrdered: String(
                          Math.max(1, Math.ceil(item.recommendedQty)),
                        ),
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
              <p className="py-4 text-center text-sm text-lp-on-surface-variant">
                Semua bahan di atas ambang minimum. Tidak ada yang perlu direstock saat ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {reorderItems.slice(0, 6).map((item) => (
                  <div
                    key={item.rawMaterialId}
                    className="flex flex-col justify-between gap-3 rounded-xl bg-lp-surface-low p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold text-lp-on-surface">
                          {item.name}
                        </span>
                        {item.supplierName && (
                          <span className="truncate text-[11px] text-lp-on-surface-variant">
                            {item.supplierName}
                          </span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-bold ${
                          item.status === 'critical'
                            ? 'bg-lp-error/10 text-lp-error'
                            : 'bg-lp-secondary-fixed text-lp-on-secondary-fixed'
                        }`}
                      >
                        {item.status === 'ok'
                          ? item.daysLeft !== null
                            ? `${item.daysLeft} hari lagi`
                            : 'Menipis'
                          : STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2 pt-1">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-lp-on-surface-variant">
                          Rekomendasi Order:
                        </span>
                        <span className="font-lp-mono text-sm font-semibold text-lp-on-surface">
                          {item.purchaseQty
                            ? `${formatQty(item.purchaseQty.qty)} ${item.purchaseQty.unit}`
                            : `${formatQty(item.recommendedQty)} ${item.unit}`}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[11px] text-lp-on-surface-variant">
                          Est. Biaya:
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
      ) : tab === 'purchase' ? (
        <PurchaseOrderView
          materials={allMaterials}
          canWrite={canWrite}
          initialItems={bulkItems}
          onInitialItemsConsumed={() => setBulkItems(null)}
        />
      ) : tab === 'audit' ? (
        <div className="flex flex-col gap-5">
          {/* Sub Navigation for Loss Prevention & Audit */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-2.5 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAuditSubTab('opname')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  auditSubTab === 'opname'
                    ? 'bg-lp-primary text-lp-on-primary shadow-xs'
                    : 'bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface'
                }`}
              >
                <Icon name="rule" className="text-[16px]" />
                <span>Audit Stok Opname Fisik</span>
              </button>
              <button
                type="button"
                onClick={() => setAuditSubTab('waste')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  auditSubTab === 'waste'
                    ? 'bg-lp-primary text-lp-on-primary shadow-xs'
                    : 'bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface'
                }`}
              >
                <Icon name="delete_sweep" className="text-[16px]" />
                <span>Pencatatan Waste &amp; Kerugian</span>
              </button>
              <button
                type="button"
                onClick={() => setAuditSubTab('reports')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  auditSubTab === 'reports'
                    ? 'bg-lp-primary text-lp-on-primary shadow-xs'
                    : 'bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface'
                }`}
              >
                <Icon name="history" className="text-[16px]" />
                <span>Buku Mutasi Stok &amp; Analisis</span>
              </button>
            </div>
            <span className="text-xs text-lp-tertiary hidden sm:block">
              Modul Rekonsiliasi &amp; Kontrol Kebocoran Stok Bar/Gudang
            </span>
          </div>

          {auditSubTab === 'opname' ? (
            <OpnameView canWrite={canWrite} />
          ) : auditSubTab === 'waste' ? (
            <WasteView materials={allMaterials} canWrite={canWrite} />
          ) : (
            <ReportsView />
          )}
        </div>
      ) : (
        /* TAB 4: ANALISIS HPP & RESEP (BOM ENGINE) */
        <div className="flex flex-col gap-5">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-5 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary shadow-2xs">
                <Icon name="calculate" className="text-[24px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-lp-on-surface">
                    Analisis HPP &amp; Resep Menu (BOM Engine)
                  </h2>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-lp-primary">
                    Live COGS Engine
                  </span>
                </div>
                <p className="text-xs text-lp-on-surface-variant mt-0.5">
                  Pantau persentase Food Cost Ratio tiap menu dan kelola racikan bahan baku untuk menjaga profitabilitas bisnis F&amp;B.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-lp-surface-low px-3.5 py-2 border border-lp-outline-variant/20">
                <span className="text-lp-tertiary font-medium">Target Food Cost Ideal:</span>
                <span className="font-lp-mono font-bold text-lp-primary">
                  &lt;{foodCostTarget ?? 32}%
                </span>
              </div>
            </div>
          </div>

          {/* Studio Split Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Column: Menu Catalog with Margins (4 Cols) */}
            <div className="xl:col-span-4 flex flex-col gap-3 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-lp-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <Icon name="restaurant_menu" className="text-[20px] text-lp-primary" />
                  <h3 className="text-sm font-bold text-lp-on-surface">
                    Menu &amp; Food Cost ({margins.length})
                  </h3>
                </div>
                <span className="text-[11px] text-lp-tertiary">
                  {healthyCount} Sehat
                </span>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-lp-tertiary"
                  />
                  <input
                    type="text"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder="Cari nama menu F&amp;B…"
                    aria-label="Cari menu untuk resep"
                    className="h-9 w-full rounded-xl border border-lp-outline-variant/30 bg-lp-surface-low pl-8 pr-3 text-xs text-lp-on-surface outline-none transition focus:border-lp-primary focus:bg-lp-surface-container-lowest"
                  />
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setRecipeFilter('all')}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      recipeFilter === 'all'
                        ? 'bg-lp-primary text-lp-on-primary font-bold shadow-2xs'
                        : 'bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container'
                    }`}
                  >
                    Semua ({margins.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipeFilter('healthy')}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      recipeFilter === 'healthy'
                        ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                        : 'bg-emerald-50 text-lp-primary hover:bg-emerald-100'
                    }`}
                  >
                    Sehat ({healthyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipeFilter('warning')}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      recipeFilter === 'warning'
                        ? 'bg-amber-600 text-white font-bold shadow-2xs'
                        : 'bg-amber-50 text-lp-secondary hover:bg-amber-100'
                    }`}
                  >
                    Waspada
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipeFilter('critical')}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      recipeFilter === 'critical'
                        ? 'bg-rose-600 text-white font-bold shadow-2xs'
                        : 'bg-rose-50 text-lp-error hover:bg-rose-100'
                    }`}
                  >
                    Kritis ({warningCount})
                  </button>
                </div>
              </div>

              {/* Menu List */}
              {marginsQ.isPending ? (
                <div className="flex items-center justify-center py-10 text-xs text-lp-tertiary">
                  Memuat data menu…
                </div>
              ) : filteredMargins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-lp-tertiary">
                  <Icon name="search_off" className="text-[28px] mb-1 opacity-60" />
                  <p>Tidak ada menu yang sesuai filter.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-1">
                  {filteredMargins.map((row) => {
                    const active = selectedProduct?.productId === row.productId;
                    const rowFoodCost = row.price > 0 ? (row.cogs / row.price) * 100 : 0;
                    const isHealthy = rowFoodCost > 0 && rowFoodCost <= 30;
                    const isWarning = rowFoodCost > 30 && rowFoodCost <= 35;
                    const isCritical = rowFoodCost > 35;

                    return (
                      <button
                        key={row.productId}
                        type="button"
                        onClick={() => setSelectedProductId(row.productId)}
                        className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all ${
                          active
                            ? 'border-lp-primary bg-lp-primary/5 shadow-xs'
                            : 'border-lp-outline-variant/20 bg-lp-surface-low hover:border-lp-outline-variant/40 hover:bg-lp-surface-container'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-lp-on-surface line-clamp-1">
                            {row.productName}
                          </span>
                          {rowFoodCost > 0 ? (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                isHealthy
                                  ? 'bg-emerald-50 text-lp-primary border-emerald-200'
                                  : isWarning
                                    ? 'bg-amber-50 text-lp-secondary border-amber-200'
                                    : isCritical
                                      ? 'bg-rose-50 text-lp-error border-rose-200'
                                      : 'bg-lp-surface-container text-lp-outline border-lp-outline-variant/30'
                              }`}
                            >
                              FC {rowFoodCost.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-lp-surface-container px-2 py-0.5 text-[10px] font-semibold text-lp-tertiary">
                              No BOM
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-lp-on-surface-variant font-lp-mono">
                          <span>HPP: {formatIDR(row.cogs)}</span>
                          <span className="font-bold text-lp-on-surface">
                            Jual: {formatIDR(row.price)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Recipe Composition & Simulator (8 Cols) */}
            <div className="xl:col-span-8 flex flex-col gap-5">
              {selectedProduct ? (
                <>
                  {/* Financial Metrics Summary Card */}
                  <div className="flex flex-col gap-4 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lp-outline-variant/20 pb-3">
                      <div>
                        {selectedProduct.categoryName && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-lp-primary">
                            {selectedProduct.categoryName}
                          </span>
                        )}
                        <h3 className="text-base font-bold text-lp-on-surface">
                          {selectedProduct.productName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-lp-tertiary">Harga Jual POS:</span>
                        <span className="font-lp-mono text-base font-extrabold text-lp-on-surface">
                          {formatIDR(selectedProduct.price)}
                        </span>
                      </div>
                    </div>

                    {/* 3 Metric Tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col rounded-xl bg-lp-surface-low p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-lp-tertiary">
                          Harga Jual Kasir (Net)
                        </span>
                        <span className="mt-1 font-lp-mono text-lg font-bold text-lp-on-surface">
                          {formatIDR(sellPrice)}
                        </span>
                      </div>

                      <div className="flex flex-col rounded-xl bg-lp-surface-low p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-lp-tertiary">
                          Total HPP / Porsi {priceShock > 0 && `(+${priceShock}%)`}
                        </span>
                        <span className="mt-1 font-lp-mono text-lg font-bold text-lp-error">
                          {formatIDR(bomCost)}
                        </span>
                      </div>

                      <div className="flex flex-col rounded-xl bg-lp-surface-low p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-lp-tertiary">
                          Margin Kotor (Gross Profit)
                        </span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="font-lp-mono text-lg font-bold text-lp-primary">
                            {formatIDR(grossProfit)}
                          </span>
                          {sellPrice > 0 && (
                            <span className="font-lp-mono text-xs text-lp-primary font-semibold">
                              ({(100 - (bomFoodCostPct ?? 0)).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Food Cost Ratio Gauge */}
                    {bomFoodCostPct !== null && (
                      <div className="flex flex-col gap-1.5 rounded-xl border border-lp-outline-variant/20 bg-lp-surface-low/60 p-3.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-lp-on-surface">
                            Food Cost Ratio (Rasio Biaya Bahan):
                          </span>
                          <span
                            className={`font-lp-mono font-bold ${
                              bomFoodCostPct <= 30
                                ? 'text-lp-primary'
                                : bomFoodCostPct <= 35
                                  ? 'text-lp-secondary'
                                  : 'text-lp-error'
                            }`}
                          >
                            {bomFoodCostPct.toFixed(1)}%{' '}
                            {bomFoodCostPct <= 30
                              ? '(Sehat & Menguntungkan)'
                              : bomFoodCostPct <= 35
                                ? '(Waspada)'
                                : '(Perlu Efisiensi)'}
                          </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-lp-surface-container-highest">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              bomFoodCostPct <= 30
                                ? 'bg-lp-primary'
                                : bomFoodCostPct <= 35
                                  ? 'bg-lp-secondary-container'
                                  : 'bg-lp-error'
                            }`}
                            style={{ width: `${Math.min(100, bomFoodCostPct)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-lp-tertiary">
                          <span>0% (Ideal &lt;30%)</span>
                          <span>Batas Aman: 32%</span>
                          <span>Batas Maks: 35%</span>
                        </div>
                      </div>
                    )}

                    {/* What-If Price Shock Simulator */}
                    <div className="flex flex-col gap-2 rounded-xl bg-lp-surface-low p-3.5 border border-lp-outline-variant/20">
                      <div className="flex items-center justify-between text-xs font-semibold text-lp-on-surface">
                        <span className="flex items-center gap-1.5">
                          <Icon name="trending_up" className="text-[16px] text-lp-primary" />
                          <span>Simulasi Kenaikan Harga Bahan Baku (What-If Analysis)</span>
                        </span>
                        <span className="font-lp-mono font-bold text-lp-primary">
                          +{priceShock}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[0, 5, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setPriceShock(pct)}
                            className={`rounded-lg px-2.5 py-1 font-lp-mono text-xs font-bold transition ${
                              priceShock === pct
                                ? 'bg-lp-primary text-white shadow-2xs'
                                : 'bg-lp-surface-container text-lp-on-surface hover:bg-lp-surface-container-high'
                            }`}
                          >
                            {pct === 0 ? 'Normal (0%)' : `+${pct}%`}
                          </button>
                        ))}
                      </div>
                      {priceShock > 0 && (
                        <p className="text-[11px] text-lp-on-surface-variant leading-relaxed">
                          Jika biaya bahan baku naik <span className="font-bold text-lp-error">+{priceShock}%</span>, total HPP menjadi <span className="font-lp-mono font-bold">{formatIDR(bomCost)}</span> dan keuntungan kotor berkurang menjadi <span className="font-lp-mono font-bold text-lp-primary">{formatIDR(grossProfit)}</span>.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recipe Editor Card */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-lp-outline-variant/20 pb-3">
                      <div className="flex items-center gap-2">
                        <Icon name="edit_note" className="text-[20px] text-lp-primary" />
                        <h4 className="text-sm font-bold text-lp-on-surface">
                          Komposisi Bahan Baku (BOM)
                        </h4>
                      </div>
                      <span className="text-xs text-lp-tertiary">
                        Satuan &amp; Takaran per Serving
                      </span>
                    </div>

                    <div className="flex items-start gap-2 rounded-xl bg-lp-surface-low p-3 text-xs text-lp-on-surface-variant">
                      <Icon name="bolt" className="text-[18px] text-lp-primary shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Setiap kali kasir POS menjual <b>{selectedProduct.productName}</b>, kuantitas bahan-bahan di bawah akan otomatis dipotong dari stok gudang/bar outlet ini.
                      </p>
                    </div>

                    <RecipeEditor
                      product={{
                        id: selectedProduct.productId,
                        name: selectedProduct.productName,
                        basePrice: selectedProduct.price,
                      }}
                      materials={allMaterials}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-lp-outline-variant/40 bg-lp-surface-low/50 py-16 text-center">
                  <Icon name="restaurant_menu" className="text-[36px] text-lp-tertiary mb-2" />
                  <h4 className="text-sm font-bold text-lp-on-surface">
                    Pilih Menu F&amp;B untuk Dianalisis
                  </h4>
                  <p className="text-xs text-lp-tertiary mt-1 max-w-sm">
                    Pilih salah satu menu dari daftar di sebelah kiri untuk melihat takaran bahan, analisis HPP, dan simulasi keuntungan kotor.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
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

      <ConfirmDialog
        open={materialToDelete !== null}
        title={`Hapus Bahan "${materialToDelete?.name}"?`}
        description="Bahan baku ini akan dihapus dari inventori gudang. Pastikan bahan ini tidak sedang digunakan pada resep aktif."
        confirmText="Ya, Hapus Bahan"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteM.isPending}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={() => {
          if (materialToDelete) {
            deleteM.mutate(materialToDelete.id, {
              onSettled: () => setMaterialToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}
