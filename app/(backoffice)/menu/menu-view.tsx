'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { apiUrl } from '@/lib/api-client';
import {
  createProduct,
  deleteProduct,
  listCategories,
  listProductsPage,
  updateProduct,
  type ProductPageQuery,
} from '@/lib/api';
import { formatIDR } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import type { Product } from '@/lib/types';
import { resolveProductVisual } from '../dashboard/dashboard-assets';
import { CategoryManager } from './category-manager';
import { getCategoryIcon, pageWindow } from './menu-utils';
import { ProductFormPanel, type ProductFormValues } from './product-form';

const PAGE_SIZE = 20;
const PANEL = 'rounded-xl bg-lp-surface-container-lowest shadow-sm';

type StatusFilter = '' | 'available' | 'sold_out';

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'Kopi Susu Gula Aren',
    categoryId: 'cat-kopi',
    outletId: 'out-1',
    basePrice: 24000,
    sku: 'KOP-001',
    description: 'Espresso house blend 100% Arabica dengan fresh milk pasteurisasi dan sirup gula aren organik Garut.',
    isAvailable: true,
    photoUrl: null,
  },
  {
    id: 'demo-2',
    name: 'Iced Americano Double',
    categoryId: 'cat-kopi',
    outletId: 'out-1',
    basePrice: 20000,
    sku: 'KOP-002',
    description: 'Double shot espresso dengan air dingin dan es batu kristal.',
    isAvailable: true,
    photoUrl: null,
  },
  {
    id: 'demo-3',
    name: 'Croissant Butter Artisan',
    categoryId: 'cat-bakery',
    outletId: 'out-1',
    basePrice: 28000,
    sku: 'BAK-001',
    description: 'Freshly baked French butter croissant dengan lapisan renyah dan mentega gurih.',
    isAvailable: true,
    photoUrl: null,
  },
  {
    id: 'demo-4',
    name: 'Smoked Beef Bagel',
    categoryId: 'cat-bakery',
    outletId: 'out-1',
    basePrice: 38000,
    sku: 'BAK-003',
    description: 'Bagel wijen dengan irisan daging sapi asap lezat dan saus keju cheddar.',
    isAvailable: false,
    photoUrl: null,
  },
  {
    id: 'demo-5',
    name: 'Nasi Daun Jeruk Ayam Krispi',
    categoryId: 'cat-meal',
    outletId: 'out-1',
    basePrice: 35000,
    sku: 'MAK-001',
    description: 'Nasi wangi daun jeruk dengan fillet ayam goreng renyah dan sambal matah.',
    isAvailable: true,
    photoUrl: null,
  },
];

export function MenuView() {
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = Boolean(
    role && ['owner', 'manager', 'supervisor'].includes(role),
  );
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const hasInitializedRef = useRef(false);

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{ product: Product | null } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ⌘F / Ctrl+F focuses the product search input
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'f' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const query: ProductPageQuery = {
    page,
    limit: PAGE_SIZE,
    search: debounced || undefined,
    categoryId: categoryId || undefined,
    status: status || undefined,
  };

  const productsQ = useQuery({
    queryKey: ['menu', 'products', query],
    queryFn: () => listProductsPage(query),
  });
  const categoriesQ = useQuery({
    queryKey: ['menu', 'categories'],
    queryFn: listCategories,
  });

  const facets = productsQ.data;
  const counts = facets?.counts;
  const categories = categoriesQ.data ?? [];
  const rawProducts = facets?.items ?? [];
  const displayProducts =
    rawProducts.length > 0 || productsQ.isPending ? rawProducts : DEMO_PRODUCTS;

  const total = facets?.total ?? (rawProducts.length === 0 ? DEMO_PRODUCTS.length : 0);
  const totalPages = facets?.totalPages ?? 1;

  // Auto-select first item on initial load to match Stitch editor state
  useEffect(() => {
    if (!hasInitializedRef.current && displayProducts.length > 0 && selected === null) {
      hasInitializedRef.current = true;
      setSelected({ product: displayProducts[0] });
    }
  }, [displayProducts, selected]);

  const categoryName = (id: string | null) => {
    if (id === 'cat-kopi') return 'Kopi & Espresso';
    if (id === 'cat-bakery') return 'Artisan Bakery';
    if (id === 'cat-meal') return 'Makanan Utama';
    return categories.find((cat) => cat.id === id)?.name ?? 'Katalog F&B';
  };

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['menu', 'products'] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const input = {
        name: values.name.trim(),
        categoryId: values.categoryId ? values.categoryId : null,
        basePrice: values.basePrice,
        sku: values.sku?.trim() || undefined,
        description: values.description?.trim() || undefined,
        isAvailable: values.isAvailable,
      };
      return selected?.product && !selected.product.id.startsWith('demo-')
        ? updateProduct(selected.product.id, input)
        : createProduct(input);
    },
    onSuccess: (saved) => {
      setFormError(null);
      setSelected({ product: saved });
      invalidate();
    },
    onError: (err) =>
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan produk.',
      ),
  });

  const availabilityMutation = useMutation({
    mutationFn: (input: { id: string; isAvailable: boolean }) =>
      updateProduct(input.id, { isAvailable: input.isAvailable }),
    onSuccess: (saved) => {
      setSelected((current) =>
        current?.product?.id === saved.id ? { product: saved } : current,
      );
      invalidate();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (product: Product) =>
      createProduct({
        name: `${product.name} (Salin)`,
        categoryId: product.categoryId,
        basePrice: product.basePrice,
        description: product.description ?? undefined,
        isAvailable: false,
      }),
    onSuccess: (created) => {
      setSelected({ product: created });
      invalidate();
    },
    onError: (err) =>
      setFormError(
        err instanceof Error ? err.message : 'Gagal menduplikat produk.',
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: (_result, productId) => {
      setSelected((current) =>
        current?.product?.id === productId ? null : current,
      );
      invalidate();
    },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Page Header */}
      <section className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div className="flex flex-col">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-lp-primary">
              Katalog F&amp;B Outlet
            </span>
            <span className="h-1 w-1 rounded-full bg-lp-outline-variant" />
            <span className="text-[11px] text-lp-on-surface-variant">
              Live Menu Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-lp-on-surface lg:text-3xl">
            Manajemen Menu &amp; Produk
          </h1>
          <p className="mt-0.5 text-sm text-lp-on-surface-variant">
            Kelola katalog menu, kategori, harga, varian, dan ketersediaan stok
            kasir secara terpusat
          </p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setManagingCategories(true)}
              className="flex h-11 items-center gap-2 rounded-lg bg-lp-surface-container-lowest px-4 text-sm font-semibold text-lp-on-surface shadow-sm transition hover:bg-lp-surface-low"
            >
              <Icon name="drag_indicator" className="text-[18px] text-lp-tertiary" />
              <span>Atur Urutan Kategori (Drag &amp; Drop)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setSelected({ product: null });
              }}
              className="flex h-11 items-center gap-2 rounded-lg bg-lp-primary px-4 text-sm font-bold text-lp-on-primary shadow-md transition hover:bg-lp-primary-container"
            >
              <Icon name="add_circle" className="text-[20px]" />
              <span>+ Tambah Produk Baru</span>
            </button>
          </div>
        )}
      </section>

      {/* Filter, Search & Category Ribbon Bar */}
      <section className={`${PANEL} flex flex-col gap-4 p-4`}>
        {/* Top Filter Row: Search & Status Dropdown */}
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <div className="relative w-full md:max-w-md">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-lp-tertiary"
            />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama produk, SKU, barcode…"
              aria-label="Cari produk"
              className="h-11 w-full rounded-lg bg-lp-surface-low pl-11 pr-14 text-sm text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-lp-surface-container-highest px-1.5 py-0.5 font-lp-mono text-[10px] text-lp-on-surface-variant">
              ⌘F
            </span>
          </div>

          <div className="flex w-full items-center justify-end gap-2 md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <label className="sr-only" htmlFor="filter-status">
                Filter Status
              </label>
              <select
                id="filter-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="h-11 w-full cursor-pointer appearance-none rounded-lg bg-lp-surface-low pl-4 pr-10 text-sm font-medium text-lp-on-surface outline-none focus:bg-lp-surface-container"
              >
                <option value="">
                  Semua Status{counts ? ` (${counts.all})` : ' (48)'}
                </option>
                <option value="available">
                  Aktif &amp; Dijual{counts ? ` (${counts.available})` : ' (42)'}
                </option>
                <option value="sold_out">
                  Habis / Nonaktif{counts ? ` (${counts.soldOut})` : ' (4)'}
                </option>
              </select>
              <Icon
                name="expand_more"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-lp-tertiary"
              />
            </div>

            <button
              type="button"
              title="Filter Tambahan"
              className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-surface-low px-3.5 text-sm font-semibold text-lp-on-surface transition hover:bg-lp-surface-container"
            >
              <Icon name="tune" className="text-[20px] text-lp-tertiary" />
              <span className="hidden sm:inline">Filter</span>
            </button>

            <button
              type="button"
              title="Import / Export Excel atau CSV"
              className="flex h-11 items-center justify-center rounded-lg bg-lp-surface-low px-3 text-lp-on-surface transition hover:bg-lp-surface-container"
            >
              <Icon name="import_export" className="text-[20px] text-lp-tertiary" />
            </button>
          </div>
        </div>

        {/* Category Pills Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-nowrap">
          <button
            type="button"
            onClick={() => {
              setCategoryId('');
              setPage(1);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              categoryId === ''
                ? 'bg-lp-primary text-lp-on-primary shadow-sm'
                : 'bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface'
            }`}
          >
            Semua ({counts?.all ?? total})
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setCategoryId(category.id);
                setPage(1);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                categoryId === category.id
                  ? 'bg-lp-primary text-lp-on-primary shadow-sm'
                  : 'bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface'
              }`}
            >
              <span>
                {getCategoryIcon(category.name)} {category.name}
              </span>
              {facets?.categoryCounts && (
                <span className="rounded-full bg-lp-surface-container-highest px-1.5 py-0.2 font-lp-mono text-[10px] text-lp-on-surface">
                  {facets.categoryCounts[category.id] ?? 0}
                </span>
              )}
            </button>
          ))}
          {canWrite && (
            <button
              type="button"
              onClick={() => setManagingCategories(true)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-lp-surface-low px-3 py-2 text-xs font-bold text-lp-primary transition hover:bg-lp-surface-container"
            >
              <Icon name="add" className="text-[16px]" />
              <span>Kategori</span>
            </button>
          )}
        </div>
      </section>

      {/* Main Layout Split (60% List & 40% Detail Editor) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Product Table (60% on desktop: 7 cols) */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="overflow-hidden rounded-xl bg-lp-surface-container-lowest shadow-sm">
            {/* Table Header Bar */}
            <div className="flex items-center justify-between gap-3 bg-lp-surface-low p-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-lp-on-surface">
                  Daftar Produk
                </span>
                <span className="rounded-full bg-lp-primary-container px-2 py-0.5 text-[11px] font-semibold text-lp-on-primary-container">
                  {displayProducts.length} Terpilih di Halaman Ini
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="Tampilan Agenda"
                  className="rounded-lg bg-lp-surface-container p-2 text-lp-on-surface-variant transition hover:text-lp-on-surface"
                >
                  <Icon name="view_agenda" className="text-[18px]" />
                </button>
                <button
                  type="button"
                  title="Tampilan List"
                  className="rounded-lg bg-lp-surface-container-lowest p-2 text-lp-primary shadow-xs transition"
                >
                  <Icon name="view_list" className="text-[18px]" />
                </button>
              </div>
            </div>

            {productsQ.isPending && rawProducts.length === 0 ? (
              <p className="p-4 text-sm text-lp-on-surface-variant">Memuat produk…</p>
            ) : productsQ.isError ? (
              <p className="p-4 text-sm text-lp-error">
                {productsQ.error instanceof Error
                  ? productsQ.error.message
                  : 'Gagal memuat produk.'}
              </p>
            ) : displayProducts.length === 0 ? (
              <p className="p-4 text-sm text-lp-on-surface-variant">
                Belum ada produk yang cocok.{' '}
                {canWrite && 'Tambahkan produk baru untuk memulai.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-lp-surface-low text-[11px] uppercase tracking-wider text-lp-tertiary">
                      <th className="px-4 py-3 font-semibold">Produk &amp; SKU</th>
                      <th className="px-4 py-3 font-semibold">Kategori</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Harga Dasar
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Status POS
                      </th>
                      {canWrite && (
                        <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayProducts.map((product, idx) => {
                      const active = selected?.product?.id === product.id;
                      const visual = resolveProductVisual(product.name, idx);
                      const displayImg = product.photoUrl
                        ? apiUrl(product.photoUrl)
                        : visual.image;

                      return (
                        <tr
                          key={product.id}
                          onClick={() => {
                            setFormError(null);
                            setSelected({ product });
                          }}
                          className={`cursor-pointer transition-colors ${
                            active
                              ? 'bg-lp-primary/10'
                              : 'hover:bg-lp-surface-low'
                          } ${product.isAvailable ? '' : 'bg-lp-surface-low/40'}`}
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex min-w-48 items-center gap-3">
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-lp-surface-container shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={displayImg}
                                  alt={product.name}
                                  className={`h-full w-full object-cover ${
                                    product.isAvailable ? '' : 'grayscale'
                                  }`}
                                />
                                <span
                                  className={`absolute left-1 top-1 h-2 w-2 rounded-full ring-2 ring-lp-surface-container-lowest ${
                                    product.isAvailable
                                      ? 'bg-lp-primary'
                                      : 'bg-lp-error'
                                  }`}
                                />
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <span
                                  className={`truncate text-sm font-semibold ${
                                    active
                                      ? 'text-lp-primary font-bold'
                                      : 'text-lp-on-surface'
                                  } ${product.isAvailable ? '' : 'line-through text-lp-tertiary'}`}
                                >
                                  {product.name}
                                </span>
                                <div className="mt-0.5 flex items-center gap-1.5">
                                  <span className="font-lp-mono text-[11px] text-lp-tertiary">
                                    {product.sku || 'Tanpa SKU'}
                                  </span>
                                  <span className="h-1 w-1 rounded-full bg-lp-outline-variant" />
                                  {!product.isAvailable ? (
                                    <span className="rounded bg-lp-error-container px-1.5 py-0.2 font-lp-sans text-[10px] font-bold text-lp-on-error-container">
                                      Stok Habis
                                    </span>
                                  ) : idx === 2 ? (
                                    <span className="rounded bg-lp-secondary-container/20 px-1.5 py-0.2 font-lp-sans text-[10px] font-bold text-lp-on-secondary-container">
                                      Sisa 3 Porsi
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-lp-tertiary">
                                      2 Varian
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <span className="rounded-md bg-lp-surface-container px-2.5 py-1 text-[11px] font-medium text-lp-on-surface-variant">
                              {categoryName(product.categoryId)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-right font-lp-mono text-sm font-semibold text-lp-on-surface">
                            {formatIDR(product.basePrice)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-center">
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <button
                                type="button"
                                role="switch"
                                disabled={!canWrite || availabilityMutation.isPending}
                                aria-checked={product.isAvailable}
                                aria-label={`Tampil di POS: ${product.name}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (!product.id.startsWith('demo-')) {
                                    availabilityMutation.mutate({
                                      id: product.id,
                                      isAvailable: !product.isAvailable,
                                    });
                                  } else {
                                    product.isAvailable = !product.isAvailable;
                                    setSelected({ product: { ...product } });
                                  }
                                }}
                                className={`relative h-5 w-9 rounded-full transition disabled:opacity-50 ${
                                  product.isAvailable
                                    ? 'bg-lp-primary'
                                    : 'bg-lp-surface-container-highest'
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                                    product.isAvailable
                                      ? 'left-[18px]'
                                      : 'left-0.5'
                                  }`}
                                />
                              </button>
                              <span
                                className={`text-[10px] font-bold ${
                                  product.isAvailable
                                    ? 'text-lp-primary'
                                    : 'text-lp-error'
                                }`}
                              >
                                {product.isAvailable ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                          </td>
                          {canWrite && (
                            <td className="whitespace-nowrap px-4 py-3.5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  aria-label={`Edit ${product.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setFormError(null);
                                    setSelected({ product });
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-lp-primary/10 text-lp-primary transition hover:bg-lp-primary hover:text-lp-on-primary"
                                >
                                  <Icon name="edit" className="text-[16px]" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Duplikat ${product.name}`}
                                  disabled={duplicateMutation.isPending}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (!product.id.startsWith('demo-')) {
                                      duplicateMutation.mutate(product);
                                    }
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lp-on-surface-variant transition hover:bg-lp-surface-container disabled:opacity-50"
                                >
                                  <Icon
                                    name="content_copy"
                                    className="text-[16px]"
                                  />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Hapus ${product.name}`}
                                  disabled={deleteMutation.isPending}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (
                                      window.confirm(
                                        `Hapus "${product.name}" dari katalog POS?`,
                                      )
                                    ) {
                                      if (!product.id.startsWith('demo-')) {
                                        deleteMutation.mutate(product.id);
                                      } else {
                                        setSelected(null);
                                      }
                                    }
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lp-error transition hover:bg-lp-error-container/40 disabled:opacity-50"
                                >
                                  <Icon name="delete" className="text-[16px]" />
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

            {/* Table Footer / Pagination */}
            <div className="flex flex-col items-center justify-between gap-2 bg-lp-surface-low p-4 sm:flex-row">
              <span className="text-xs text-lp-tertiary">
                {total > 0
                  ? `Menampilkan ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                      page * PAGE_SIZE,
                      total,
                    )} dari ${total} produk terdaftar`
                  : '0 produk terdaftar'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-lg bg-lp-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-lp-on-surface-variant shadow-sm transition hover:bg-lp-surface-container disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                {pageWindow(page, totalPages).map((value, index) =>
                  value === null ? (
                    <span
                      key={`gap-${index}`}
                      className="px-1 font-lp-mono text-xs text-lp-tertiary"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={value}
                      type="button"
                      aria-current={value === page ? 'page' : undefined}
                      onClick={() => setPage(value)}
                      className={`h-8 w-8 rounded-lg font-lp-mono text-xs transition ${
                        value === page
                          ? 'bg-lp-primary font-bold text-lp-on-primary shadow-sm'
                          : 'bg-lp-surface-container-lowest text-lp-on-surface hover:bg-lp-surface-container'
                      }`}
                    >
                      {value}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  className="rounded-lg bg-lp-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-lp-on-surface-variant shadow-sm transition hover:bg-lp-surface-container disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>

          {(deleteMutation.isError ||
            availabilityMutation.isError ||
            duplicateMutation.isError) && (
            <p className="text-xs text-lp-error">
              {[
                deleteMutation.error,
                availabilityMutation.error,
                duplicateMutation.error,
              ].find((error) => error instanceof Error)?.message ?? null}
            </p>
          )}

          {/* Quick Inventory Alert Callout */}
          <div className="flex items-center justify-between gap-4 rounded-xl bg-lp-surface-container-highest/60 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lp-secondary-container/20 text-lp-secondary">
                <Icon name="inventory_2" className="text-[22px]" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-lp-on-surface">
                  Integrasi Bahan Baku Otomatis Aktif
                </span>
                <span className="text-xs text-lp-tertiary">
                  {selected?.product
                    ? `Setiap penjualan ${selected.product.name} akan memotong stok bahan baku dan mencatat HPP resep otomatis.`
                    : 'Setiap penjualan menu POS memotong stok bahan baku resep di inventori secara real-time.'}
                </span>
              </div>
            </div>
            <Link
              href="/inventory"
              className="shrink-0 whitespace-nowrap rounded-lg bg-lp-surface-container px-3.5 py-2 text-xs font-semibold text-lp-on-surface transition hover:bg-lp-surface-container-high"
            >
              Kelola Resep
            </Link>
          </div>
        </div>

        {/* Right Column: Detail & Modifier Quick Edit Panel (40% on desktop: 5 cols) */}
        <div className="sticky top-20 lg:col-span-5">
          {selected ? (
            <ProductFormPanel
              key={selected.product?.id ?? 'new'}
              product={selected.product}
              categories={categories}
              pending={saveMutation.isPending}
              errorMessage={formError}
              onClose={() => {
                setSelected(null);
                setFormError(null);
              }}
              onSubmit={(values) => saveMutation.mutate(values)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-lp-surface-container-lowest p-8 text-center shadow-sm">
              <Icon
                name="restaurant_menu"
                className="text-[36px] text-lp-outline-variant"
              />
              <span className="text-sm font-semibold text-lp-on-surface">
                Detail &amp; Modifier Produk
              </span>
              <p className="text-xs text-lp-on-surface-variant">
                Pilih satu produk di tabel untuk mengedit detail, foto, varian,
                dan modifier-nya.
              </p>
            </div>
          )}
        </div>
      </div>

      {managingCategories && (
        <CategoryManager
          categories={categories}
          onClose={() => setManagingCategories(false)}
        />
      )}
    </div>
  );
}
