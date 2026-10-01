'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { DropdownSearch } from '@/components/ui/dropdown-search';
import { formatQty } from '@/lib/format';
import type { Outlet, PurchaseOrder } from '@/lib/types';

const inputCls =
  'w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right font-mono text-sm outline-none focus:border-emerald-600';

/**
 * Distribute a received PO to one branch outlet: picks a destination and a qty
 * per line (capped at what was received). BE creates a stock transfer.
 */
export function DistributePoModal({
  order,
  outlets,
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  order: PurchaseOrder;
  outlets: Outlet[];
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (target: {
    outletId: string;
    items: Array<{ rawMaterialId: string; qty: number }>;
  }) => void;
}) {
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? '');
  const [qty, setQty] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      order.items.map((item) => [item.rawMaterialId, String(item.qtyReceived)]),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  const outletOptions = outlets.map((o) => ({
    value: o.id,
    label: o.name,
    subLabel: o.address || undefined,
  }));

  function submit() {
    if (!outletId) {
      setError('Pilih outlet tujuan.');
      return;
    }
    const items = order.items
      .map((item) => ({
        rawMaterialId: item.rawMaterialId,
        qty: Number(qty[item.rawMaterialId] ?? 0),
      }))
      .filter((item) => Number.isFinite(item.qty) && item.qty > 0);

    if (items.length === 0) {
      setError('Isi minimal 1 qty bahan.');
      return;
    }
    setError(null);
    onSubmit({ outletId, items });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-lp-surface-container-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-lp-on-surface">
              Distribusi ke Outlet Lain
            </h2>
            <p className="text-xs text-lp-tertiary">
              {order.poNumber} · membuat stock transfer keluar dari outlet ini.
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

        <div className="mb-3">
          <label
            htmlFor="dist-outlet"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            Outlet Tujuan
          </label>
          <DropdownSearch
            id="dist-outlet"
            value={outletId}
            onChange={(val) => setOutletId(val)}
            placeholder="Pilih outlet tujuan…"
            searchPlaceholder="Cari outlet / cabang…"
            options={outletOptions}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Qty per Bahan
          </span>
          {order.items.map((item) => (
            <div
              key={item.rawMaterialId}
              className="flex items-center justify-between gap-2 rounded-lg bg-lp-surface-container-low px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-lp-on-surface">
                  {item.rawMaterialName}
                </span>
                <span className="text-[11px] text-lp-tertiary">
                  diterima {formatQty(item.qtyReceived)} {item.unit}
                </span>
              </span>
              <input
                type="number"
                min={0}
                max={item.qtyReceived}
                step={0.01}
                value={qty[item.rawMaterialId] ?? ''}
                aria-label={`Qty distribusi ${item.rawMaterialName}`}
                onChange={(event) =>
                  setQty((state) => ({
                    ...state,
                    [item.rawMaterialId]: event.target.value,
                  }))
                }
                className={inputCls}
              />
            </div>
          ))}
        </div>

        {(error || errorMessage) && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
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
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <Icon name="local_shipping" className="text-[18px]" />
            {pending ? 'Mengirim…' : 'Distribusikan'}
          </button>
        </div>
      </div>
    </div>
  );
}
