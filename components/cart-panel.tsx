'use client';

import { useState } from 'react';
import { formatIDR } from '@/lib/format';
import type { CartLine } from '@/lib/types';
import { Button, Input } from './pos-ui';

export function CartPanel({
  lines,
  subtotal,
  onSetQty,
  onRemove,
  onSetNotes,
  onClear,
  onCheckout,
  checkoutDisabled,
}: {
  lines: CartLine[];
  subtotal: number;
  onSetQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onSetNotes: (key: string, notes: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  checkoutDisabled: boolean;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  if (lines.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted">
        Keranjang kosong. Pilih menu untuk mulai.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2">
        <span className="text-xs uppercase tracking-wide text-muted">
          {lines.length} item
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Kosongkan
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {lines.map((line) => (
          <div
            key={line.key}
            className="border-b border-[var(--line)] px-4 py-3 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {line.productName}
                  {line.variantName ? ` · ${line.variantName}` : ''}
                </p>
                <p className="text-xs text-muted">{formatIDR(line.unitPrice)}</p>
                {line.modifierGroups.map((g) => (
                  <p key={g.groupId} className="text-xs text-muted">
                    {g.selected.map((m) => m.name).join(', ')}
                  </p>
                ))}
                {line.notes && (
                  <p className="text-xs italic text-amber-400">* {line.notes}</p>
                )}
              </div>
              <span className="shrink-0 text-sm font-medium text-ink">
                {formatIDR(line.unitPrice * line.qty)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-[var(--line)]">
                <button
                  type="button"
                  className="px-3 py-1 text-ink"
                  onClick={() => onSetQty(line.key, line.qty - 1)}
                >
                  −
                </button>
                <span className="min-w-8 text-center text-sm text-ink">
                  {line.qty}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 text-ink"
                  onClick={() => onSetQty(line.key, line.qty + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="text-xs text-muted hover:text-ink"
                onClick={() =>
                  setEditingKey(editingKey === line.key ? null : line.key)
                }
              >
                Catatan
              </button>
              <button
                type="button"
                className="ml-auto text-xs text-red-400 hover:text-red-300"
                onClick={() => onRemove(line.key)}
              >
                Hapus
              </button>
            </div>

            {editingKey === line.key && (
              <div className="mt-2">
                <Input
                  defaultValue={line.notes ?? ''}
                  placeholder="tanpa bawang…"
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

      <div className="border-t border-[var(--line)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted">Subtotal</span>
          <span className="text-lg font-semibold text-ink">
            {formatIDR(subtotal)}
          </span>
        </div>
        <Button className="w-full" onClick={onCheckout} disabled={checkoutDisabled}>
          Lanjut Bayar
        </Button>
      </div>
    </div>
  );
}
