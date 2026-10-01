'use client';

import { create } from 'zustand';
import {
  createOrder,
  getOrder,
  listOrders,
  replaceOrderItems,
  unholdOrder,
  voidOrder,
  voidOrderItem,
  type CreateOrderLine,
} from '@/lib/api';
import type {
  CartLine,
  CreatedOrder,
  OrderDetail,
  OrderSummary,
  OrderType,
} from '@/lib/types';

/** Adapt a server order detail to the shape PaymentPanel expects. */
export function toCreatedOrder(order: OrderDetail): CreatedOrder {
  return {
    id: order.id,
    outletId: order.outletId ?? '',
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal ?? 0,
    discountAmount: order.discountAmount ?? 0,
    taxAmount: order.taxAmount ?? 0,
    serviceCharge: order.serviceCharge ?? 0,
    total: order.total,
    orderType: order.orderType ?? 'dine_in',
  };
}

/** A parked (held) order as shown in the Bill Parkir list. */
export interface ParkedOrder {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  tableNumber: string | null;
  customerName: string | null;
  /** Free-text label typed at park time ("Meja 05" / "Budi"). */
  notes: string | null;
  createdAt: string;
  items: OrderSummary['items'];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  total: number;
}

export function toParkedOrder(order: OrderSummary | OrderDetail): ParkedOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType ?? 'dine_in',
    tableNumber: order.tableNumber ?? null,
    customerName: order.customerName ?? null,
    notes: order.notes ?? null,
    createdAt: order.createdAt ?? new Date().toISOString(),
    items: (order.items ?? []).filter((i) => i.status !== 'voided'),
    subtotal: order.subtotal ?? 0,
    taxAmount: order.taxAmount ?? 0,
    serviceCharge: order.serviceCharge ?? 0,
    discountAmount: order.discountAmount ?? 0,
    total: order.total,
  };
}

/** Serialise cart lines for the orders API. */
export function toOrderLines(lines: CartLine[]): CreateOrderLine[] {
  return lines.map((line) => ({
    productId: line.productId,
    variantId: line.variantId,
    qty: line.qty,
    unitPrice: line.unitPrice,
    notes: line.notes,
    modifierGroups: line.modifierGroups
      .filter((g) => g.selected.length > 0)
      .map((g) => ({
        groupId: g.groupId,
        selectedModifiers: g.selected.map((m) => ({
          modifierId: m.id,
          modifierName: m.name,
        })),
      })),
  }));
}

/** Rebuild cart lines from a server order (resume-to-cart). */
export function toCartLines(order: OrderDetail): CartLine[] {
  return order.items
    .filter((item) => item.status !== 'voided')
    .map((item) => {
    const groups = new Map<
      string,
      {
        groupId: string;
        groupName: string;
        selected: Array<{ id: string; name: string; priceAddition: number }>;
      }
    >();
    for (const mod of item.modifiers) {
      const groupId = mod.groupId ?? mod.modifierName;
      const group = groups.get(groupId) ?? {
        groupId: mod.groupId ?? '',
        groupName: mod.groupName ?? '',
        selected: [],
      };
      group.selected.push({
        id: mod.modifierId,
        name: mod.modifierName,
        priceAddition: mod.priceAddition,
      });
      groups.set(groupId, group);
    }
    return {
      key: `${item.productId}::${item.variantId ?? ''}::${item.id}`,
      productId: item.productId,
      productName: item.productName ?? 'Produk',
      variantId: item.variantId ?? undefined,
      variantName: item.variantName ?? undefined,
      qty: item.qty,
      unitPrice: item.unitPrice,
      notes: item.notes ?? undefined,
      modifierGroups: [...groups.values()].filter((g) => g.groupId !== ''),
    };
  });
}

interface HoldState {
  orders: ParkedOrder[];
  loading: boolean;
  error: string | null;
  selectedOrderId: string | null;
  selectOrder: (id: string | null) => void;
  refresh: () => Promise<void>;
  park: (params: {
    orderType: OrderType;
    label?: string;
    lines: CartLine[];
  }) => Promise<ParkedOrder | null>;
  /** Unhold + fetch full detail for editing/payment on the same order. */
  resume: (id: string) => Promise<OrderDetail | null>;
  /** Replace every item of a parked order (edit before payment). */
  replaceItems: (id: string, lines: CartLine[]) => Promise<OrderDetail | null>;
  /** Void selected items of a parked order (item-level void). */
  voidItems: (
    id: string,
    itemIds: string[],
    reason: string,
  ) => Promise<boolean>;
  voidParked: (id: string, reason: string) => Promise<boolean>;
  remove: (id: string) => void;
}

export const useHoldStore = create<HoldState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  selectedOrderId: null,

  selectOrder: (id) => set({ selectedOrderId: id }),

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await listOrders({ status: 'held' });
      set({
        orders: rows.map(toParkedOrder),
        selectedOrderId:
          get().selectedOrderId ?? rows[0]?.id ?? null,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Gagal memuat Bill Parkir.',
      });
    } finally {
      set({ loading: false });
    }
  },

  park: async ({ orderType, label, lines }) => {
    set({ error: null });
    try {
      const created = await createOrder({
        orderType,
        items: toOrderLines(lines),
        park: true,
        notes: label?.trim() || undefined,
      });
      await get().refresh();
      return (
        get().orders.find((o) => o.id === created.id) ??
        toParkedOrder(created as unknown as OrderSummary)
      );
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Gagal memarkir pesanan.',
      });
      return null;
    }
  },

  resume: async (id) => {
    try {
      await unholdOrder(id);
      const detail = await getOrder(id);
      await get().refresh();
      return detail;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Gagal melanjutkan pesanan.',
      });
      return null;
    }
  },

  replaceItems: async (id, lines) => {
    try {
      await replaceOrderItems(id, { items: toOrderLines(lines) });
      const detail = await getOrder(id);
      return detail;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Gagal menyimpan pesanan.',
      });
      return null;
    }
  },

  voidItems: async (id, itemIds, reason) => {
    try {
      for (const itemId of itemIds) {
        await voidOrderItem(id, itemId, reason);
      }
      await get().refresh();
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Gagal membatalkan item.',
      });
      return false;
    }
  },

  voidParked: async (id, reason) => {
    try {
      await voidOrder(id, reason);
      await get().refresh();
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Gagal membatalkan pesanan.',
      });
      return false;
    }
  },

  remove: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
      selectedOrderId: state.selectedOrderId === id ? null : state.selectedOrderId,
    })),
}));
