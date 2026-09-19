'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import type { Category, Product } from '@/lib/types';
import { ModifierEditor } from './modifier-editor';
import { PhotoEditor } from './photo-editor';
import { VariantEditor } from './variant-editor';

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi.'),
  categoryId: z.string().optional(),
  basePrice: z
    .number({ error: 'Harga wajib diisi.' })
    .min(0, 'Harga tidak boleh negatif.'),
  sku: z.string().trim().max(100, 'SKU maksimal 100 karakter.').optional(),
  description: z.string().trim().optional(),
  isAvailable: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

type Tab = 'detail' | 'photo' | 'variants' | 'modifiers';

const labelCls =
  'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600';
const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 aria-[invalid=true]:border-rose-400';

function FieldError({ message }: { message?: string }) {
  return (
    <div className="min-h-4">
      {message && (
        <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Create/edit product. Detail fields are always available; Photo/Variants/
 * Modifiers need a saved product (they are keyed by its id), so those tabs
 * unlock after the first save.
 */
export function ProductFormModal({
  product,
  categories,
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  product: Product | null;
  categories: Category[];
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => void;
}) {
  const editing = product !== null;
  const [tab, setTab] = useState<Tab>('detail');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      categoryId: product?.categoryId ?? '',
      basePrice: product?.basePrice ?? 0,
      sku: product?.sku ?? '',
      description: product?.description ?? '',
      isAvailable: product?.isAvailable ?? true,
    },
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = handleSubmit((values) => onSubmit(values));

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'detail', label: 'Detail', icon: 'edit_note' },
    { id: 'photo', label: 'Foto', icon: 'photo_camera' },
    { id: 'variants', label: 'Varian', icon: 'straighten' },
    { id: 'modifiers', label: 'Modifier', icon: 'tune' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-lp-surface-container-lowest shadow-xl">
        <div className="flex items-start justify-between gap-3 p-6 pb-3">
          <div>
            <h2 className="text-lg font-bold text-lp-on-surface">
              {editing ? 'Detail & Modifier Produk' : 'Tambah Produk Baru'}
            </h2>
            <p className="text-xs text-lp-tertiary">
              {editing
                ? `Mengedit: ${product?.name}${product?.sku ? ` (${product.sku})` : ''}`
                : 'Produk langsung masuk katalog outlet ini.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-surface-container"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-lp-surface-container px-6">
          {tabs.map((item) => {
            const disabled = !editing && item.id !== 'detail';
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => setTab(item.id)}
                title={disabled ? 'Simpan produk dulu' : undefined}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition ${
                  tab === item.id
                    ? 'border-lp-primary text-lp-primary'
                    : 'border-transparent text-lp-on-surface-variant hover:text-lp-on-surface'
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <Icon name={item.icon} className="text-[18px]" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {tab === 'detail' && (
            <form onSubmit={submit} noValidate className="space-y-1">
              <div>
                <label htmlFor="p-name" className={labelCls}>
                  Nama Produk
                </label>
                <input
                  id="p-name"
                  {...register('name')}
                  autoFocus
                  aria-invalid={!!errors.name}
                  className={inputCls}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="p-category" className={labelCls}>
                    Kategori
                  </label>
                  <select
                    id="p-category"
                    {...register('categoryId')}
                    className={inputCls}
                  >
                    <option value="">Tanpa kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <FieldError />
                </div>

                <div>
                  <label htmlFor="p-price" className={labelCls}>
                    Harga Dasar (Rp)
                  </label>
                  <input
                    id="p-price"
                    {...register('basePrice', { valueAsNumber: true })}
                    type="number"
                    min={0}
                    step={100}
                    inputMode="numeric"
                    aria-invalid={!!errors.basePrice}
                    className={inputCls}
                  />
                  <FieldError message={errors.basePrice?.message} />
                </div>
              </div>

              <div>
                <label htmlFor="p-sku" className={labelCls}>
                  SKU / Kode POS
                </label>
                <input
                  id="p-sku"
                  {...register('sku')}
                  placeholder="KOP-001"
                  aria-invalid={!!errors.sku}
                  className={inputCls}
                />
                <FieldError message={errors.sku?.message} />
              </div>

              <div>
                <label htmlFor="p-desc" className={labelCls}>
                  Deskripsi Singkat
                </label>
                <textarea
                  id="p-desc"
                  {...register('description')}
                  rows={2}
                  placeholder="Tampil di nota & tablet kasir"
                  className={inputCls}
                />
                <FieldError />
              </div>

              <label className="flex items-center gap-2 pt-1 text-sm text-lp-on-surface">
                <input
                  type="checkbox"
                  {...register('isAvailable')}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Aktif &amp; dijual di POS
              </label>

              {errorMessage && (
                <div
                  role="alert"
                  className="mt-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                >
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon name="check" className="text-[18px]" />
                  {pending
                    ? 'Menyimpan…'
                    : editing
                      ? 'Simpan Perubahan'
                      : 'Tambah Produk'}
                </button>
              </div>
            </form>
          )}

          {editing && tab === 'photo' && (
            <PhotoEditor productId={product.id} photoUrl={product.photoUrl} />
          )}
          {editing && tab === 'variants' && (
            <VariantEditor productId={product.id} />
          )}
          {editing && tab === 'modifiers' && (
            <ModifierEditor productId={product.id} />
          )}
        </div>
      </div>
    </div>
  );
}
