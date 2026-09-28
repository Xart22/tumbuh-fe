'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { Overlay } from '@/components/overlay';
import {
  createProductBundle,
  deleteProductBundle,
  listProductBundles,
  listProductsPage,
} from '@/lib/api';
import { formatIDR } from '@/lib/format';

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
  const bundlesQ = useQuery({
    queryKey: ['product-bundles'],
    queryFn: listProductBundles,
  });
  const productsQ = useQuery({
    queryKey: ['menu', 'products', 'bundles-picker'],
    queryFn: () => listProductsPage({ page: 1, limit: 100 }),
  });
  const products = productsQ.data?.items ?? [];
  const bundles = bundlesQ.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setShowForm(false);
      setName('');
      setPrice('');
      setItems([]);
      setError(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan bundling.'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteProductBundle(id),
    onSuccess: () => void invalidate(),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menghapus bundling.'),
  });

  function submit() {
    const parsed = bundleSchema.safeParse({ name, price, items });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Data belum lengkap.');
      return;
    }
    createM.mutate();
  }

  return (
    <Overlay
      title="Bundling / Paket Menu"
      subtitle="Beberapa produk dijual dengan satu harga paket."
      onClose={onClose}
    >
      <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
        {error && (
          <p role="alert" className="text-xs font-medium text-lp-error">
            {error}
          </p>
        )}

        {bundlesQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
        ) : bundles.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">
            Belum ada bundling.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bundles.map((bundle) => (
              <li
                key={bundle.id}
                className="flex items-start justify-between gap-2 rounded-lg bg-lp-surface-low px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-lp-on-surface">
                    {bundle.name}
                  </span>
                  <span className="font-lp-mono text-xs text-lp-tertiary">
                    {formatIDR(bundle.price)} ·{' '}
                    {bundle.items
                      .map(
                        (item) =>
                          `${item.qty}× ${item.productName ?? 'produk'}`,
                      )
                      .join(', ')}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Hapus bundling"
                  disabled={deleteM.isPending}
                  onClick={() => {
                    if (window.confirm(`Hapus bundling ${bundle.name}?`)) {
                      deleteM.mutate(bundle.id);
                    }
                  }}
                  className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container disabled:opacity-50"
                >
                  <Icon name="delete" className="text-[18px]" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-lp-primary px-4 text-xs font-bold text-lp-on-primary"
          >
            <Icon name="add" className="text-[16px]" />
            Tambah Bundling
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-lp-outline-variant p-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama paket (mis. Paket Hemat)"
              aria-label="Nama bundling"
              className="h-10 rounded-lg border border-lp-outline-variant px-3 text-sm outline-none focus:border-lp-primary"
            />
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              type="number"
              min={0}
              step={1000}
              placeholder="Harga paket"
              aria-label="Harga bundling"
              className="h-10 rounded-lg border border-lp-outline-variant px-3 text-sm outline-none focus:border-lp-primary"
            />

            <div className="flex flex-col gap-1">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={item.productId}
                    onChange={(event) =>
                      setItems((state) =>
                        state.map((row, i) =>
                          i === index
                            ? { ...row, productId: event.target.value }
                            : row,
                        ),
                      )
                    }
                    aria-label={`Produk ${index + 1}`}
                    className="h-9 flex-1 rounded-lg border border-lp-outline-variant px-2 text-sm"
                  >
                    <option value="">Pilih produk…</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={item.qty}
                    onChange={(event) =>
                      setItems((state) =>
                        state.map((row, i) =>
                          i === index
                            ? { ...row, qty: Number(event.target.value) }
                            : row,
                        ),
                      )
                    }
                    aria-label={`Qty ${index + 1}`}
                    className="h-9 w-16 rounded-lg border border-lp-outline-variant px-2 text-right text-sm"
                  />
                  <button
                    type="button"
                    aria-label={`Hapus produk ${index + 1}`}
                    onClick={() =>
                      setItems((state) => state.filter((_, i) => i !== index))
                    }
                    className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-error-container"
                  >
                    <Icon name="close" className="text-[16px]" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={products.length === 0}
              onClick={() =>
                setItems((state) => [
                  ...state,
                  { productId: products[0]?.id ?? '', qty: 1 },
                ])
              }
              className="w-fit text-[11px] font-semibold text-lp-primary hover:underline disabled:opacity-50"
            >
              + Tambah produk
            </button>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={createM.isPending}
                onClick={submit}
                className="rounded-lg bg-lp-primary px-4 py-2 text-sm font-bold text-lp-on-primary disabled:opacity-60"
              >
                {createM.isPending ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  );
}
