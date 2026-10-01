'use client';

import { useState } from 'react';
import { formatIDR } from '@/lib/format';
import { Icon } from './icon';
import { Button } from './pos-ui';
import type { ParkedOrder } from '@/stores/hold-store';

const VOID_REASONS = [
  'Salah Input Kasir',
  'Pelanggan Ganti Menu / Batal',
  'Bahan Baku Habis / Kualitas Rusak',
  'Komplain Durasi Makanan Terlalu Lama',
  'Lainnya',
];

/**
 * Void a parked (unpaid) order: pick items to remove, or all of them to void
 * the whole order. Reason is required and recorded on the server.
 */
export function VoidModal({
  order,
  submitting,
  onCancel,
  onConfirm,
}: {
  order: ParkedOrder;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: (params: {
    orderId: string;
    itemIds: string[];
    reason: string;
  }) => void;
}) {
  const items = order.items ?? [];
  const [selected, setSelected] = useState<string[]>(() =>
    items.length > 0 ? [items[0].id] : [],
  );
  const [reason, setReason] = useState<string>(VOID_REASONS[0]);
  const [error, setError] = useState<string | null>(null);

  const label = order.tableNumber || order.customerName || order.notes || 'Order';
  const allSelected = items.length > 0 && selected.length === items.length;
  const voidTotal = items
    .filter((i) => selected.includes(i.id))
    .reduce((s, i) => s + i.unitPrice * i.qty, 0);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setError(null);
  }

  function handleSubmit() {
    if (selected.length === 0) {
      setError('Pilih minimal 1 item yang ingin dibatalkan.');
      return;
    }
    onConfirm({ orderId: order.id, itemIds: selected, reason });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-lg flex-col rounded-2xl border border-red-200/60 bg-lp-surface-container-lowest shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-lp-outline-variant/20 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-lp-error">
              <Icon name="cancel" className="text-2xl" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-lp-on-surface">Batalkan Item / Pesanan</h2>
              <p className="text-[11px] text-lp-on-surface-variant">
                Item terpilih dihapus dari tagihan. Pilih semua untuk void seluruh pesanan.
              </p>
            </div>
          </div>
          <Button variant="ghost" className="text-xs py-1 px-2.5" onClick={onCancel}>
            <Icon name="close" className="text-sm" />
          </Button>
        </div>

        <div className="flex items-center justify-between border-b border-lp-outline-variant/15 bg-lp-surface-low px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lp-on-surface">{label}</span>
            <span className="font-lp-mono font-medium text-lp-on-surface-variant">
              {order.orderNumber}
            </span>
          </div>
          <span className="font-lp-mono font-bold text-lp-on-surface">
            {formatIDR(order.total)}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant">
                1. Pilih item yang dibatalkan
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelected(allSelected ? [] : items.map((i) => i.id))
                }
                className="text-xs font-bold text-lp-primary hover:underline"
              >
                {allSelected ? 'Batal pilih semua' : 'Pilih semua (void seluruh bill)'}
              </button>
            </div>

            <div className="rounded-xl border border-lp-outline-variant/25 divide-y divide-lp-outline-variant/15 bg-lp-surface-low/50 overflow-hidden">
              {items.map((item) => {
                const checked = selected.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 p-3 transition-colors ${
                      checked ? 'bg-red-50/60' : 'hover:bg-lp-surface-container/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.id)}
                      className="mt-0.5 h-4 w-4 rounded accent-red-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-xs font-bold ${checked ? 'text-red-900' : 'text-lp-on-surface'}`}>
                          {item.qty}× {item.productName ?? 'Produk'}
                          {item.variantName ? ` (${item.variantName})` : ''}
                        </span>
                        <span className="shrink-0 text-xs font-bold font-lp-mono">
                          {formatIDR(item.unitPrice * item.qty)}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="mt-0.5 text-[10px] italic text-amber-700">* {item.notes}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-2.5">
              <span className="text-xs font-bold text-red-900">Total Nilai Pembatalan:</span>
              <span className="text-base font-bold font-lp-mono text-red-700">
                {formatIDR(voidTotal)}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant">
              2. Alasan pembatalan (wajib)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VOID_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReason(r);
                    setError(null);
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs transition-all ${
                    reason === r
                      ? 'border-red-600 bg-red-600 text-white font-bold shadow-xs'
                      : 'border-lp-outline-variant/30 bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container font-medium'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-lp-outline-variant/20 p-4">
          <Button variant="ghost" className="text-xs" onClick={onCancel} disabled={submitting}>
            Batal
          </Button>
          <Button
            className="flex h-10 items-center gap-1.5 bg-lp-error px-4 text-xs font-bold text-white shadow-sm hover:bg-red-700"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Icon name="delete_forever" className="text-base" />
            <span>
              {submitting
                ? 'Memproses…'
                : allSelected
                  ? 'Void Seluruh Pesanan'
                  : 'Konfirmasi Void Item'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
