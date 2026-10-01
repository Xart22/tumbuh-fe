'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownSearch } from '@/components/ui/dropdown-search';
import {
  createProductBundle,
  deleteProductBundle,
  listProductBundles,
  listProductsPage,
} from '@/lib/api';
import { formatIDR } from '@/lib/format';
import type { ProductBundle } from '@/lib/types';

export const bundleSchema = z.object({
  name: z.string().trim().min(1, 'Nama bundling wajib diisi.'),
  price: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, 'Harga harus lebih dari 0.'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().min(1),
      }),
    )
    .min(1, 'Minimal satu produk.'),
});

export type BundleFormValues = z.infer<typeof bundleSchema>;

type DraftItem = { productId: string; qty: number };

export function BundlesManager({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bundleToDelete, setBundleToDelete] = useState<ProductBundle | null>(null);

  // Keyboard Escape listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !bundleToDelete) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, bundleToDelete]);

  const bundlesQ = useQuery({
    queryKey: ['product-bundles'],
    queryFn: listProductBundles,
  });

  const productsQ = useQuery({
    queryKey: ['menu', 'products', 'bundles-picker'],
    queryFn: () => listProductsPage({ page: 1, limit: 100 }),
  });

  const products = useMemo(() => productsQ.data?.items ?? [], [productsQ.data?.items]);
  const bundles = useMemo(() => bundlesQ.data ?? [], [bundlesQ.data]);

  // Product lookup map for fast details access
  const productMap = useMemo(() => {
    const map = new Map<string, (typeof products)[number]>();
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  const productOptions = useMemo(() => {
    return products.map((product) => ({
      value: product.id,
      label: product.name,
      badge: product.sku ?? undefined,
      subLabel: formatIDR(product.basePrice),
    }));
  }, [products]);

  // Financial calculations for builder
  const totalRetailPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      const prod = productMap.get(item.productId);
      return sum + (prod ? prod.basePrice * item.qty : 0);
    }, 0);
  }, [items, productMap]);

  const priceNum = Number(price);
  const isPriceValid = !isNaN(priceNum) && priceNum > 0;
  const savings = totalRetailPrice > 0 && isPriceValid ? totalRetailPrice - priceNum : 0;
  const savingsPercent =
    totalRetailPrice > 0 && savings > 0 ? Math.round((savings / totalRetailPrice) * 100) : 0;

  // Filtered bundles list
  const filteredBundles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return bundles;
    return bundles.filter((bundle) => {
      const matchName = bundle.name.toLowerCase().includes(q);
      const matchItem = bundle.items.some((it) => {
        const prod = productMap.get(it.productId);
        return (
          it.productName?.toLowerCase().includes(q) ||
          prod?.name.toLowerCase().includes(q)
        );
      });
      return matchName || matchItem;
    });
  }, [bundles, searchQuery, productMap]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['product-bundles'] });

  const createM = useMutation({
    mutationFn: () =>
      createProductBundle({
        name: name.trim(),
        price: Number(price),
        items,
      }),
    onSuccess: () => {
      setName('');
      setPrice('');
      setItems([]);
      setError(null);
      setActiveTab('list');
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan bundling.'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteProductBundle(id),
    onSuccess: () => {
      setBundleToDelete(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menghapus bundling.'),
  });

  function handleStartCreate() {
    setError(null);
    if (items.length === 0 && products.length > 0) {
      setItems([{ productId: products[0].id, qty: 1 }]);
    }
    setActiveTab('create');
  }

  function handleAddItem() {
    if (products.length === 0) return;
    setItems((state) => [...state, { productId: products[0].id, qty: 1 }]);
  }

  function handleUpdateItem(index: number, patch: Partial<DraftItem>) {
    setItems((state) =>
      state.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function handleRemoveItem(index: number) {
    setItems((state) => state.filter((_, i) => i !== index));
  }

  function submit() {
    const parsed = bundleSchema.safeParse({ name, price, items });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Data belum lengkap.');
      return;
    }
    createM.mutate();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bundles-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !bundleToDelete) onClose();
      }}
    >
      <div className="relative flex w-full max-w-5xl max-h-[90vh] flex-col rounded-3xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="flex flex-col gap-4 border-b border-lp-outline-variant/20 bg-lp-surface-container-lowest px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary shadow-xs">
                <Icon name="inventory_2" className="text-[24px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="bundles-modal-title"
                    className="text-lg sm:text-xl font-bold tracking-tight text-lp-on-surface"
                  >
                    Bundling &amp; Paket Menu F&amp;B
                  </h2>
                  <span className="rounded-full bg-lp-surface-container px-2.5 py-0.5 text-[11px] font-semibold text-lp-on-surface-variant">
                    {bundles.length} Paket
                  </span>
                </div>
                <p className="text-xs text-lp-on-surface-variant mt-0.5">
                  Kombinasikan beberapa produk menjadi satu paket hemat untuk meningkatkan nilai transaksi kasir (AOV).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal bundling"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lp-tertiary hover:bg-lp-surface-container hover:text-lp-on-surface transition-colors"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center justify-between border-t border-lp-outline-variant/15 pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
                  activeTab === 'list'
                    ? 'bg-lp-primary text-lp-on-primary shadow-xs'
                    : 'bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface'
                }`}
              >
                <Icon name="view_list" className="text-[16px]" />
                <span>Daftar Paket Bundling ({bundles.length})</span>
              </button>

              <button
                type="button"
                onClick={handleStartCreate}
                className={`flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
                  activeTab === 'create'
                    ? 'bg-lp-primary text-lp-on-primary shadow-xs'
                    : 'bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface'
                }`}
              >
                <Icon name="add_circle" className="text-[16px]" />
                <span>+ Buat Paket Baru</span>
              </button>
            </div>

            {activeTab === 'list' && bundles.length > 0 && (
              <div className="relative hidden sm:block w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari paket atau produk…"
                  aria-label="Cari paket bundling"
                  className="h-9 w-full rounded-xl border border-lp-outline-variant/30 bg-lp-surface-low pl-8 pr-3 text-xs text-lp-on-surface outline-none transition focus:border-lp-primary focus:bg-lp-surface-container-lowest"
                />
                <Icon
                  name="search"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-lp-tertiary pointer-events-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-center justify-between rounded-xl border border-lp-error/20 bg-lp-error-container/40 px-4 py-2.5 text-xs font-semibold text-lp-on-error-container"
            >
              <div className="flex items-center gap-2">
                <Icon name="error" className="text-[18px] text-lp-error" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Tutup error"
                className="text-lp-on-error-container hover:opacity-75"
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            </div>
          )}

          {activeTab === 'list' ? (
            /* TAB 1: DAFTAR BUNDLING */
            <div className="flex flex-col gap-4">
              {bundlesQ.isPending ? (
                <div className="flex flex-col items-center justify-center py-16 text-lp-tertiary">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-lp-primary border-t-transparent mb-3" />
                  <p className="text-xs font-medium">Memuat daftar paket bundling…</p>
                </div>
              ) : bundles.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-lp-outline-variant/40 bg-lp-surface-low/50 py-16 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary mb-3.5 shadow-2xs">
                    <Icon name="inventory_2" className="text-[32px]" />
                  </div>
                  <h3 className="text-base font-bold text-lp-on-surface">
                    Belum Ada Paket Bundling
                  </h3>
                  <p className="mt-1.5 max-w-md text-xs text-lp-on-surface-variant leading-relaxed">
                    Tingkatkan rata-rata pembelian dengan menggabungkan makanan &amp; minuman favorit dalam satu harga spesial paket.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="mt-5 flex h-11 items-center gap-2 rounded-xl bg-lp-primary px-5 text-xs font-bold text-lp-on-primary shadow-sm hover:bg-lp-primary-container transition"
                  >
                    <Icon name="add" className="text-[18px]" />
                    <span>Buat Paket Bundling Pertama</span>
                  </button>
                </div>
              ) : filteredBundles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Icon name="search_off" className="text-[32px] text-lp-tertiary mb-2" />
                  <p className="text-sm font-semibold text-lp-on-surface">
                    Tidak ada paket yang sesuai pencarian
                  </p>
                  <p className="text-xs text-lp-tertiary mt-1">
                    Coba kata kunci lain atau hapus filter pencarian.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBundles.map((bundle) => {
                    const retailSum = bundle.items.reduce((sum, item) => {
                      const prod = productMap.get(item.productId);
                      return sum + (prod ? prod.basePrice * item.qty : 0);
                    }, 0);
                    const bundleSavings =
                      retailSum > bundle.price ? retailSum - bundle.price : 0;
                    const bundleDiscountPct =
                      retailSum > 0 && bundleSavings > 0
                        ? Math.round((bundleSavings / retailSum) * 100)
                        : 0;
                    const totalQty = bundle.items.reduce((acc, it) => acc + it.qty, 0);

                    return (
                      <div
                        key={bundle.id}
                        className="group relative flex flex-col justify-between rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-4 shadow-xs transition hover:border-lp-primary/40 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-3">
                          {/* Top Row: Name + Delete Action */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lp-primary/10 text-lp-primary">
                                <Icon name="lunch_dining" className="text-[20px]" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold text-lp-on-surface truncate">
                                    {bundle.name}
                                  </h3>
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-lp-primary border border-emerald-200">
                                    Aktif di POS
                                  </span>
                                </div>
                                <p className="text-[11px] text-lp-tertiary mt-0.5">
                                  {totalQty} porsi item dalam paket
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              aria-label={`Hapus bundling ${bundle.name}`}
                              disabled={deleteM.isPending}
                              onClick={() => setBundleToDelete(bundle)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lp-tertiary transition hover:bg-lp-error-container hover:text-lp-on-error-container disabled:opacity-50"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </div>

                          {/* Price & Savings Pill Bar */}
                          <div className="flex items-center justify-between rounded-xl bg-lp-surface-low px-3.5 py-2.5">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-lp-tertiary block">
                                Harga Paket
                              </span>
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="font-lp-mono text-base font-extrabold text-lp-primary">
                                  {formatIDR(bundle.price)}
                                </span>
                                {retailSum > bundle.price && (
                                  <span className="font-lp-mono text-xs text-lp-tertiary line-through">
                                    {formatIDR(retailSum)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {bundleSavings > 0 ? (
                              <div className="flex flex-col items-end">
                                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-lp-primary">
                                  Hemat {formatIDR(bundleSavings)} ({bundleDiscountPct}%)
                                </span>
                              </div>
                            ) : null}
                          </div>

                          {/* Items Breakdown Tags */}
                          <div className="flex flex-col gap-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-lp-tertiary">
                              Isi Menu Paket:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {bundle.items.map((item, idx) => {
                                const matchedProd = productMap.get(item.productId);
                                return (
                                  <div
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-lp-outline-variant/25 bg-lp-surface-container-lowest px-2.5 py-1 text-xs text-lp-on-surface"
                                  >
                                    <span className="font-lp-mono font-bold text-lp-primary">
                                      {item.qty}×
                                    </span>
                                    <span className="truncate max-w-[160px]">
                                      {item.productName ?? matchedProd?.name ?? 'Menu'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: BUILDER STUDIO (2 COLUMNS) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form & Item Selectors (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                {/* 1. Detail Paket */}
                <div className="flex flex-col gap-3 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lp-primary text-white text-xs font-bold">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-lp-on-surface">
                      Informasi Paket
                    </h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="bundle-name-input"
                      className="text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant"
                    >
                      Nama Paket Bundling
                    </label>
                    <input
                      id="bundle-name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Paket Sarapan Pagi (Kopi + Croissant)"
                      aria-label="Nama bundling"
                      className="h-11 rounded-xl border border-lp-outline-variant/40 bg-lp-surface-low px-3.5 text-sm font-medium text-lp-on-surface outline-none transition focus:border-lp-primary focus:bg-lp-surface-container-lowest focus:ring-2 focus:ring-lp-primary/20"
                    />
                  </div>
                </div>

                {/* 2. Menu Items in Bundle */}
                <div className="flex flex-col gap-3 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lp-primary text-white text-xs font-bold">
                        2
                      </span>
                      <h3 className="text-sm font-bold text-lp-on-surface">
                        Menu Produk dalam Paket
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-lp-tertiary">
                      {items.length} menu terpilih
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {items.map((item, index) => {
                      const prod = productMap.get(item.productId);
                      const subtotal = (prod?.basePrice ?? 0) * item.qty;

                      return (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-xl border border-lp-outline-variant/30 bg-lp-surface-low p-3 transition"
                        >
                          <div className="flex-1 min-w-0">
                            <DropdownSearch
                              size="sm"
                              value={item.productId}
                              onChange={(val) =>
                                handleUpdateItem(index, { productId: val })
                              }
                              placeholder="Pilih menu produk…"
                              searchPlaceholder="Cari menu F&B / SKU…"
                              options={productOptions}
                              aria-label={`Produk ${index + 1}`}
                            />
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            {/* Stepper Qty */}
                            <div className="flex items-center rounded-lg border border-lp-outline-variant/30 bg-lp-surface-container-lowest">
                              <button
                                type="button"
                                aria-label="Kurangi jumlah"
                                disabled={item.qty <= 1}
                                onClick={() =>
                                  handleUpdateItem(index, {
                                    qty: Math.max(1, item.qty - 1),
                                  })
                                }
                                className="flex h-8 w-8 items-center justify-center text-lp-on-surface-variant hover:bg-lp-surface-container disabled:opacity-40"
                              >
                                <Icon name="remove" className="text-[14px]" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) =>
                                  handleUpdateItem(index, {
                                    qty: Math.max(1, parseInt(e.target.value) || 1),
                                  })
                                }
                                aria-label={`Jumlah ${index + 1}`}
                                className="h-8 w-10 text-center font-lp-mono text-xs font-bold text-lp-on-surface outline-none"
                              />
                              <button
                                type="button"
                                aria-label="Tambah jumlah"
                                onClick={() =>
                                  handleUpdateItem(index, { qty: item.qty + 1 })
                                }
                                className="flex h-8 w-8 items-center justify-center text-lp-on-surface-variant hover:bg-lp-surface-container"
                              >
                                <Icon name="add" className="text-[14px]" />
                              </button>
                            </div>

                            {/* Subtotal Retail */}
                            <div className="w-24 text-right">
                              <span className="font-lp-mono text-xs font-bold text-lp-on-surface">
                                {formatIDR(subtotal)}
                              </span>
                              <span className="block text-[10px] text-lp-tertiary">
                                {item.qty}× normal
                              </span>
                            </div>

                            {/* Remove row */}
                            <button
                              type="button"
                              aria-label={`Hapus produk ${index + 1}`}
                              onClick={() => handleRemoveItem(index)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-lp-tertiary transition hover:bg-lp-error-container hover:text-lp-on-error-container"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      disabled={products.length === 0}
                      onClick={handleAddItem}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-lp-primary/40 bg-lp-primary/5 text-xs font-bold text-lp-primary transition hover:bg-lp-primary/10 disabled:opacity-50"
                    >
                      <Icon name="add_circle" className="text-[18px]" />
                      <span>+ Tambah Menu ke Paket</span>
                    </button>
                  </div>
                </div>

                {/* 3. Pricing */}
                <div className="flex flex-col gap-3 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lp-primary text-white text-xs font-bold">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-lp-on-surface">
                      Harga Jual Paket Bundling
                    </h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="bundle-price-input"
                      className="text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant"
                    >
                      Harga Spesial Paket
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-lp-mono text-xs font-bold text-lp-tertiary">
                        Rp
                      </span>
                      <input
                        id="bundle-price-input"
                        type="number"
                        min={0}
                        step={1000}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Contoh: 35000"
                        aria-label="Harga bundling"
                        className="h-11 w-full rounded-xl border border-lp-outline-variant/40 bg-lp-surface-low pl-10 pr-3.5 font-lp-mono text-sm font-bold text-lp-on-surface outline-none transition focus:border-lp-primary focus:bg-lp-surface-container-lowest focus:ring-2 focus:ring-lp-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-lp-tertiary mt-0.5">
                      Harga ini yang akan ditagihkan kepada pelanggan saat kasir memilih paket kombo ini.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Financial & Promotion Preview (5 Cols) */}
              <div className="lg:col-span-5 sticky top-0 flex flex-col gap-4">
                <div className="flex flex-col rounded-2xl border border-lp-outline-variant/40 bg-lp-surface-low p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-lp-outline-variant/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="analytics" className="text-[20px] text-lp-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-lp-on-surface">
                        Simulasi Nilai &amp; Promo
                      </h4>
                    </div>
                    <span className="rounded-full bg-lp-primary/10 px-2 py-0.5 text-[10px] font-bold text-lp-primary">
                      Pratinjau
                    </span>
                  </div>

                  {/* Calculations */}
                  <div className="flex flex-col gap-3 py-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-lp-on-surface-variant font-medium">
                        Total Harga Eceran Asli:
                      </span>
                      <span className="font-lp-mono font-bold text-lp-on-surface">
                        {formatIDR(totalRetailPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-lp-on-surface-variant font-medium">
                        Harga Spesial Paket:
                      </span>
                      <span className="font-lp-mono text-sm font-bold text-lp-primary">
                        {isPriceValid ? formatIDR(priceNum) : 'Rp 0'}
                      </span>
                    </div>

                    {/* Savings Status Box */}
                    {savings > 0 ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-lp-primary">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Icon name="trending_down" className="text-[16px]" />
                          <span>Konsumen Hemat {formatIDR(savings)} ({savingsPercent}%)</span>
                        </div>
                        <p className="mt-1 text-[11px] text-lp-on-surface-variant leading-relaxed">
                          Penawaran menarik! Pelanggan mendapatkan potongan {savingsPercent}% dibanding membeli satuan.
                        </p>
                      </div>
                    ) : isPriceValid && totalRetailPrice > 0 && priceNum >= totalRetailPrice ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-lp-secondary">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Icon name="info" className="text-[16px]" />
                          <span>Perhatian: Tidak Ada Potongan Harga</span>
                        </div>
                        <p className="mt-1 text-[11px] text-lp-on-surface-variant leading-relaxed">
                          Harga paket sama atau lebih tinggi dari total eceran normal. Biasanya paket kombo memberikan harga lebih murah.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-3 text-xs text-lp-tertiary">
                        Tentukan menu dan harga paket untuk melihat perbandingan penghematan konsumen.
                      </div>
                    )}
                  </div>

                  {/* Summary of Items */}
                  <div className="border-t border-lp-outline-variant/20 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-lp-tertiary block mb-2">
                      Ringkasan Menu Paket ({items.length}):
                    </span>
                    {items.length === 0 ? (
                      <p className="text-xs text-lp-tertiary italic">
                        Belum ada menu yang dipilih.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {items.map((it, idx) => {
                          const prod = productMap.get(it.productId);
                          return (
                            <li
                              key={idx}
                              className="flex items-center justify-between text-xs text-lp-on-surface py-0.5"
                            >
                              <span className="truncate pr-2">
                                <span className="font-lp-mono font-bold text-lp-primary mr-1">
                                  {it.qty}×
                                </span>
                                {prod?.name ?? 'Menu F&B'}
                              </span>
                              <span className="font-lp-mono text-[11px] text-lp-tertiary shrink-0">
                                {prod ? formatIDR(prod.basePrice * it.qty) : '-'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-5 border-t border-lp-outline-variant/20">
                    <button
                      type="button"
                      disabled={createM.isPending || items.length === 0}
                      onClick={submit}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lp-primary px-4 text-xs font-bold text-lp-on-primary shadow-sm hover:bg-lp-primary-container transition disabled:opacity-50"
                    >
                      {createM.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Menyimpan Paket…</span>
                        </>
                      ) : (
                        <>
                          <Icon name="check" className="text-[18px]" />
                          <span>Simpan Paket Bundling</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className="flex h-10 w-full items-center justify-center rounded-xl border border-lp-outline-variant/40 bg-lp-surface-container-lowest text-xs font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container transition"
                    >
                      Batal &amp; Kembali ke Daftar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={bundleToDelete !== null}
        title={`Hapus Bundling "${bundleToDelete?.name}"?`}
        description="Paket bundling ini akan dihapus dari daftar menu kasir POS."
        confirmText="Ya, Hapus Bundling"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteM.isPending}
        onClose={() => setBundleToDelete(null)}
        onConfirm={() => {
          if (bundleToDelete) {
            deleteM.mutate(bundleToDelete.id);
          }
        }}
      />
    </div>
  );
}
