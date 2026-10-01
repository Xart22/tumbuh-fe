'use client';

import { create } from 'zustand';

export type TableArea = 'all' | 'indoor' | 'outdoor' | 'vip' | 'bar';
export type TableStatus = 'available' | 'occupied' | 'waiting_bill' | 'reserved';
export type TableShape = 'square' | 'round' | 'communal';

export interface TableOrderItem {
  id: string;
  qty: number;
  name: string;
  notes?: string;
  price: number;
  stationTag: string;
}

export interface TableItem {
  id: string;
  code: string;
  name: string;
  area: TableArea;
  areaLabel: string;
  capacity: number;
  shape: TableShape;
  status: TableStatus;

  // Active Dining Session
  guestName?: string;
  pax?: number;
  orderNumber?: string;
  cashierName?: string;
  startTime?: string;
  durationMinutes?: number;
  items?: TableOrderItem[];
  subtotal?: number;
  serviceCharge?: number;
  tax?: number;
  totalBill?: number;

  // Reservation
  reservationSchedule?: string;
  depositAmount?: number;
  depositStatus?: string;
}

interface TableStoreState {
  tables: TableItem[];
  selectedTableId: string | null;
  activeArea: TableArea;
  filterStatus: 'all' | TableStatus;
  searchQuery: string;

  selectTable: (id: string | null) => void;
  setActiveArea: (area: TableArea) => void;
  setFilterStatus: (status: 'all' | TableStatus) => void;
  setSearchQuery: (query: string) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  addTable: (table: Omit<TableItem, 'id'>) => void;
}

const INITIAL_TABLES: TableItem[] = [
  {
    id: 'tbl-1',
    code: 'T-01',
    name: 'Meja T-01',
    area: 'indoor',
    areaLabel: 'Main Dining Hall (Indoor AC)',
    capacity: 4,
    shape: 'square',
    status: 'occupied',
    guestName: 'Dimas',
    pax: 4,
    orderNumber: '#ORD-2026-0104',
    cashierName: 'Budi (Terminal 01)',
    startTime: '19:40 WIB',
    durationMinutes: 38,
    items: [
      { id: 'i-1', qty: 2, name: 'Es Kopi Susu Aren Tumbuh', price: 28000, stationTag: 'Bar' },
      { id: 'i-2', qty: 1, name: 'Wagyu Beef Rice Bowl', price: 68000, stationTag: 'Kitchen' },
      { id: 'i-3', qty: 1, name: 'French Fries Truffle', price: 41000, stationTag: 'Kitchen' },
    ],
    subtotal: 165000,
    serviceCharge: 8250,
    tax: 17325,
    totalBill: 190575,
  },
  {
    id: 'tbl-2',
    code: 'T-02',
    name: 'Meja T-02',
    area: 'indoor',
    areaLabel: 'Main Dining Hall (Indoor AC)',
    capacity: 4,
    shape: 'square',
    status: 'waiting_bill',
    guestName: 'Sarah',
    pax: 2,
    orderNumber: '#ORD-2026-0112',
    cashierName: 'Budi (Terminal 01)',
    startTime: '19:15 WIB',
    durationMinutes: 72, // 1j 12m
    items: [
      {
        id: 'i-4',
        qty: 2,
        name: 'Iced Caffe Latte Oat Milk',
        notes: 'Less sugar 50%, Oatside Milk (+Rp 6.000)',
        price: 38000,
        stationTag: 'Barista',
      },
      {
        id: 'i-5',
        qty: 1,
        name: 'Truffle Fries Large',
        notes: 'Extra Parmesan Cheese Sauce',
        price: 45000,
        stationTag: 'Dapur Snack',
      },
      {
        id: 'i-6',
        qty: 1,
        name: 'Almond Croissant Heated',
        notes: 'Hangatkan di Oven 2 Menit',
        price: 32000,
        stationTag: 'Pastry Display',
      },
      {
        id: 'i-7',
        qty: 1,
        name: 'Spaghetti Aglio Olio Smoked Beef',
        notes: 'Level Pedas: Sedang',
        price: 65000,
        stationTag: 'Main Kitchen',
      },
    ],
    subtotal: 218000,
    serviceCharge: 10900,
    tax: 22890,
    totalBill: 251790,
  },
  {
    id: 'tbl-3',
    code: 'T-03',
    name: 'Meja T-03',
    area: 'indoor',
    areaLabel: 'Main Dining Hall (Indoor AC)',
    capacity: 2,
    shape: 'round',
    status: 'available',
  },
  {
    id: 'tbl-4',
    code: 'T-04',
    name: 'Meja T-04',
    area: 'indoor',
    areaLabel: 'Main Dining Hall (Indoor AC)',
    capacity: 2,
    shape: 'round',
    status: 'occupied',
    guestName: 'Adit',
    pax: 1,
    orderNumber: '#ORD-2026-0114',
    cashierName: 'Budi (Terminal 01)',
    startTime: '20:05 WIB',
    durationMinutes: 22,
    items: [
      { id: 'i-8', qty: 1, name: 'Americano Cold Brew', price: 26000, stationTag: 'Bar' },
      { id: 'i-9', qty: 1, name: 'Cinnamon Roll', price: 32000, stationTag: 'Pastry' },
    ],
    subtotal: 58000,
    serviceCharge: 2900,
    tax: 6090,
    totalBill: 66990,
  },
  {
    id: 'tbl-5',
    code: 'T-05',
    name: 'Meja T-05 (Komunal Besar)',
    area: 'indoor',
    areaLabel: 'Main Dining Hall (Indoor AC)',
    capacity: 8,
    shape: 'communal',
    status: 'occupied',
    guestName: 'Arya (Komunitas Mahasiswa)',
    pax: 6,
    orderNumber: '#ORD-2026-0109',
    cashierName: 'Rian (Terminal 02)',
    startTime: '19:35 WIB',
    durationMinutes: 45,
    items: [
      { id: 'i-10', qty: 6, name: 'Es Kopi Susu Tumbuh', price: 28000, stationTag: 'Bar' },
      { id: 'i-11', qty: 2, name: 'Sharing Platter Fries & Wings', price: 85000, stationTag: 'Kitchen' },
      { id: 'i-12', qty: 1, name: 'Nasi Goreng Kampung', price: 52000, stationTag: 'Kitchen' },
    ],
    subtotal: 390000,
    serviceCharge: 19500,
    tax: 40950,
    totalBill: 450450,
  },
  {
    id: 'tbl-6',
    code: 'T-06',
    name: 'Meja T-06',
    area: 'indoor',
    areaLabel: 'Main Dining Hall (Indoor AC)',
    capacity: 4,
    shape: 'square',
    status: 'reserved',
    guestName: 'Ibu Maya',
    pax: 4,
    reservationSchedule: '19:30 WIB',
    depositAmount: 200000,
    depositStatus: 'Lunas',
  },
  {
    id: 'tbl-7',
    code: 'T-07',
    name: 'Meja T-07',
    area: 'indoor',
    areaLabel: 'Main Dining Hall (Indoor AC)',
    capacity: 4,
    shape: 'square',
    status: 'available',
  },
  {
    id: 'tbl-8',
    code: 'T-08',
    name: 'Meja T-08',
    area: 'indoor',
    areaLabel: 'Main Dining Hall (Indoor AC)',
    capacity: 4,
    shape: 'square',
    status: 'available',
  },
  // Outdoor Terrace Tables
  {
    id: 'tbl-9',
    code: 'T-09',
    name: 'Meja T-09 (Garden)',
    area: 'outdoor',
    areaLabel: 'Outdoor Terrace & Smoking',
    capacity: 4,
    shape: 'square',
    status: 'occupied',
    guestName: 'Bpk Hendra',
    pax: 3,
    orderNumber: '#ORD-2026-0120',
    durationMinutes: 30,
    items: [
      { id: 'i-13', qty: 3, name: 'Iced Matcha Latte', price: 42000, stationTag: 'Bar' },
    ],
    subtotal: 126000,
    serviceCharge: 6300,
    tax: 13230,
    totalBill: 145530,
  },
  {
    id: 'tbl-10',
    code: 'T-10',
    name: 'Meja T-10 (Garden)',
    area: 'outdoor',
    areaLabel: 'Outdoor Terrace & Smoking',
    capacity: 4,
    shape: 'square',
    status: 'waiting_bill',
    guestName: 'Kak Cindy',
    pax: 2,
    orderNumber: '#ORD-2026-0122',
    durationMinutes: 55,
    items: [
      { id: 'i-14', qty: 2, name: 'Americano Gayo', price: 28000, stationTag: 'Bar' },
      { id: 'i-15', qty: 1, name: 'Cheesecake Slice', price: 45000, stationTag: 'Pastry' },
    ],
    subtotal: 101000,
    serviceCharge: 5050,
    tax: 10605,
    totalBill: 116655,
  },
  {
    id: 'tbl-11',
    code: 'T-11',
    name: 'Meja T-11',
    area: 'outdoor',
    areaLabel: 'Outdoor Terrace & Smoking',
    capacity: 2,
    shape: 'round',
    status: 'available',
  },
  {
    id: 'tbl-12',
    code: 'T-12',
    name: 'Meja T-12',
    area: 'outdoor',
    areaLabel: 'Outdoor Terrace & Smoking',
    capacity: 2,
    shape: 'round',
    status: 'available',
  },
  // VIP Room Tables
  {
    id: 'tbl-13',
    code: 'VIP-01',
    name: 'VIP Meeting Room 01',
    area: 'vip',
    areaLabel: 'VIP Meeting Room',
    capacity: 10,
    shape: 'communal',
    status: 'reserved',
    guestName: 'PT Finansial Mandiri (Pak Doni)',
    pax: 10,
    reservationSchedule: '20:00 WIB',
    depositAmount: 1000000,
    depositStatus: 'Lunas',
  },
  {
    id: 'tbl-14',
    code: 'VIP-02',
    name: 'VIP Lounge 02',
    area: 'vip',
    areaLabel: 'VIP Meeting Room',
    capacity: 6,
    shape: 'communal',
    status: 'occupied',
    guestName: 'Keluarga Bpk Wijaya',
    pax: 6,
    orderNumber: '#ORD-2026-0098',
    durationMinutes: 65,
    items: [
      { id: 'i-16', qty: 4, name: 'Sirloin Steak Set', price: 145000, stationTag: 'Kitchen' },
      { id: 'i-17', qty: 6, name: 'Specialty Drink', price: 38000, stationTag: 'Bar' },
    ],
    subtotal: 808000,
    serviceCharge: 40400,
    tax: 84840,
    totalBill: 933240,
  },
  // Bar Counter
  {
    id: 'tbl-15',
    code: 'BAR-01',
    name: 'Bar Counter Stool A',
    area: 'bar',
    areaLabel: 'Bar Counter',
    capacity: 2,
    shape: 'round',
    status: 'occupied',
    guestName: 'Mas Kevin',
    pax: 1,
    orderNumber: '#ORD-2026-0125',
    durationMinutes: 15,
    items: [
      { id: 'i-18', qty: 1, name: 'Pour Over V60 Ethiopia', price: 45000, stationTag: 'Bar' },
    ],
    subtotal: 45000,
    serviceCharge: 2250,
    tax: 4725,
    totalBill: 51975,
  },
  {
    id: 'tbl-16',
    code: 'BAR-02',
    name: 'Bar Counter Stool B',
    area: 'bar',
    areaLabel: 'Bar Counter',
    capacity: 2,
    shape: 'round',
    status: 'available',
  },
];

export const useTableStore = create<TableStoreState>((set) => ({
  tables: INITIAL_TABLES,
  selectedTableId: 'tbl-2', // Default to T-02 (the selected one in Stitch)
  activeArea: 'indoor',
  filterStatus: 'all',
  searchQuery: '',

  selectTable: (id) => set({ selectedTableId: id }),
  setActiveArea: (activeArea) => set({ activeArea }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  updateTableStatus: (tableId, status) =>
    set((state) => ({
      tables: state.tables.map((t) => (t.id === tableId ? { ...t, status } : t)),
    })),

  addTable: (newTable) =>
    set((state) => ({
      tables: [
        ...state.tables,
        {
          ...newTable,
          id: `tbl-${Date.now()}`,
        },
      ],
    })),
}));
