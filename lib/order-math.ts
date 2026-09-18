// Explicit .ts extension: this module is also loaded by `node --test`.
import { ASYNC_METHODS, type CartLine, type PaymentMethod } from './types.ts';

export type PendingModifierGroup = {
  groupId: string;
  selected: Array<{ id: string; name: string; priceAddition: number }>;
};

export type PendingLineInput = {
  productId: string;
  variantId?: string;
  basePrice: number;
  modifierGroups: PendingModifierGroup[];
  notes?: string;
};

/** Two taps merge into one cart line only when every choice matches. */
export function lineKey(line: PendingLineInput): string {
  const mods = line.modifierGroups
    .map((g) => `${g.groupId}:${g.selected.map((m) => m.id).sort().join(',')}`)
    .sort()
    .join('|');
  return [line.productId, line.variantId ?? '', mods, (line.notes ?? '').trim()].join(
    '#',
  );
}

export function lineUnitPrice(line: PendingLineInput): number {
  const additions = line.modifierGroups.reduce(
    (sum, g) => sum + g.selected.reduce((s, m) => s + m.priceAddition, 0),
    0,
  );
  return line.basePrice + additions;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export type SplitCheck =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Mirrors the server's split-payment rules so the cashier gets the error before
 * the request: async methods settle via one gateway QR, so they cannot be
 * combined, and the first amount must leave a positive remainder.
 */
export function validateSplit(input: {
  methods: PaymentMethod[];
  firstAmount: number;
  total: number;
}): SplitCheck {
  if (input.methods.some((m) => ASYNC_METHODS.has(m))) {
    return {
      ok: false,
      reason: 'QRIS/e-wallet tidak bisa digabung dengan metode lain.',
    };
  }
  if (input.firstAmount <= 0 || input.firstAmount >= input.total) {
    return {
      ok: false,
      reason: 'Nominal pertama harus lebih dari 0 dan kurang dari total.',
    };
  }
  return { ok: true };
}
