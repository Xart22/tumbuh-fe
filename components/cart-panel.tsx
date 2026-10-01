'use client';

import { useState } from 'react';
import { formatIDR } from '@/lib/format';
import type { CartLine } from '@/lib/types';
import type { CartCustomer } from '@/stores/cart-store';
import { Icon } from './icon';
import { Button, Input } from './pos-ui';

export function CartPanel({
  lines,
  subtotal,
  customer,
  onSetQty,
  onRemove,
  onSetNotes,
  onClear,
  onCheckout,
  onPark,
  onPickCustomer,
  onClearCustomer,
  checkoutDisabled,
}: {
  lines: CartLine[];
  subtotal: number;
  customer: CartCustomer | null;
  onSetQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onSetNotes: (key: string, notes: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  onPark?: () => void;
  onPickCustomer: () => void;
  onClearCustomer: () => void;
  checkoutDisabled: boolean;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  if (lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-lp-surface-container-lowest">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lp-surface-container text-lp-on-surface-variant">
          <Icon name="shopping_basket" className="text-3xl" />
        </div>
        <p className="mt-3 text-sm font-semibold text-lp-on-surface">Keranjang Masih Kosong</p>
        <p className="mt-1 max-w-[200px] text-xs text-lp-on-surface-variant leading-relaxed">
          Pilih menu atau scan barcode untuk menambahkan pesanan
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-lp-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-lp-outline-variant/25 bg-lp-surface-container-lowest px-4 py-2.5 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-lp-surface-container px-2.5 py-0.5 text-xs font-bold text-lp-on-surface-variant">
            {lines.length} Item
          </span>
          <span className="text-[11px] text-lp-on-surface-variant font-medium">
            ({lines.reduce((s, l) => s + l.qty, 0)} porsi)
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-xs font-semibold text-lp-error hover:text-red-700 transition-colors"
        >
          <Icon name="delete_sweep" className="text-sm" />
          Kosongkan
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-lp-outline-variant/15">
        {lines.map((line) => (
          <div
            key={line.key}
            className="px-4 py-3 bg-lp-surface-container-lowest transition-colors hover:bg-lp-surface-low/60"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-lp-on-surface">
                    {line.productName}
                  </p>
                  {line.variantName && (
                    <span className="rounded bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 text-[10px] font-semibold text-lp-primary">
                      {line.variantName}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-lp-on-surface-variant font-lp-mono">
                  {formatIDR(line.unitPrice)}
                </p>
                {line.modifierGroups.map((g) => (
                  <p key={g.groupId} className="mt-0.5 text-[11px] text-lp-on-surface-variant flex items-center gap-1">
                    <span className="text-lp-primary font-bold">+</span>
                    {g.selected.map((m) => m.name).join(', ')}
                  </p>
                ))}
                {line.notes && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] italic text-amber-800">
                    <Icon name="edit_note" className="text-xs" />
                    {line.notes}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs font-bold font-lp-mono text-lp-on-surface">
                {formatIDR(line.unitPrice * line.qty)}
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-lp-outline-variant/40 bg-lp-surface-container-lowest shadow-2xs">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-l-lg text-sm font-bold text-lp-on-surface hover:bg-lp-surface-container transition-colors"
                  onClick={() => onSetQty(line.key, line.qty - 1)}
                  aria-label="Kurangi jumlah"
                >
                  −
                </button>
                <span className="min-w-7 text-center text-xs font-bold font-lp-mono text-lp-on-surface">
                  {line.qty}
                </span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-r-lg text-sm font-bold text-lp-on-surface hover:bg-lp-surface-container transition-colors"
                  onClick={() => onSetQty(line.key, line.qty + 1)}
                  aria-label="Tambah jumlah"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-lp-outline-variant/30 bg-lp-surface-low px-2 py-1 text-[11px] font-medium text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface transition-colors"
                onClick={() =>
                  setEditingKey(editingKey === line.key ? null : line.key)
                }
              >
                <Icon name="edit" className="text-xs" />
                Catatan
              </button>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-lp-error hover:text-red-700 transition-colors"
                onClick={() => onRemove(line.key)}
                aria-label={`Hapus ${line.productName}`}
              >
                <Icon name="delete" className="text-xs" />
                Hapus
              </button>
            </div>

            {editingKey === line.key && (
              <div className="mt-2">
                <Input
                  defaultValue={line.notes ?? ''}
                  placeholder="Contoh: tanpa bawang, less sugar..."
                  className="text-xs py-1.5"
                  onBlur={(e) => {
                    onSetNotes(line.key, e.target.value);
                    setEditingKey(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-lp-outline-variant/25 bg-lp-surface-container-lowest p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between gap-2">
          {customer ? (
            <>
              <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-lp-on-surface">
                <Icon name="person" className="text-sm text-lp-primary" />
                <span className="truncate">{customer.name}</span>
              </span>
              <button
                type="button"
                onClick={onClearCustomer}
                className="shrink-0 text-[11px] font-semibold text-lp-error hover:text-red-700 transition-colors"
              >
                Ganti
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onPickCustomer}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-lp-primary hover:underline"
            >
              <Icon name="person_add" className="text-sm" />
              <span>Tambah Pelanggan</span>
            </button>
          )}
        </div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-xs font-semibold text-lp-on-surface-variant uppercase tracking-wider">Subtotal</span>
          <span className="text-lg font-bold font-lp-mono text-lp-on-surface">
            {formatIDR(subtotal)}
          </span>
        </div>
        <div className="flex gap-2">
          {onPark && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-lp-outline-variant/40 hover:bg-lp-surface-container"
              onClick={onPark}
              title="Parkirkan tagihan meja ini untuk sementara"
            >
              <Icon name="pause_circle" className="text-base text-lp-primary" />
              <span>Parkir</span>
            </Button>
          )}
          <Button
            className="flex-1 h-11 text-sm font-bold shadow-sm flex items-center justify-center gap-2"
            onClick={onCheckout}
            disabled={checkoutDisabled}
          >
            <span>Lanjut Bayar</span>
            <Icon name="arrow_forward" className="text-base font-bold" />
          </Button>
        </div>
      </div>
    </div>
  );
}
