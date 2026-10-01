'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';
import { formatIDR } from '@/lib/format';
import {
  useSelfOrderStore,
  type SelfOrderItemOption,
} from '@/stores/self-order-store';

interface MenuItem {
  id: string;
  name: string;
  category: 'coffee' | 'bakery' | 'food' | 'mocktail';
  categoryLabel: string;
  image: string;
  badge?: string;
  rating: number;
  soldCount: string;
  description: string;
  basePrice: number;
  allowsMilk: boolean;
  allowsCupSize: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'prod-1',
    name: 'Es Kopi Susu Aren Tumbuh',
    category: 'coffee',
    categoryLabel: 'Signature Coffee',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMMgcqbO46CqMBpZUENMxzQO2sG-G1O1hTgNu5x-uKBeR9Y32zVJJoPiucONJg2sPI7PQ8cu0Z6Arf9Db4P_gZyWjufeA0KMsiV9sQTkyN3DeGJ7n_6sN4ymnwvq_Yd1DZeEYs52olQx6dRpuL2TxvYZIn7D2mMI6DHRCh-P7H2-agtIKcvG1leSqzArjLkAqaJJCmJpk0cvdv-WuchGo2T2sForRcruQ_qt50t2o6oKFhysKUcT4TyjRUPztPzxWzUwBKdIMHAzg',
    badge: 'Terlaris',
    rating: 4.9,
    soldCount: '500+ Terjual',
    description:
      'Double shot espresso Arabika Flores & Robusta Temanggung, gula aren organik, fresh milk creamy.',
    basePrice: 28000,
    allowsMilk: true,
    allowsCupSize: true,
  },
  {
    id: 'prod-2',
    name: 'Truffle Carbonara Pasta',
    category: 'food',
    categoryLabel: 'Main Course',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCPWimMRZ7SmUrbJEzfo-RhAn6Xk0wWzStb3bmAIOA4dCiPF6VaA60TVzg5yB3luZ--irDKY3agy-1X0USn4oy5TQqxPBd3fM0ANUtJH4101cqCXZHtyi31DUz_eSh0Ie2pNdOG9R9eMO9dFgxxlpAiSI3vKe9VxtMeX7iDSw4bV4N818ajT3QLwlpzfX61GqDRJrC1I1bESbI4RtqO-z6gXyStV2rrAlGlEP3pl7eYXObUEWya7ZvGN32PSfWedMVXnQ8oE3gp65Y',
    badge: 'Chef Pick',
    rating: 4.8,
    soldCount: 'Rekomendasi Chef',
    description:
      'Fettuccine al dente saus truffle infused cream, crispy smoked beef rashers, egg yolk, & parmigiano reggiano.',
    basePrice: 85000,
    allowsMilk: false,
    allowsCupSize: false,
  },
  {
    id: 'prod-3',
    name: 'Almond Butter Croissant',
    category: 'bakery',
    categoryLabel: 'Artisan Bakery',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBxIXztuJtlrt5j_-wyLqucRN1uLFDYiQ96pWlkgPydmUnHV_tuVUiKvyB85T2_JFp0yhXGNVM4vGDrofa4nd8v2m1Y8uo-tV99wbl6hSNzLIBGYM-U01iUFY5AVQX91OtEE3GlZEDyGzZ5mB6kLiZ0kig9QNaNQ0dagIgEEJKEoTO9qamSLPxdVHQqZNJT7L9UHsU3pUuEMgGYxyDNQZYeKJClr8CcejBJ8BZ06b3_ll7HVTw2WUEvbA08KfC_kxNqcZhYu1vEbkI',
    badge: 'Fresh Bake',
    rating: 4.9,
    soldCount: 'French Butter AOP',
    description:
      'Flaky artisan French butter pastry dengan filling almond cream lembut dan taburan roasted almond slices.',
    basePrice: 38000,
    allowsMilk: false,
    allowsCupSize: false,
  },
  {
    id: 'prod-4',
    name: 'Iced Matcha Latte Oat Milk',
    category: 'coffee',
    categoryLabel: 'Signature Drink',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBddWUHOTFH6nEDjjkLhrY3Y7oKAZ1aSskFXwG_s79Pms5ZokwtS7PQq6lXQeBHbc6vLhlIXU4gvzYf_v5VOnd_g0Ysnw8ulF5dyD2hBaMeQ4UH1ikbRdi5qrQLiNb7BtMSM_EObng9aM7-GytKJb8IzPd5X9evUJ6ci1Cd94FELFaeyY5K8NGtCqGuL_NBYomk2M26iJ-x2t-64GnX0ZAbvl5SYh5nOAoVFq9Y8HBYxJkVsjYjha3chqNcMkqITKKpj7_rM2CXqAM',
    badge: 'Ceremonial Uji',
    rating: 4.9,
    soldCount: 'Premium Grade',
    description:
      'Pure Japanese ceremonial grade matcha whisked fresh, disajikan dengan creamy cold oat milk premium.',
    basePrice: 42000,
    allowsMilk: true,
    allowsCupSize: true,
  },
  {
    id: 'prod-5',
    name: 'Wagyu Beef Rice Bowl',
    category: 'food',
    categoryLabel: 'Main Course',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCPWimMRZ7SmUrbJEzfo-RhAn6Xk0wWzStb3bmAIOA4dCiPF6VaA60TVzg5yB3luZ--irDKY3agy-1X0USn4oy5TQqxPBd3fM0ANUtJH4101cqCXZHtyi31DUz_eSh0Ie2pNdOG9R9eMO9dFgxxlpAiSI3vKe9VxtMeX7iDSw4bV4N818ajT3QLwlpzfX61GqDRJrC1I1bESbI4RtqO-z6gXyStV2rrAlGlEP3pl7eYXObUEWya7ZvGN32PSfWedMVXnQ8oE3gp65Y',
    badge: 'Favorite',
    rating: 4.8,
    soldCount: '350+ Terjual',
    description:
      'Daging Wagyu iris tipis saus yakiniku gurih manis, disajikan hangat dengan nasi Jepang & onsen egg lembut.',
    basePrice: 68000,
    allowsMilk: false,
    allowsCupSize: false,
  },
  {
    id: 'prod-6',
    name: 'Peach Hibiscus Sparkler',
    category: 'mocktail',
    categoryLabel: 'Mocktails',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBddWUHOTFH6nEDjjkLhrY3Y7oKAZ1aSskFXwG_s79Pms5ZokwtS7PQq6lXQeBHbc6vLhlIXU4gvzYf_v5VOnd_g0Ysnw8ulF5dyD2hBaMeQ4UH1ikbRdi5qrQLiNb7BtMSM_EObng9aM7-GytKJb8IzPd5X9evUJ6ci1Cd94FELFaeyY5K8NGtCqGuL_NBYomk2M26iJ-x2t-64GnX0ZAbvl5SYh5nOAoVFq9Y8HBYxJkVsjYjha3chqNcMkqITKKpj7_rM2CXqAM',
    badge: 'Fresh Soda',
    rating: 4.8,
    soldCount: 'Segar Alami',
    description:
      'Cold brew teh hibiscus merah delima dipadu dengan potongan buah peach manis dan sparkling soda berkarbonasi.',
    basePrice: 35000,
    allowsMilk: false,
    allowsCupSize: true,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Semua Menu', count: 38 },
  { id: 'coffee', label: 'Signature Coffee', count: 8 },
  { id: 'bakery', label: 'Artisan Bakery', count: 12 },
  { id: 'food', label: 'Main Course', count: 10 },
  { id: 'mocktail', label: 'Mocktails', count: 8 },
];

export default function SelfOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tableParam = (params?.table as string) || 'meja-08';

  const setTable = useSelfOrderStore((s) => s.setTable);
  const tableName = useSelfOrderStore((s) => s.tableName);
  const tableArea = useSelfOrderStore((s) => s.tableArea);
  const lines = useSelfOrderStore((s) => s.lines);
  const addItem = useSelfOrderStore((s) => s.addItem);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customizer Drawer State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [cupSize, setCupSize] = useState<'regular' | 'large'>('regular');
  const [milk, setMilk] = useState<'fresh' | 'oat'>('fresh');
  const [sugar, setSugar] = useState<'normal' | 'less' | 'none'>('less');
  const [ice, setIce] = useState<'normal' | 'less' | 'none'>('less');
  const [notes, setNotes] = useState<string>('');
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    setTable(tableParam);
  }, [tableParam, setTable]);

  // Filtered Menu
  const filteredMenu = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  // Cart Totals
  const cartItemCount = lines.reduce((s, l) => s + l.qty, 0);
  const cartTotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const regularTotal = Math.round(cartTotal * 1.15); // Strikethrough regular baseline price

  function openCustomizer(item: MenuItem) {
    setCustomizingItem(item);
    setCupSize('regular');
    setMilk('fresh');
    setSugar('less');
    setIce('less');
    setNotes('');
    setQty(1);
  }

  function handleAddCustomizedItem() {
    if (!customizingItem) return;

    const cupSizePrice = cupSize === 'large' ? 6000 : 0;
    const milkPrice = milk === 'oat' ? 10000 : 0;

    const options: SelfOrderItemOption = {
      cupSize,
      cupSizeLabel: cupSize === 'large' ? 'Large (16oz)' : 'Regular (12oz)',
      cupSizePrice,
      milk,
      milkLabel: milk === 'oat' ? 'Oat Milk (Oatside)' : 'Fresh Milk',
      milkPrice,
      sugar,
      sugarLabel:
        sugar === 'normal'
          ? 'Normal (100%)'
          : sugar === 'less'
            ? 'Less Sugar (50%)'
            : 'No Sugar (0%)',
      ice,
      iceLabel:
        ice === 'normal' ? 'Normal Ice' : ice === 'less' ? 'Less Ice' : 'No Ice',
      notes: notes.trim() || undefined,
    };

    addItem({
      name: customizingItem.name,
      image: customizingItem.image,
      basePrice: customizingItem.basePrice,
      qty,
      options,
    });

    setCustomizingItem(null);
  }

  // Calculate modal current unit price
  const modalUnitPrice = useMemo(() => {
    if (!customizingItem) return 0;
    const cupPrice = cupSize === 'large' ? 6000 : 0;
    const mPrice = milk === 'oat' ? 10000 : 0;
    return customizingItem.basePrice + cupPrice + mPrice;
  }, [customizingItem, cupSize, milk]);

  return (
    <div className="min-h-screen bg-[#EEF2F6] flex justify-center items-center p-0 sm:p-4 text-[#0F172A] font-lp-sans antialiased">
      {/* Phone container frame */}
      <div className="w-full max-w-[440px] bg-[#FAF9F6] min-h-screen sm:min-h-[854px] sm:max-h-[920px] sm:rounded-[36px] shadow-2xl overflow-y-auto relative flex flex-col border border-slate-200/80">
        
        {/* ================= 1. TOP HEADER BAR ================= */}
        <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200/60">
          {/* Top Phone Status Bar Simulation */}
          <div className="px-5 pt-3 pb-1 flex justify-between items-center text-[11px] font-semibold text-stone-500">
            <span className="font-lp-mono text-xs text-stone-700">12:38</span>
            <div className="flex items-center gap-1.5">
              <Icon name="signal_cellular_alt" className="text-sm" />
              <Icon name="wifi" className="text-sm" />
              <Icon name="battery_full" className="text-sm" />
            </div>
          </div>

          {/* Cafe Profile & Table Info */}
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-lp-primary text-white flex items-center justify-center shadow-xs">
                <Icon name="spa" className="text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h1 className="font-extrabold text-sm text-[#0F172A] leading-tight">
                    TUMBUH Coffee &amp; Eatery
                  </h1>
                  <Icon name="verified" className="text-emerald-600 text-sm" />
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  Senopati Flagship · Jakarta Selatan
                </p>
              </div>
            </div>

            {/* Table Badge Pill */}
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-lp-primary text-[11px] font-bold shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {tableName}
              </span>
              <span className="text-[10px] text-stone-600 font-semibold mt-0.5">
                Dine In ({tableArea})
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-2.5">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-stone-400 text-base pointer-events-none">
                <Icon name="search" className="text-base" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kopi, makanan, atau pastry..."
                className="w-full pl-9 pr-9 py-2 bg-white rounded-xl border border-stone-200 text-xs text-[#0F172A] placeholder-stone-400 focus:outline-none focus:border-lp-primary focus:ring-1 focus:ring-lp-primary shadow-xs transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  <Icon name="close" className="text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills (Horizontal Scroll) */}
          <div className="px-4 pb-2.5 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full flex-shrink-0 transition flex items-center gap-1 ${
                    isActive
                      ? 'bg-lp-primary text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.id === 'all' && (
                    <span className="text-[10px] bg-white/25 px-1.5 py-0.2 rounded-full font-lp-mono">
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* ================= 2. MAIN CONTENT AREA ================= */}
        <main className="flex-1 px-4 py-3 space-y-4 pb-36">
          {/* Promo Banner Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-emerald-50/60 to-white border border-amber-200/80 shadow-xs relative overflow-hidden flex items-center justify-between">
            <div className="pr-2 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[10px] tracking-wide uppercase">
                  Promo Meja
                </span>
                <span className="text-[10px] font-bold text-emerald-800">Hemat 15%</span>
              </div>
              <p className="text-xs font-bold text-[#0F172A] leading-tight pt-0.5">
                Diskon 15% Khusus Order dari Meja!
              </p>
              <p className="text-[10px] text-stone-500">
                Gunakan voucher{' '}
                <span className="font-lp-mono font-bold text-lp-primary bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                  TUMBUHMEJA
                </span>{' '}
                saat bayar
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Icon name="loyalty" className="text-2xl" />
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                Menu Paling Difavoritkan
              </h2>
              <p className="text-[11px] text-stone-600">
                Pilihan terpopuler tamu meja garden hari ini
              </p>
            </div>
            <span className="text-[11px] font-bold text-lp-primary flex items-center">
              {filteredMenu.length} Pilihan
            </span>
          </div>

          {/* Product Cards Feed */}
          <div className="space-y-3.5">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-xs hover:border-lp-primary/50 transition-all flex gap-3.5"
              >
                {/* Thumbnail */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.badge && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-lp-primary text-white text-[9px] font-extrabold uppercase tracking-tight shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0F172A] leading-tight">
                      {item.name}
                    </h3>

                    {/* Rating & Order Count */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="flex items-center text-amber-500 text-[11px] font-bold">
                        <Icon name="star" className="text-[13px] mr-0.5 text-amber-500" />
                        {item.rating}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-[11px] text-stone-500 font-medium">
                        {item.soldCount}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100">
                    <span className="font-lp-mono font-extrabold text-sm text-[#0F172A]">
                      {formatIDR(item.basePrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openCustomizer(item)}
                      className="px-3.5 py-1.5 rounded-full bg-lp-primary hover:bg-lp-primary/90 text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1"
                    >
                      <Icon name="add" className="text-sm" />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Service Tips */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 text-[11px] text-stone-500 space-y-1.5">
            <div className="flex items-center gap-1.5 text-stone-700 font-bold text-xs">
              <Icon name="room_service" className="text-lp-primary text-base" />
              <span>Pesanan Langsung Terkirim ke Bar &amp; Dapur</span>
            </div>
            <p className="leading-relaxed text-stone-600">
              Waiter akan mengantarkan pesanan langsung ke{' '}
              <strong className="text-[#0F172A]">{tableName}</strong>. Tidak perlu antre di kasir depan.
            </p>
          </div>
        </main>

        {/* ================= 3. CUSTOMIZER BOTTOM SHEET DRAWER ================= */}
        {customizingItem && (
          <>
            {/* Dim Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity"
              onClick={() => setCustomizingItem(null)}
            />

            {/* Bottom Sheet Modal */}
            <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[32px] shadow-2xl z-50 max-h-[85%] flex flex-col overflow-hidden border-t border-stone-100 animate-in slide-in-from-bottom duration-200">
              {/* Handle */}
              <div className="w-full pt-3 pb-1 flex justify-center items-center">
                <div className="w-12 h-1.5 rounded-full bg-stone-300" />
              </div>

              {/* Header */}
              <div className="px-5 py-2.5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customizingItem.image}
                    alt={customizingItem.name}
                    className="w-12 h-12 rounded-xl object-cover border border-stone-200 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-[#0F172A]">
                        Kustomisasi Pesanan
                      </h3>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                        Wajib
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 font-medium">
                      {customizingItem.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomizingItem(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition"
                >
                  <Icon name="close" className="text-base" />
                </button>
              </div>

              {/* Options Form Body */}
              <div className="px-5 py-3 overflow-y-auto space-y-4 text-xs flex-1">
                {/* 1. Cup Size (if allowed) */}
                {customizingItem.allowsCupSize && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-stone-800">Pilih Ukuran Cup</span>
                      <span className="text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                        Pilih 1
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCupSize('regular')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          cupSize === 'regular'
                            ? 'border-lp-primary bg-emerald-50/50 border-2 font-bold text-[#0F172A]'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <span>Regular (12oz)</span>
                        <span className="text-[10px] text-stone-500 font-lp-mono">Bawaan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCupSize('large')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          cupSize === 'large'
                            ? 'border-lp-primary bg-emerald-50/50 border-2 font-bold text-[#0F172A]'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <span>Large (16oz)</span>
                        <span className="text-[11px] text-lp-primary font-lp-mono font-bold">
                          +Rp 6.000
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Milk Options (if allowed) */}
                {customizingItem.allowsMilk && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-stone-800">Pilihan Susu</span>
                      <span className="text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                        Pilih 1
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMilk('fresh')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          milk === 'fresh'
                            ? 'border-lp-primary bg-emerald-50/50 border-2 font-bold text-[#0F172A]'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <span>Fresh Milk</span>
                        <span className="text-[10px] text-stone-500 font-lp-mono">Standar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMilk('oat')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          milk === 'oat'
                            ? 'border-lp-primary bg-emerald-50/50 border-2 font-bold text-[#0F172A]'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <span>Oat Milk (Oatside)</span>
                        <span className="text-[11px] text-lp-primary font-lp-mono font-bold">
                          +Rp 10.000
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Sugar & Ice Level */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-stone-800 block mb-1.5">Tingkat Manis</span>
                    <div className="space-y-1.5">
                      {(['normal', 'less', 'none'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSugar(s)}
                          className={`w-full text-left p-2 rounded-lg border text-xs transition ${
                            sugar === s
                              ? 'bg-emerald-50/70 border-lp-primary border-2 font-bold text-lp-primary'
                              : 'bg-stone-50 border-stone-200 text-stone-700'
                          }`}
                        >
                          {s === 'normal'
                            ? 'Normal Aren (100%)'
                            : s === 'less'
                              ? 'Less Sugar (50%)'
                              : 'No Sugar (0%)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-stone-800 block mb-1.5">Kepadatan Es</span>
                    <div className="space-y-1.5">
                      {(['normal', 'less', 'none'] as const).map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIce(i)}
                          className={`w-full text-left p-2 rounded-lg border text-xs transition ${
                            ice === i
                              ? 'bg-emerald-50/70 border-lp-primary border-2 font-bold text-lp-primary'
                              : 'bg-stone-50 border-stone-200 text-stone-700'
                          }`}
                        >
                          {i === 'normal'
                            ? 'Normal Ice'
                            : i === 'less'
                              ? 'Less Ice'
                              : 'No Ice / Dingin'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Notes */}
                <div>
                  <label className="font-bold text-stone-800 flex items-center justify-between mb-1">
                    <span>Catatan Khusus (Opsional)</span>
                    <span className="text-[10px] text-stone-400 font-normal">Maks 60 Karakter</span>
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Pisah es batu, sedotan kertas ya kak"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-lp-primary focus:ring-1 focus:ring-lp-primary text-stone-800"
                    maxLength={60}
                  />
                </div>
              </div>

              {/* Action Bottom */}
              <div className="p-4 border-t border-stone-100 bg-[#FAF9F6] flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="w-9 text-center font-lp-mono font-bold text-sm text-[#0F172A]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="w-8 h-8 rounded-lg bg-lp-primary hover:bg-lp-primary/90 text-white flex items-center justify-center font-bold text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Add To Cart */}
                <button
                  type="button"
                  onClick={handleAddCustomizedItem}
                  className="flex-1 py-3 px-4 rounded-xl bg-lp-primary hover:bg-lp-primary/90 text-white font-extrabold text-xs shadow-md active:scale-98 transition flex items-center justify-between"
                >
                  <span>Tambahkan Pesanan</span>
                  <span className="font-lp-mono text-sm">
                    {formatIDR(modalUnitPrice * qty)}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================= 4. STICKY FLOATING CART BAR ================= */}
        {lines.length > 0 && (
          <div className="fixed sm:absolute bottom-3 inset-x-3 z-30 pointer-events-auto">
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-emerald-400/30 flex items-center justify-between backdrop-blur-md">
              {/* Left Cart Info */}
              <div className="flex items-center gap-3 pl-1">
                <div className="relative w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20">
                  <Icon name="shopping_bag" className="text-xl" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-900 font-extrabold text-[10px] flex items-center justify-center shadow-xs font-lp-mono">
                    {cartItemCount}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-200 font-semibold tracking-wide uppercase">
                    Total Pesanan {tableName}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-lp-mono font-extrabold text-base text-white tracking-tight">
                      {formatIDR(cartTotal)}
                    </span>
                    <span className="text-[10px] text-emerald-300 line-through font-lp-mono">
                      {formatIDR(regularTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right CTA */}
              <button
                type="button"
                onClick={() => router.push(`/order/${tableParam}/status`)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-extrabold text-xs shadow-sm active:scale-95 transition"
              >
                <span>Lihat Keranjang</span>
                <Icon name="arrow_forward" className="text-sm font-bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
