'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { createUnit } from '@/lib/api';
import {
  UNIT_FAMILIES,
  UNIT_FAMILY_LABELS,
  type RawMaterial,
  type Unit,
  type UnitFamily,
} from '@/lib/types';

const nonNegInt = (label: string) =>
  z
    .number({ error: `${label} harus berupa angka.` })
    .min(0, `${label} tidak boleh negatif.`);

export const materialSchema = z.object({
  name: z.string().trim().min(1, 'Nama bahan wajib diisi.'),
  sku: z.string().trim().max(100, 'SKU maksimal 100 karakter.').optional(),
  category: z
    .string()
    .trim()
    .max(50, 'Kategori maksimal 50 karakter.')
    .optional(),
  expiresAt: z.string().optional(),
  stockUnitId: z.string().min(1, 'Satuan stok wajib dipilih.'),
  purchaseUnitId: z.string().optional(),
  packSize: z
    .number({ error: 'Isi kemasan harus berupa angka.' })
    .min(0.000001, 'Isi kemasan harus lebih dari 0.'),
  stockQty: nonNegInt('Stok'),
  minStockQty: nonNegInt('Stok minimum'),
  costPerUnit: nonNegInt('Harga per satuan'),
});

export type MaterialFormValues = z.infer<typeof materialSchema>;

export const stockAdjustSchema = z.object({
  qty: z
    .number({ error: 'Jumlah harus berupa angka.' })
    .refine((value) => value !== 0, 'Jumlah tidak boleh nol.'),
  notes: z.string().trim().max(200).optional(),
});

export type StockAdjustValues = z.infer<typeof stockAdjustSchema>;

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

function Overlay({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-lp-surface-container-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-lp-on-surface">{title}</h2>
            {subtitle && <p className="text-xs text-lp-tertiary">{subtitle}</p>}
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
        {children}
      </div>
    </div>
  );
}

/** Inline "add unit" so owners aren't blocked by a missing unit. */
function AddUnitInline({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [family, setFamily] = useState<UnitFamily>('count');
  const [factor, setFactor] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const createM = useMutation({
    mutationFn: () =>
      createUnit({
        name: name.trim(),
        family,
        factorToBase: Number(factor || 1),
      }),
    onSuccess: () => {
      setName('');
      setFactor('1');
      setOpen(false);
      setError(null);
      onCreated();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menambah satuan.'),
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 text-[11px] font-semibold text-lp-primary hover:underline"
      >
        + Tambah satuan
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-lp-surface-low p-2">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama satuan (mis. Ikat)"
          aria-label="Nama satuan baru"
          className="h-9 flex-1 rounded-lg border border-lp-outline-variant px-2.5 text-sm outline-none focus:border-lp-primary"
        />
        <select
          value={family}
          onChange={(event) => setFamily(event.target.value as UnitFamily)}
          aria-label="Keluarga satuan"
          className="h-9 rounded-lg border border-lp-outline-variant px-2 text-sm outline-none focus:border-lp-primary"
        >
          {UNIT_FAMILIES.map((value) => (
            <option key={value} value={value}>
              {UNIT_FAMILY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[11px] text-lp-tertiary" htmlFor="unit-factor">
          Faktor ke satuan dasar
        </label>
        <input
          id="unit-factor"
          value={factor}
          onChange={(event) => setFactor(event.target.value)}
          type="number"
          min={0.000001}
          step={0.1}
          className="h-8 w-24 rounded-lg border border-lp-outline-variant px-2 text-right text-sm outline-none focus:border-lp-primary"
        />
        <button
          type="button"
          disabled={createM.isPending || !name.trim()}
          onClick={() => createM.mutate()}
          className="ml-auto h-8 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary disabled:opacity-60"
        >
          {createM.isPending ? '…' : 'Simpan'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-8 rounded-lg px-2 text-xs text-lp-on-surface-variant"
        >
          Batal
        </button>
      </div>
      {error && <p className="text-[11px] text-lp-error">{error}</p>}
    </div>
  );
}

function UnitSelect({
  id,
  placeholder,
  units,
  registerProps,
  invalid,
}: {
  id: string;
  placeholder: string;
  units: Unit[];
  registerProps: ReturnType<ReturnType<typeof useForm>['register']>;
  invalid?: boolean;
}) {
  return (
    <select
      id={id}
      {...registerProps}
      aria-invalid={invalid}
      className={inputCls}
    >
      <option value="">{placeholder}</option>
      {UNIT_FAMILIES.map((family) => {
        const group = units.filter((unit) => unit.family === family);
        if (group.length === 0) return null;
        return (
          <optgroup key={family} label={UNIT_FAMILY_LABELS[family]}>
            {group.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.code})
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}

export function MaterialFormModal({
  material,
  units,
  pending,
  errorMessage,
  onClose,
  onSubmit,
  onUnitsChanged,
}: {
  material: RawMaterial | null;
  units: Unit[];
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: MaterialFormValues) => void;
  onUnitsChanged: () => void;
}) {
  const editing = material !== null;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: material?.name ?? '',
      sku: material?.sku ?? '',
      category: material?.category ?? '',
      expiresAt: material?.expiresAt ? material.expiresAt.slice(0, 10) : '',
      stockUnitId: material?.stockUnitId ?? '',
      purchaseUnitId: material?.purchaseUnitId ?? '',
      packSize: material?.packSize ?? 1,
      stockQty: material?.stockQty ?? 0,
      minStockQty: material?.minStockQty ?? 0,
      costPerUnit: material?.costPerUnit ?? 0,
    },
  });

  const stockUnitId = useWatch({ control, name: 'stockUnitId' });
  const purchaseUnitId = useWatch({ control, name: 'purchaseUnitId' });
  const packSize = useWatch({ control, name: 'packSize' });
  const stockUnit = units.find((unit) => unit.id === stockUnitId);
  const purchaseUnit = units.find((unit) => unit.id === purchaseUnitId);

  return (
    <Overlay
      title={editing ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
      subtitle={
        editing
          ? material?.name
          : 'Satuan dipakai untuk resep & konversi pembelian.'
      }
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit((values) => onSubmit(values))}
        noValidate
        className="space-y-1"
      >
        <div>
          <label htmlFor="m-name" className={labelCls}>
            Nama Bahan
          </label>
          <input
            id="m-name"
            {...register('name')}
            autoFocus
            aria-invalid={!!errors.name}
            className={inputCls}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="m-sku" className={labelCls}>
              SKU / Kode
            </label>
            <input
              id="m-sku"
              {...register('sku')}
              placeholder="BB-DRY-01"
              aria-invalid={!!errors.sku}
              className={inputCls}
            />
            <FieldError message={errors.sku?.message} />
          </div>
          <div>
            <label htmlFor="m-category" className={labelCls}>
              Kategori
            </label>
            <input
              id="m-category"
              {...register('category')}
              placeholder="Dairy & Susu"
              aria-invalid={!!errors.category}
              className={inputCls}
            />
            <FieldError message={errors.category?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="m-unit" className={labelCls}>
            Satuan Stok (dipakai resep)
          </label>
          <UnitSelect
            id="m-unit"
            placeholder="Pilih satuan stok…"
            units={units}
            registerProps={register('stockUnitId')}
            invalid={!!errors.stockUnitId}
          />
          <FieldError message={errors.stockUnitId?.message} />
          <AddUnitInline onCreated={onUnitsChanged} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="m-purchase-unit" className={labelCls}>
              Satuan Beli (opsional)
            </label>
            <UnitSelect
              id="m-purchase-unit"
              placeholder="Tanpa kemasan"
              units={units}
              registerProps={register('purchaseUnitId')}
            />
            <FieldError />
          </div>
          <div>
            <label htmlFor="m-pack" className={labelCls}>
              Isi per satuan beli
            </label>
            <input
              id="m-pack"
              {...register('packSize', { valueAsNumber: true })}
              type="number"
              min={0.000001}
              step={0.01}
              aria-invalid={!!errors.packSize}
              className={inputCls}
            />
            <FieldError message={errors.packSize?.message} />
          </div>
        </div>

        {purchaseUnit && stockUnit && (
          <p className="rounded-lg bg-lp-surface-low px-3 py-2 text-[11px] text-lp-on-surface-variant">
            Konversi: 1 {purchaseUnit.name} = {packSize || 0}{' '}
            {stockUnit.name}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="m-cost" className={labelCls}>
              Harga / satuan stok
            </label>
            <input
              id="m-cost"
              {...register('costPerUnit', { valueAsNumber: true })}
              type="number"
              min={0}
              step={100}
              aria-invalid={!!errors.costPerUnit}
              className={inputCls}
            />
            <FieldError message={errors.costPerUnit?.message} />
          </div>
          <div>
            <label htmlFor="m-min" className={labelCls}>
              Stok minimum
            </label>
            <input
              id="m-min"
              {...register('minStockQty', { valueAsNumber: true })}
              type="number"
              min={0}
              step={0.01}
              aria-invalid={!!errors.minStockQty}
              className={inputCls}
            />
            <FieldError message={errors.minStockQty?.message} />
          </div>
        </div>

        {!editing && (
          <div>
            <label htmlFor="m-stock" className={labelCls}>
              Stok awal
            </label>
            <input
              id="m-stock"
              {...register('stockQty', { valueAsNumber: true })}
              type="number"
              min={0}
              step={0.01}
              aria-invalid={!!errors.stockQty}
              className={inputCls}
            />
            <FieldError message={errors.stockQty?.message} />
          </div>
        )}

        <div>
          <label htmlFor="m-expiry" className={labelCls}>
            Tanggal Kedaluwarsa (opsional)
          </label>
          <input
            id="m-expiry"
            {...register('expiresAt')}
            type="date"
            className={inputCls}
          />
          <FieldError />
        </div>

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
                : 'Tambah Bahan'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

export function StockAdjustModal({
  material,
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  material: RawMaterial;
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: StockAdjustValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StockAdjustValues>({
    resolver: zodResolver(stockAdjustSchema),
    defaultValues: { qty: 0, notes: '' },
  });

  return (
    <Overlay
      title="Sesuaikan Stok"
      subtitle={`${material.name} · stok kini ${material.stockQty} ${material.stockUnitCode ?? material.unit}`}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit((values) => onSubmit(values))}
        noValidate
        className="space-y-1"
      >
        <div>
          <label htmlFor="s-qty" className={labelCls}>
            Perubahan (positif masuk, negatif keluar)
          </label>
          <input
            id="s-qty"
            {...register('qty', { valueAsNumber: true })}
            type="number"
            step={0.01}
            autoFocus
            aria-invalid={!!errors.qty}
            className={inputCls}
          />
          <FieldError message={errors.qty?.message} />
        </div>
        <div>
          <label htmlFor="s-notes" className={labelCls}>
            Catatan (opsional)
          </label>
          <input
            id="s-notes"
            {...register('notes')}
            placeholder="Barang masuk / rusak / opname"
            className={inputCls}
          />
          <FieldError />
        </div>

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
            <Icon name="swap_vert" className="text-[18px]" />
            {pending ? 'Menyimpan…' : 'Terapkan'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
