'use client';

import { create } from 'zustand';
import { lineKey, lineUnitPrice } from '@/lib/order-math';
import type { CartLine, OrderType } from '@/lib/types';

type SelectedModifier = { id: string; name: string; priceAddition: number };

export type PendingLine = {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  basePrice: number;
  modifierGroups: Array<{
    groupId: string;
    groupName: string;
    selected: SelectedModifier[];
  }>;
  notes: string;
};

export type CartCustomer = { id: string; name: string; phone: string | null };

type CartState = {
  lines: CartLine[];
  orderType: OrderType;
  orderNotes: string;
  customer: CartCustomer | null;
  setOrderType: (type: OrderType) => void;
  setOrderNotes: (notes: string) => void;
  setCustomer: (customer: CartCustomer | null) => void;
  addLine: (line: PendingLine) => void;
  setQty: (key: string, qty: number) => void;
  setLineNotes: (key: string, notes: string) => void;
  removeLine: (key: string) => void;
  replaceLines: (lines: CartLine[]) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  orderType: 'dine_in',
  orderNotes: '',
  customer: null,

  replaceLines: (lines) => set({ lines }),

  setOrderType: (orderType) => set({ orderType }),
  setOrderNotes: (orderNotes) => set({ orderNotes }),
  setCustomer: (customer) => set({ customer }),

  addLine: (line) =>
    set((state) => {
      const key = lineKey(line);
      const existing = state.lines.find((l) => l.key === key);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, qty: l.qty + 1 } : l,
          ),
        };
      }
      const created: CartLine = {
        key,
        productId: line.productId,
        productName: line.productName,
        variantId: line.variantId,
        variantName: line.variantName,
        qty: 1,
        unitPrice: lineUnitPrice(line),
        notes: line.notes.trim() || undefined,
        modifierGroups: line.modifierGroups.map((g) => ({
          groupId: g.groupId,
          groupName: g.groupName,
          selected: g.selected,
        })),
      };
      return { lines: [...state.lines, created] };
    }),

  setQty: (key, qty) =>
    set((state) => ({
      lines:
        qty <= 0
          ? state.lines.filter((l) => l.key !== key)
          : state.lines.map((l) => (l.key === key ? { ...l, qty } : l)),
    })),

  setLineNotes: (key, notes) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.key === key ? { ...l, notes: notes.trim() || undefined } : l,
      ),
    })),

  removeLine: (key) =>
    set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),

  clear: () => set({ lines: [], orderNotes: '', customer: null }),
}));

export { cartSubtotal, cartCount } from '@/lib/order-math';
