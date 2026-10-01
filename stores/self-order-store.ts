'use client';

import { create } from 'zustand';

export interface SelfOrderItemOption {
  cupSize: 'regular' | 'large';
  cupSizeLabel: string;
  cupSizePrice: number;
  milk: 'fresh' | 'oat';
  milkLabel: string;
  milkPrice: number;
  sugar: 'normal' | 'less' | 'none';
  sugarLabel: string;
  ice: 'normal' | 'less' | 'none';
  iceLabel: string;
  notes?: string;
}

export interface SelfOrderCartLine {
  id: string;
  name: string;
  image: string;
  basePrice: number;
  qty: number;
  options: SelfOrderItemOption;
  lineTotal: number;
}

interface SelfOrderState {
  tableNumber: string;
  tableName: string;
  tableArea: string;
  lines: SelfOrderCartLine[];
  orderNumber: string | null;
  paymentStatus: 'unpaid' | 'paid';
  trackingStep: 1 | 2 | 3 | 4;

  setTable: (tableCode: string) => void;
  addItem: (item: {
    name: string;
    image: string;
    basePrice: number;
    qty: number;
    options: SelfOrderItemOption;
  }) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;

  setPaymentSuccess: (orderNumber: string) => void;
  setTrackingStep: (step: 1 | 2 | 3 | 4) => void;
  resetOrder: () => void;
}

// Initial demo items in customer cart to match Stitch Q-03
const INITIAL_DEMO_LINES: SelfOrderCartLine[] = [
  {
    id: 'cart-1',
    name: 'Es Kopi Susu Aren Tumbuh',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMMgcqbO46CqMBpZUENMxzQO2sG-G1O1hTgNu5x-uKBeR9Y32zVJJoPiucONJg2sPI7PQ8cu0Z6Arf9Db4P_gZyWjufeA0KMsiV9sQTkyN3DeGJ7n_6sN4ymnwvq_Yd1DZeEYs52olQx6dRpuL2TxvYZIn7D2mMI6DHRCh-P7H2-agtIKcvG1leSqzArjLkAqaJJCmJpk0cvdv-WuchGo2T2sForRcruQ_qt50t2o6oKFhysKUcT4TyjRUPztPzxWzUwBKdIMHAzg',
    basePrice: 28000,
    qty: 1,
    options: {
      cupSize: 'regular',
      cupSizeLabel: 'Regular (12oz)',
      cupSizePrice: 0,
      milk: 'fresh',
      milkLabel: 'Fresh Milk',
      milkPrice: 0,
      sugar: 'less',
      sugarLabel: 'Less Sugar (50%)',
      ice: 'less',
      iceLabel: 'Less Ice',
      notes: 'Pisah es batu, sedotan kertas ya kak',
    },
    lineTotal: 28000,
  },
  {
    id: 'cart-2',
    name: 'Truffle Carbonara Pasta',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCPWimMRZ7SmUrbJEzfo-RhAn6Xk0wWzStb3bmAIOA4dCiPF6VaA60TVzg5yB3luZ--irDKY3agy-1X0USn4oy5TQqxPBd3fM0ANUtJH4101cqCXZHtyi31DUz_eSh0Ie2pNdOG9R9eMO9dFgxxlpAiSI3vKe9VxtMeX7iDSw4bV4N818ajT3QLwlpzfX61GqDRJrC1I1bESbI4RtqO-z6gXyStV2rrAlGlEP3pl7eYXObUEWya7ZvGN32PSfWedMVXnQ8oE3gp65Y',
    basePrice: 85000,
    qty: 1,
    options: {
      cupSize: 'regular',
      cupSizeLabel: 'Porsi Standar',
      cupSizePrice: 0,
      milk: 'fresh',
      milkLabel: 'Standard',
      milkPrice: 0,
      sugar: 'none',
      sugarLabel: 'Tanpa Gula',
      ice: 'none',
      iceLabel: 'Hangat',
      notes: 'Al Dente, pisah chili flakes',
    },
    lineTotal: 85000,
  },
  {
    id: 'cart-3',
    name: 'Almond Butter Croissant',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBxIXztuJtlrt5j_-wyLqucRN1uLFDYiQ96pWlkgPydmUnHV_tuVUiKvyB85T2_JFp0yhXGNVM4vGDrofa4nd8v2m1Y8uo-tV99wbl6hSNzLIBGYM-U01iUFY5AVQX91OtEE3GlZEDyGzZ5mB6kLiZ0kig9QNaNQ0dagIgEEJKEoTO9qamSLPxdVHQqZNJT7L9UHsU3pUuEMgGYxyDNQZYeKJClr8CcejBJ8BZ06b3_ll7HVTw2WUEvbA08KfC_kxNqcZhYu1vEbkI',
    basePrice: 38000,
    qty: 1,
    options: {
      cupSize: 'regular',
      cupSizeLabel: '1 Pcs',
      cupSizePrice: 0,
      milk: 'fresh',
      milkLabel: 'Standard',
      milkPrice: 0,
      sugar: 'normal',
      sugarLabel: 'Standard',
      ice: 'none',
      iceLabel: 'Hangat',
      notes: 'Hangatkan di oven 2 menit',
    },
    lineTotal: 38000,
  },
];

export const useSelfOrderStore = create<SelfOrderState>((set) => ({
  tableNumber: '08',
  tableName: 'Meja 08',
  tableArea: 'Garden Terrace',
  lines: INITIAL_DEMO_LINES,
  orderNumber: '#ORD-2026-0850',
  paymentStatus: 'unpaid',
  trackingStep: 2,

  setTable: (tableCode) => {
    const clean = tableCode.replace(/^meja-?/i, '').trim() || '08';
    set({
      tableNumber: clean,
      tableName: `Meja ${clean}`,
      tableArea: clean === '08' ? 'Garden Terrace' : 'Indoor AC',
    });
  },

  addItem: (item) =>
    set((state) => {
      const lineUnitPrice =
        item.basePrice + item.options.cupSizePrice + item.options.milkPrice;
      const newLine: SelfOrderCartLine = {
        id: `cart-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: item.name,
        image: item.image,
        basePrice: item.basePrice,
        qty: item.qty,
        options: item.options,
        lineTotal: lineUnitPrice * item.qty,
      };

      return { lines: [...state.lines, newLine] };
    }),

  updateQty: (id, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { lines: state.lines.filter((l) => l.id !== id) };
      }
      return {
        lines: state.lines.map((l) => {
          if (l.id !== id) return l;
          const unitPrice =
            l.basePrice + l.options.cupSizePrice + l.options.milkPrice;
          return { ...l, qty, lineTotal: unitPrice * qty };
        }),
      };
    }),

  removeItem: (id) =>
    set((state) => ({
      lines: state.lines.filter((l) => l.id !== id),
    })),

  clearCart: () => set({ lines: [] }),

  setPaymentSuccess: (orderNumber) =>
    set({
      paymentStatus: 'paid',
      orderNumber,
      trackingStep: 2, // Live cooking step
    }),

  setTrackingStep: (step) => set({ trackingStep: step }),

  resetOrder: () =>
    set({
      lines: [],
      paymentStatus: 'unpaid',
      orderNumber: null,
      trackingStep: 1,
    }),
}));
