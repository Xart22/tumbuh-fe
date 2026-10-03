'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { DropdownSearch } from '@/components/ui/dropdown-search';
import type { Category, Product } from '@/lib/types';
import { ModifierEditor } from './modifier-editor';
import { OutletOverrideEditor } from './outlet-override-editor';
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
  availabilityStart: z.string().optional(),
  availabilityEnd: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

const labelCls =
  'mb-1 block text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant';
const inputCls =
  'w-full rounded-lg bg-lp-surface-low px-3 py-2.5 text-sm font-medium text-lp-on-surface outline-none transition placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-lp-error';

function FieldError({ message }: { message?: string }) {
  return (
    <div className="min-h-4">
      {message && (
        <p role="alert" className="mt-1 text-xs font-medium text-lp-error">
          {message}
        </p>
      )}
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-lp-on-surface">
      <Icon name={icon} className="text-[18px] text-lp-primary" />
      {title}
    </span>
  );
}

function NeedsSaved({ label }: { label: string }) {
  return (
    <p className="rounded-lg bg-lp-surface-low px-3 py-2 text-xs text-lp-on-surface-variant">
      Simpan produk dulu untuk mengatur {label}.
    </p>
  );
}

/**
 * Inline product editor for the menu page's detail column (Stitch layout).
 * Photo/Variants/Modifiers are keyed by the product id, so they unlock after
 * the first save.
 */
export function ProductFormPanel({
  product,
  categories,
  pending,
  errorMessage,
  onClose,
  onSubmit,
  onOpenStudio,
  canManageOutletOverrides = false,
}: {
  product: Product | null;
  categories: Category[];
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => void;
  onOpenStudio?: () => void;
  /** Per-outlet price overrides are owner/manager only. */
  canManageOutletOverrides?: boolean;
}) {
  const editing = product !== null;

  const {
    register,
    handleSubmit,
    control,
    setValue,
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
      availabilityStart: product?.availabilityStart ?? '',
      availabilityEnd: product?.availabilityEnd ?? '',
    },
  });

  const isAvailable = useWatch({ control, name: 'isAvailable' });
  const categoryId = useWatch({ control, name: 'categoryId' }) ?? '';
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));
  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-4 rounded-xl bg-lp-surface-container-lowest p-5 shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-base font-bold text-lp-on-surface">
            <Icon name="edit_note" className="text-[18px] text-lp-primary" />
            Detail &amp; Modifier Produk
          </span>
          <span className="text-xs text-lp-tertiary">
            {editing ? (
              <>
                Mengedit:{' '}
                <strong className="text-lp-on-surface">
                  {product.name}
                  {product.sku ? ` (${product.sku})` : ''}
                </strong>
              </>
            ) : (
              'Produk baru — belum tersimpan di katalog.'
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel"
          className="rounded-lg bg-lp-surface-low p-1.5 text-lp-on-surface-variant transition hover:bg-lp-surface-container hover:text-lp-on-surface"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>

      {onOpenStudio && (
        <button
          type="button"
          onClick={onOpenStudio}
          className="flex items-center justify-center gap-2 rounded-xl bg-lp-primary/10 py-2.5 text-xs font-bold text-lp-primary transition hover:bg-lp-primary hover:text-lp-on-primary"
        >
          <Icon name="open_in_full" className="text-[16px]" />
          <span>Buka Studio Resep BOM &amp; Margin</span>
        </button>
      )}

      {editing ? (
        <PhotoEditor
          productId={product.id}
          photoUrl={product.photoUrl}
        />
      ) : (
        <NeedsSaved label="foto menu POS" />
      )}

      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="p-name" className={labelCls}>
            Nama Produk
          </label>
          <input
            id="p-name"
            {...register('name')}
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
            <DropdownSearch
              id="p-category"
              value={categoryId}
              onChange={(val) =>
                setValue('categoryId', val, { shouldValidate: true })
              }
              placeholder="Tanpa kategori"
              searchPlaceholder="Cari kategori menu…"
              options={categoryOptions}
            />
            <FieldError />
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
              className={`${inputCls} font-lp-mono`}
            />
            <FieldError message={errors.sku?.message} />
          </div>
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
            className={`${inputCls} font-lp-mono`}
          />
          <FieldError message={errors.basePrice?.message} />
        </div>

        <div>
          <label htmlFor="p-desc" className={labelCls}>
            Deskripsi Singkat (Tampil di Nota &amp; Tablet)
          </label>
          <textarea
            id="p-desc"
            {...register('description')}
            rows={2}
            placeholder="Tampil di nota & tablet kasir"
            className={`${inputCls} resize-none`}
          />
          <FieldError />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-lp-surface-container pt-3">
        <SectionHeading icon="schedule" title="Waktu Ketersediaan (opsional)" />
        <p className="text-xs text-lp-tertiary">
          Kosongkan untuk selalu tersedia. Jam mengikuti waktu UTC outlet.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-avail-start" className={labelCls}>
              Mulai
            </label>
            <input
              id="p-avail-start"
              {...register('availabilityStart')}
              type="time"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="p-avail-end" className={labelCls}>
              Selesai
            </label>
            <input
              id="p-avail-end"
              {...register('availabilityEnd')}
              type="time"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-lp-surface-container pt-3">
        <SectionHeading icon="straighten" title="Varian Ukuran" />
        {editing ? (
          <VariantEditor productId={product.id} />
        ) : (
          <NeedsSaved label="varian ukuran" />
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-lp-surface-container pt-3">
        <SectionHeading icon="tune" title="Modifier Group (Pilihan Tambahan)" />
        {editing ? (
          <ModifierEditor productId={product.id} />
        ) : (
          <NeedsSaved label="modifier" />
        )}
      </div>

      {canManageOutletOverrides && (
        <div className="flex flex-col gap-2 border-t border-lp-surface-container pt-3">
          <SectionHeading icon="storefront" title="Harga & Ketersediaan per Outlet" />
          {editing ? (
            <OutletOverrideEditor
              productId={product.id}
              basePrice={product.basePrice}
            />
          ) : (
            <NeedsSaved label="override per outlet" />
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-lp-surface-container pt-3">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-lp-primary/10 p-3">
          <div className="flex items-center gap-2.5">
            <Icon name="point_of_sale" className="text-[22px] text-lp-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-lp-on-surface">
                Tampil di Menu POS Kasir
              </span>
              <span className="text-xs text-lp-tertiary">
                Produk dapat langsung dipesan oleh kasir
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isAvailable}
            aria-label="Tampil di menu POS kasir"
            onClick={() => setValue('isAvailable', !isAvailable)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              isAvailable ? 'bg-lp-primary' : 'bg-lp-surface-container-highest'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                isAvailable ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg bg-lp-error-container px-3 py-2 text-xs font-medium text-lp-on-error-container"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg bg-lp-surface-low text-sm font-semibold text-lp-on-surface transition hover:bg-lp-surface-container"
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex h-11 flex-[2] items-center justify-center gap-1.5 rounded-lg bg-lp-primary text-sm font-bold text-lp-on-primary shadow-md transition hover:bg-lp-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="check_circle" className="text-[18px]" />
            {pending
              ? 'Menyimpan…'
              : editing
                ? 'Simpan Perubahan'
                : 'Tambah Produk'}
          </button>
        </div>
      </div>
    </form>
  );
}
