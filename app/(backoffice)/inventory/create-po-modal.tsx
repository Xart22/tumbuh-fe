'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { DropdownSearch } from '@/components/ui/dropdown-search';
import { formatIDR, formatQty } from '@/lib/format';
import type { RawMaterial, Supplier } from '@/lib/types';

export const poItemSchema = z.object({
  rawMaterialId: z.string().min(1, 'Pilih bahan.'),
  qtyOrdered: z
    .number({ error: 'Qty harus berupa angka.' })
    .positive('Qty harus lebih dari 0.'),
  unitPrice: z
    .number({ error: 'Harga harus berupa angka.' })
    .min(0, 'Harga tidak boleh negatif.'),
});

export const poSchema = z.object({
  supplierId: z.string().min(1, 'Pilih supplier.'),
  expectedDate: z.string().optional(),
  items: z.array(poItemSchema).min(1, 'Tambahkan minimal 1 bahan.'),
});

export type PoValues = z.infer<typeof poSchema>;

const labelCls =
  'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600';
const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20';

type DraftItem = { rawMaterialId: string; qtyOrdered: string; unitPrice: string };

/** Create PO modal: supplier + dated lines of raw materials with unit price. */
export function CreatePoModal({
  suppliers,
  materials,
  initialItems,
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  suppliers: Supplier[];
  materials: RawMaterial[];
  /** Lines prefilled by the materials tab (+PO / Buat PO Massal). */
  initialItems?: DraftItem[] | null;
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: {
    supplierId: string;
    expectedDate?: string;
    items: Array<{ rawMaterialId: string; qtyOrdered: number; unitPrice: number }>;
  }) => void;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [expectedDate, setExpectedDate] = useState('');
  const [items, setItems] = useState<DraftItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [{ rawMaterialId: materials[0]?.id ?? '', qtyOrdered: '1', unitPrice: '' }],
  );
  const [error, setError] = useState<string | null>(null);

  const supplierOptions = suppliers.map((supplier) => ({
    value: supplier.id,
    label: supplier.name,
    subLabel: supplier.phone ? `Tel: ${supplier.phone}` : undefined,
  }));

  const materialOptions = materials.map((material) => ({
    value: material.id,
    label: material.name,
    badge: material.sku ?? undefined,
    subLabel: `${material.unit} • Stok: ${formatQty(material.stockQty)}`,
  }));

  const total = items.reduce((sum, item) => {
    const qty = Number(item.qtyOrdered || 0);
    const price = Number(item.unitPrice || 0);
    return sum + (Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0);
  }, 0);

  function submit() {
    const parsed = poSchema.safeParse({
      supplierId,
      expectedDate: expectedDate || undefined,
      items: items.map((item) => ({
        rawMaterialId: item.rawMaterialId,
        qtyOrdered: Number(item.qtyOrdered),
        unitPrice: Number(item.unitPrice),
      })),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Data PO tidak valid.');
      return;
    }
    setError(null);
    onSubmit({
      supplierId: parsed.data.supplierId,
      expectedDate: parsed.data.expectedDate,
      items: parsed.data.items,
    });
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((state) =>
      state.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-lp-surface-container-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-lp-on-surface">
              Catat Barang Masuk (PO)
            </h2>
            <p className="text-xs text-lp-tertiary">
              PO masuk draft; terima setelah barang datang untuk menambah stok.
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="po-supplier" className={labelCls}>
              Supplier
            </label>
            <DropdownSearch
              id="po-supplier"
              value={supplierId}
              onChange={(val) => setSupplierId(val)}
              placeholder="Pilih supplier…"
              searchPlaceholder="Cari supplier…"
              options={supplierOptions}
            />
          </div>
          <div>
            <label htmlFor="po-date" className={labelCls}>
              Estimasi Datang
            </label>
            <input
              id="po-date"
              type="date"
              value={expectedDate}
              onChange={(event) => setExpectedDate(event.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <span className={labelCls}>Baris Bahan</span>
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <DropdownSearch
                  size="sm"
                  value={item.rawMaterialId}
                  aria-label={`Bahan baris ${index + 1}`}
                  onChange={(val) =>
                    updateItem(index, { rawMaterialId: val })
                  }
                  placeholder="Pilih bahan…"
                  searchPlaceholder="Cari bahan baku / SKU…"
                  options={materialOptions}
                />
              </div>
              <input
                value={item.qtyOrdered}
                onChange={(event) =>
                  updateItem(index, { qtyOrdered: event.target.value })
                }
                type="number"
                min={0}
                step={0.01}
                placeholder="Qty"
                title="Qty dalam satuan stok bahan"
                aria-label={`Qty baris ${index + 1}`}
                className={`${inputCls} w-24`}
              />
              <input
                value={item.unitPrice}
                onChange={(event) =>
                  updateItem(index, { unitPrice: event.target.value })
                }
                type="number"
                min={0}
                step={100}
                placeholder="Harga/satuan"
                title="Harga per satuan stok bahan"
                aria-label={`Harga satuan baris ${index + 1}`}
                className={`${inputCls} w-32`}
              />
              <button
                type="button"
                aria-label={`Hapus baris ${index + 1}`}
                disabled={items.length === 1}
                onClick={() =>
                  setItems((state) => state.filter((_, i) => i !== index))
                }
                className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container disabled:opacity-40"
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setItems((state) => [
                ...state,
                {
                  rawMaterialId: materials[0]?.id ?? '',
                  qtyOrdered: '1',
                  unitPrice: '',
                },
              ])
            }
            className="flex w-fit items-center gap-1.5 rounded-lg bg-lp-surface-container-low px-3 py-1.5 text-xs font-semibold text-lp-on-surface hover:bg-lp-surface-container"
          >
            <Icon name="add" className="text-[16px]" />
            Tambah baris
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-lp-surface-low p-3">
          <span className="text-xs font-semibold text-lp-on-surface-variant">
            Total PO
          </span>
          <span className="font-lp-mono text-base font-bold text-lp-on-surface">
            {formatIDR(total)}
          </span>
        </div>

        {(error || errorMessage) && (
          <div
            role="alert"
            className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
          >
            {error ?? errorMessage}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="save" className="text-[18px]" />
            {pending ? 'Menyimpan…' : 'Simpan PO'}
          </button>
        </div>
      </div>
    </div>
  );
}
