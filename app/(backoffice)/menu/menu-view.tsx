'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
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
import { ProductFormModal, type ProductFormValues } from './product-form';

const PAGE_SIZE = 20;
const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';

type StatusFilter = '' | 'available' | 'sold_out';

export function MenuView() {
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = Boolean(
    role && ['owner', 'manager', 'supervisor'].includes(role),
  );
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ product: Product | null } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

  const categories = categoriesQ.data ?? [];
  const products = productsQ.data?.items ?? [];
  const total = productsQ.data?.total ?? 0;
  const totalPages = productsQ.data?.totalPages ?? 1;
  const categoryName = (id: string | null) =>
    categories.find((category) => category.id === id)?.name ?? '—';

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['menu', 'products'] });

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
      return modal?.product
        ? updateProduct(modal.product.id, input)
        : createProduct(input);
    },
    onSuccess: () => {
      setModal(null);
      setFormError(null);
      void invalidate();
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan produk.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => void invalidate(),
  });

  return (
    <div className="flex w-full flex-col gap-5">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lp-primary-fixed/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-lp-on-primary-fixed-variant">
            Katalog F&amp;B
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-lp-on-surface">
            Manajemen Menu &amp; Produk
          </h1>
          <p className="text-sm text-lp-on-surface-variant">
            Kelola katalog menu, kategori, harga, dan ketersediaan kasir.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setModal({ product: null });
            }}
            className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-4 text-sm font-bold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container"
          >
            <Icon name="add_circle" className="text-[20px]" />
            Tambah Produk Baru
          </button>
        )}
      </section>

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
              placeholder="Cari nama produk atau SKU…"
              aria-label="Cari produk"
              className="h-10 w-full rounded-lg bg-lp-surface-container-low pl-10 pr-3 text-sm text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
            aria-label="Filter status"
            className="h-10 rounded-lg bg-lp-surface-container-low px-3 text-sm font-medium text-lp-on-surface outline-none focus:bg-lp-surface-container"
          >
            <option value="">Semua Status</option>
            <option value="available">Aktif &amp; Dijual</option>
            <option value="sold_out">Nonaktif / Habis</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setCategoryId('');
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              categoryId === ''
                ? 'bg-lp-primary text-lp-on-primary'
                : 'bg-lp-surface-container-low text-lp-on-surface-variant hover:bg-lp-surface-container'
            }`}
          >
            Semua
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setCategoryId(category.id);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                categoryId === category.id
                  ? 'bg-lp-primary text-lp-on-primary'
                  : 'bg-lp-surface-container-low text-lp-on-surface-variant hover:bg-lp-surface-container'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className={PANEL}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-lp-on-surface">
            Daftar Produk
          </h2>
          <span className="text-xs text-lp-tertiary">
            {total > 0
              ? `Menampilkan ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                  page * PAGE_SIZE,
                  total,
                )} dari ${total} produk`
              : '0 produk'}
          </span>
        </div>

        {productsQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat produk…</p>
        ) : productsQ.isError ? (
          <p className="text-sm text-lp-error">
            {productsQ.error instanceof Error
              ? productsQ.error.message
              : 'Gagal memuat produk.'}
          </p>
        ) : products.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">
            Belum ada produk yang cocok. {canWrite && 'Tambahkan produk baru untuk memulai.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Produk &amp; SKU</th>
                  <th className="pb-2">Kategori</th>
                  <th className="pb-2 text-right">Harga Dasar</th>
                  <th className="pb-2">Status POS</th>
                  {canWrite && <th className="pb-2 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-lp-surface-container"
                  >
                    <td className="py-2.5">
                      <span className="block font-semibold text-lp-on-surface">
                        {product.name}
                      </span>
                      {product.sku && (
                        <span className="font-lp-mono text-[11px] text-lp-tertiary">
                          {product.sku}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-lp-on-surface-variant">
                      {categoryName(product.categoryId)}
                    </td>
                    <td className="py-2.5 text-right font-lp-mono text-lp-on-surface">
                      {formatIDR(product.basePrice)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          product.isAvailable
                            ? 'bg-lp-primary-fixed/50 text-lp-on-primary-fixed'
                            : 'bg-lp-error-container text-lp-on-error-container'
                        }`}
                      >
                        {product.isAvailable ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${product.name}`}
                            onClick={() => {
                              setFormError(null);
                              setModal({ product });
                            }}
                            className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface"
                          >
                            <Icon name="edit" className="text-[18px]" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus ${product.name}`}
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Hapus "${product.name}" dari katalog POS?`,
                                )
                              ) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container disabled:opacity-50"
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
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="text-xs text-lp-tertiary">
              Halaman {page} dari {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        )}

        {deleteMutation.isError && (
          <p className="mt-2 text-xs text-lp-error">
            {deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : 'Gagal menghapus produk.'}
          </p>
        )}
      </section>

      {modal && (
        <ProductFormModal
          product={modal.product}
          categories={categories}
          pending={saveMutation.isPending}
          errorMessage={formError}
          onClose={() => setModal(null)}
          onSubmit={(values) => saveMutation.mutate(values)}
        />
      )}
    </div>
  );
}
