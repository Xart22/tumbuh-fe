'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';
import { formatIDR } from '@/lib/format';
import {
  useTableStore,
  type TableArea,
  type TableItem,
} from '@/stores/table-store';

const AREAS: Array<{ id: TableArea; label: string; icon: string }> = [
  { id: 'all', label: 'Semua Area', icon: 'apps' },
  { id: 'indoor', label: 'Main Dining Hall (Indoor AC)', icon: 'meeting_room' },
  { id: 'outdoor', label: 'Outdoor Terrace & Smoking', icon: 'deck' },
  { id: 'vip', label: 'VIP Meeting Room', icon: 'stars' },
  { id: 'bar', label: 'Bar Counter', icon: 'local_bar' },
];

export default function TablesPage() {
  const router = useRouter();

  const tables = useTableStore((s) => s.tables);
  const selectedTableId = useTableStore((s) => s.selectedTableId);
  const activeArea = useTableStore((s) => s.activeArea);
  const filterStatus = useTableStore((s) => s.filterStatus);
  const searchQuery = useTableStore((s) => s.searchQuery);

  const selectTable = useTableStore((s) => s.selectTable);
  const setActiveArea = useTableStore((s) => s.setActiveArea);
  const setFilterStatus = useTableStore((s) => s.setFilterStatus);
  const setSearchQuery = useTableStore((s) => s.setSearchQuery);
  const updateTableStatus = useTableStore((s) => s.updateTableStatus);

  const [canvasZoom, setCanvasZoom] = useState<number>(100);
  const [mode, setMode] = useState<'live' | 'edit'>('live');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Selected Table details
  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) || tables[0] || null,
    [tables, selectedTableId],
  );

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (activeArea !== 'all' && t.area !== activeArea) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = t.code.toLowerCase().includes(q);
        const matchName = t.name.toLowerCase().includes(q);
        const matchGuest = t.guestName?.toLowerCase().includes(q);
        const matchOrder = t.orderNumber?.toLowerCase().includes(q);
        return matchCode || matchName || matchGuest || matchOrder;
      }
      return true;
    });
  }, [tables, activeArea, filterStatus, searchQuery]);

  // Operational KPI calculation
  const totalTablesCount = tables.length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const waitingBillCount = tables.filter((t) => t.status === 'waiting_bill').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;

  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
  const activePax = tables.reduce((s, t) => s + (t.pax || 0), 0);
  const occupancyRate = (
    ((occupiedCount + waitingBillCount) / totalTablesCount) *
    100
  ).toFixed(1);

  const totalActiveBillAmount = tables.reduce(
    (s, t) => s + (t.totalBill || 0),
    0,
  );

  function triggerNotice(msg: string) {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  }

  function handlePrintBill(table: TableItem) {
    triggerNotice(`Mencetak Struk Tagihan Sementara untuk ${table.name}...`);
  }

  function handleOpenInPos(table: TableItem) {
    router.push(`/pos?table=${encodeURIComponent(table.code)}`);
  }

  return (
    <div className="space-y-6 pb-12">
        {/* ================= BREADCRUMB & TOP HEADER ================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-lp-on-surface-variant font-medium">
              <span>Operasional</span>
              <span>/</span>
              <span className="font-semibold text-lp-on-surface">
                Denah Meja &amp; Manajemen Area (Floor Plan)
              </span>
              <span>/</span>
              <span className="font-lp-mono font-bold text-lp-primary bg-lp-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                #AREA-T-01
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-lp-on-surface tracking-tight font-lp-sans">
                Denah Meja &amp; Status Area (Floor Plan)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lp-primary/10 text-lp-primary border border-lp-primary/20 font-lp-mono">
                Kapasitas: {totalSeats} Kursi ({totalTablesCount} Meja)
              </span>
            </div>
            <p className="mt-1 text-xs text-lp-on-surface-variant max-w-3xl leading-relaxed">
              Pantau ketersediaan meja secara visual real-time, durasi tamu dine-in, status
              penagihan bill, serta integrasi pemesanan langsung dari denah.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Switcher */}
            <div className="flex items-center p-1 bg-lp-surface-container rounded-xl border border-lp-outline-variant/30 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  mode === 'live'
                    ? 'bg-lp-surface-container-lowest text-lp-primary shadow-xs font-bold'
                    : 'text-lp-on-surface-variant hover:text-lp-on-surface'
                }`}
              >
                <Icon name="visibility" className="text-sm text-lp-primary" />
                <span>Mode Kasir (Live)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  mode === 'edit'
                    ? 'bg-lp-surface-container-lowest text-lp-primary shadow-xs font-bold'
                    : 'text-lp-on-surface-variant hover:text-lp-on-surface'
                }`}
              >
                <Icon name="edit_attributes" className="text-sm" />
                <span>Edit Layout Denah</span>
              </button>
            </div>

            {/* Quick Actions */}
            <button
              type="button"
              onClick={() => triggerNotice('Modal Buat Reservasi Meja Baru dibuka')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-lp-on-surface bg-lp-surface-container-lowest border border-lp-outline-variant/40 rounded-xl hover:bg-lp-surface-container transition shadow-xs"
            >
              <Icon name="event_available" className="text-base text-purple-600" />
              <span>+ Reservasi Meja</span>
            </button>

            <button
              type="button"
              onClick={() => triggerNotice('Modal Tambah Meja / Area Baru dibuka')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-lp-primary hover:bg-lp-primary/90 rounded-xl shadow-xs transition"
            >
              <Icon name="add_circle" className="text-base" />
              <span>+ Tambah Meja</span>
            </button>
          </div>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Icon name="check_circle" className="text-base" />
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-white/80 hover:text-white"
            >
              <Icon name="close" className="text-sm" />
            </button>
          </div>
        )}

        {/* ================= 4 KARTU KPI OKUPANSI MEJA ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Okupansi */}
          <div className="bg-lp-surface-container-lowest p-4 rounded-2xl border border-lp-outline-variant/30 shadow-xs flex flex-col justify-between border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-lp-on-surface-variant">
                Tingkat Okupansi Meja
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-lp-primary flex items-center justify-center">
                <Icon name="pie_chart" className="text-lg" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-lp-on-surface font-lp-mono">
                  {occupancyRate}%
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-lp-mono">
                  {occupiedCount + waitingBillCount} / {totalTablesCount} Meja
                </span>
              </div>
              <p className="text-[11px] text-lp-on-surface-variant mt-1">
                <strong className="text-lp-on-surface">{activePax} tamu</strong> saat
                ini sedang santap dine-in
              </p>
            </div>
          </div>

          {/* Card 2: Meja Kosong */}
          <div className="bg-lp-surface-container-lowest p-4 rounded-2xl border border-lp-outline-variant/30 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-lp-on-surface-variant">
                Meja Kosong (Tersedia)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Icon name="event_seat" className="text-lg" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-emerald-800 font-lp-mono">
                {availableCount} Meja
              </h3>
              <p className="text-[11px] text-lp-on-surface-variant mt-1">
                <span className="text-emerald-700 font-semibold">14 Kursi Siap</span> untuk
                tamu walk-in
              </p>
            </div>
          </div>

          {/* Card 3: Menunggu Pembayaran */}
          <div className="bg-lp-surface-container-lowest p-4 rounded-2xl border border-lp-outline-variant/30 shadow-xs flex flex-col justify-between border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-lp-on-surface-variant">
                Menunggu Pembayaran (Bill Out)
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                <Icon name="receipt_long" className="text-lg" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-amber-900 font-lp-mono">
                  {waitingBillCount} Meja
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-lp-mono">
                  Perhatian Kasir
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Total tagihan aktif:{' '}
                <span className="font-lp-mono font-bold">
                  {formatIDR(totalActiveBillAmount)}
                </span>
              </p>
            </div>
          </div>

          {/* Card 4: Reservasi Hari Ini */}
          <div className="bg-lp-surface-container-lowest p-4 rounded-2xl border border-lp-outline-variant/30 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-lp-on-surface-variant">
                Reservasi Hari Ini
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Icon name="book_online" className="text-lg" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-purple-900 font-lp-mono">
                {reservedCount} Jadwal
              </h3>
              <p className="text-[11px] text-purple-700 mt-1">
                <strong className="font-bold">2 Meja</strong> siap dibooking mulai 19:30
                WIB
              </p>
            </div>
          </div>
        </div>

        {/* ================= TOOLBAR TAB AREA & LEGEND BAR ================= */}
        <div className="bg-lp-surface-container-lowest p-4 rounded-2xl border border-lp-outline-variant/30 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Area Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
              {AREAS.map((area) => {
                const isActive = activeArea === area.id;
                const count =
                  area.id === 'all'
                    ? tables.length
                    : tables.filter((t) => t.area === area.id).length;

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setActiveArea(area.id)}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 flex-shrink-0 transition ${
                      isActive
                        ? 'bg-lp-primary text-white shadow-xs font-bold'
                        : 'bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface'
                    }`}
                  >
                    <Icon name={area.icon} className="text-sm" />
                    <span>{area.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-lp-mono ${
                        isActive
                          ? 'bg-white/20 text-white font-bold'
                          : 'bg-lp-surface-container text-lp-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Canvas Controls */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              {/* Search Bar */}
              <div className="relative w-56">
                <span className="absolute left-3 top-2 text-lp-on-surface-variant/60 pointer-events-none">
                  <Icon name="search" className="text-sm" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari meja, no. order..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-lp-surface-low border border-lp-outline-variant/40 rounded-xl focus:outline-none focus:border-lp-primary text-lp-on-surface placeholder:text-lp-on-surface-variant/50"
                />
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center bg-lp-surface-low border border-lp-outline-variant/40 rounded-xl p-0.5 text-xs text-lp-on-surface">
                <button
                  type="button"
                  onClick={() => setCanvasZoom((z) => Math.max(70, z - 10))}
                  className="p-1 hover:bg-lp-surface-container rounded-lg transition"
                  title="Zoom Out"
                >
                  <Icon name="remove" className="text-sm" />
                </button>
                <span className="px-2 font-lp-mono text-[11px] font-bold text-lp-on-surface">
                  {canvasZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setCanvasZoom((z) => Math.min(130, z + 10))}
                  className="p-1 hover:bg-lp-surface-container rounded-lg transition"
                  title="Zoom In"
                >
                  <Icon name="add" className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Legend Bar */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-lp-outline-variant/20 gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[11px] font-bold text-lp-on-surface-variant uppercase tracking-wider">
                Status Meja:
              </span>

              <button
                type="button"
                onClick={() =>
                  setFilterStatus(filterStatus === 'available' ? 'all' : 'available')
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
                  filterStatus === 'available' ? 'bg-emerald-50 border border-emerald-300' : ''
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></span>
                <span className="font-medium text-lp-on-surface">
                  Tersedia / Kosong{' '}
                  <strong className="font-lp-mono text-emerald-800">
                    ({availableCount})
                  </strong>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilterStatus(filterStatus === 'occupied' ? 'all' : 'occupied')
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
                  filterStatus === 'occupied' ? 'bg-sky-50 border border-sky-300' : ''
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-sky-500 border border-sky-600"></span>
                <span className="font-medium text-lp-on-surface">
                  Terisi / Santap{' '}
                  <strong className="font-lp-mono text-sky-800">({occupiedCount})</strong>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilterStatus(
                    filterStatus === 'waiting_bill' ? 'all' : 'waiting_bill',
                  )
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
                  filterStatus === 'waiting_bill'
                    ? 'bg-amber-50 border border-amber-300'
                    : ''
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600 animate-pulse"></span>
                <span className="font-medium text-lp-on-surface">
                  Menunggu Bayar (Bill){' '}
                  <strong className="font-lp-mono text-amber-800">
                    ({waitingBillCount})
                  </strong>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilterStatus(filterStatus === 'reserved' ? 'all' : 'reserved')
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
                  filterStatus === 'reserved' ? 'bg-purple-50 border border-purple-300' : ''
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-purple-500 border border-purple-600"></span>
                <span className="font-medium text-lp-on-surface">
                  Reservasi Booking{' '}
                  <strong className="font-lp-mono text-purple-800">
                    ({reservedCount})
                  </strong>
                </span>
              </button>
            </div>

            <div className="text-[11px] text-lp-on-surface-variant flex items-center gap-1">
              <Icon name="touch_app" className="text-sm text-lp-primary" />
              <span>Klik kartu meja untuk melihat rincian order &amp; tagihan</span>
            </div>
          </div>
        </div>

        {/* ================= 2-COLUMN SPLIT WORKSPACE ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: CANVAS DENAH MEJA 2D (xl:col-span-7) */}
          <div className="xl:col-span-7 bg-lp-surface-container-lowest rounded-2xl border border-lp-outline-variant/30 shadow-xs overflow-hidden flex flex-col min-h-[660px]">
            {/* Canvas Header */}
            <div className="px-5 py-3 border-b border-lp-outline-variant/25 flex items-center justify-between bg-lp-surface-low/60">
              <div className="flex items-center gap-2">
                <Icon name="architecture" className="text-lp-primary text-base" />
                <h2 className="text-xs font-bold text-lp-on-surface uppercase tracking-wider">
                  Layout Denah:{' '}
                  {activeArea === 'all'
                    ? 'Semua Area Terdaftar'
                    : AREAS.find((a) => a.id === activeArea)?.label}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-lp-on-surface-variant">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{filteredTables.length} Meja Ditampilkan</span>
              </div>
            </div>

            {/* Canvas Content Grid */}
            <div
              className="p-6 flex-1 relative overflow-auto bg-[#F8FAFC]/60"
              style={{
                backgroundImage:
                  'radial-gradient(#CBD5E1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                transform: `scale(${canvasZoom / 100})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Landmark Atas: Pintu Masuk & Kasir Barista */}
              <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                <div className="px-4 py-2 bg-lp-surface-container/70 border-2 border-dashed border-lp-outline-variant rounded-xl text-xs font-bold text-lp-on-surface-variant flex items-center gap-2 shadow-2xs">
                  <Icon name="door_front" className="text-base text-slate-500" />
                  <span>[ Pintu Masuk Utama ]</span>
                </div>

                <div className="px-5 py-2.5 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl text-xs font-bold text-emerald-950 flex items-center gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-lp-primary text-white flex items-center justify-center">
                    <Icon name="coffee_maker" className="text-base" />
                  </div>
                  <div>
                    <p className="leading-tight">[ Kasir &amp; Barista Station ]</p>
                    <p className="text-[10px] text-emerald-700 font-normal">
                      POS Terminal 01 &amp; Espresso Machine
                    </p>
                  </div>
                </div>
              </div>

              {/* Meja Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {filteredTables.map((table) => {
                  const isSelected = selectedTable?.id === table.id;
                  const isOccupied = table.status === 'occupied';
                  const isWaitingBill = table.status === 'waiting_bill';
                  const isReserved = table.status === 'reserved';
                  const isAvailable = table.status === 'available';

                  let borderClass = 'border-lp-outline-variant/40 bg-white';
                  let statusBadgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                  let statusLabel = 'Tersedia';

                  if (isAvailable) {
                    borderClass = 'border-emerald-300 hover:border-emerald-500 bg-white';
                    statusBadgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    statusLabel = `Tersedia (${table.capacity} Pax)`;
                  } else if (isOccupied) {
                    borderClass = 'border-sky-400 bg-white shadow-xs';
                    statusBadgeBg = 'bg-sky-50 text-sky-700 border-sky-200';
                    statusLabel = `Terisi (${table.pax || table.capacity} Pax)`;
                  } else if (isWaitingBill) {
                    borderClass = 'border-2 border-amber-500 bg-amber-50/40 shadow-sm';
                    statusBadgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
                    statusLabel = 'Menunggu Bayar';
                  } else if (isReserved) {
                    borderClass = 'border-purple-300 bg-purple-50/30';
                    statusBadgeBg = 'bg-purple-100 text-purple-800 border-purple-200';
                    statusLabel = 'Reservasi';
                  }

                  const selectedRing = isSelected
                    ? 'ring-2 ring-lp-primary ring-offset-2 shadow-md'
                    : '';

                  return (
                    <div
                      key={table.id}
                      onClick={() => selectTable(table.id)}
                      className={`rounded-2xl border p-3.5 transition cursor-pointer flex flex-col justify-between relative ${borderClass} ${selectedRing} ${
                        table.shape === 'communal' ? 'md:col-span-2' : ''
                      }`}
                    >
                      {isWaitingBill && (
                        <div className="absolute -top-2.5 right-3 bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1 font-lp-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                          Minta Bill
                        </div>
                      )}

                      <div>
                        {/* Table Header Row */}
                        <div className="flex items-center justify-between border-b border-lp-outline-variant/20 pb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isAvailable
                                  ? 'bg-emerald-500'
                                  : isOccupied
                                    ? 'bg-sky-500'
                                    : isWaitingBill
                                      ? 'bg-amber-500'
                                      : 'bg-purple-500'
                              }`}
                            />
                            <span className="font-extrabold text-sm text-lp-on-surface">
                              {table.code}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-lp-mono ${statusBadgeBg}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {/* Middle Content */}
                        {isAvailable ? (
                          <div className="my-5 flex flex-col items-center justify-center text-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
                              <Icon name="check" className="text-base" />
                            </div>
                            <p className="text-xs font-bold text-emerald-800">
                              Meja Bersih &amp; Siap
                            </p>
                            <p className="text-[11px] text-lp-on-surface-variant">
                              Kapasitas {table.capacity} Kursi
                            </p>
                          </div>
                        ) : isReserved ? (
                          <div className="my-3 space-y-1 text-xs">
                            <div className="flex justify-between items-center text-purple-950 font-bold">
                              <span className="flex items-center gap-1">
                                <Icon name="person" className="text-xs text-purple-600" />
                                {table.guestName}
                              </span>
                              <span className="font-lp-mono text-[11px] bg-purple-100 px-1.5 py-0.5 rounded">
                                {table.pax} Pax
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-lp-on-surface-variant">
                              <span>Jadwal Tiba:</span>
                              <span className="font-lp-mono font-bold text-purple-900 bg-white px-1.5 py-0.2 rounded border border-purple-200">
                                {table.reservationSchedule}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-purple-200/60">
                              <span className="text-[11px] text-slate-500">DP Booking:</span>
                              <span className="font-lp-mono font-bold text-emerald-700 text-xs">
                                {formatIDR(table.depositAmount || 0)} (Lunas)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="my-3 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-lp-on-surface">
                              <span className="flex items-center gap-1 font-semibold">
                                <Icon name="person" className="text-xs text-slate-500" />
                                {table.guestName}
                              </span>
                              <span className="font-lp-mono text-[10px] text-lp-on-surface-variant bg-lp-surface-low px-1.5 py-0.5 rounded border border-lp-outline-variant/30">
                                {table.orderNumber}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-lp-on-surface-variant">
                              <span className="flex items-center gap-1">
                                <Icon
                                  name="schedule"
                                  className={`text-xs ${
                                    isWaitingBill ? 'text-amber-600' : 'text-sky-600'
                                  }`}
                                />
                                Durasi Duduk:
                              </span>
                              <span
                                className={`font-lp-mono font-bold ${
                                  isWaitingBill ? 'text-amber-800' : 'text-sky-700'
                                }`}
                              >
                                {table.durationMinutes}m
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-lp-outline-variant/20">
                              <span className="text-lp-on-surface-variant">Total Tagihan:</span>
                              <span className="font-lp-mono font-bold text-lp-on-surface">
                                {formatIDR(table.totalBill || 0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Seat Dots Bottom Indicator */}
                      <div className="flex justify-center gap-1.5 pt-2 border-t border-lp-outline-variant/20">
                        {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                          const isOccupiedSeat =
                            (table.pax || 0) > seatIdx ||
                            (isOccupied && seatIdx < (table.pax || table.capacity));

                          return (
                            <span
                              key={seatIdx}
                              className={`w-3.5 h-1.5 rounded-full ${
                                isAvailable
                                  ? 'bg-emerald-400'
                                  : isOccupiedSeat
                                    ? isWaitingBill
                                      ? 'bg-amber-500'
                                      : 'bg-sky-400'
                                    : 'bg-slate-300'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Landmark Bawah: Akses Dapur & Restroom */}
              <div className="mt-8 flex items-center justify-between pt-4 border-t-2 border-dashed border-lp-outline-variant/40 flex-wrap gap-3">
                <Link
                  href="/kds"
                  className="px-4 py-1.5 bg-lp-surface-container/70 hover:bg-lp-surface-container rounded-xl text-xs font-bold text-lp-on-surface-variant flex items-center gap-2 transition"
                >
                  <Icon name="restaurant" className="text-sm text-lp-primary" />
                  <span>[ Akses Dapur &amp; Kitchen Display System (KDS) → ]</span>
                </Link>
                <div className="px-4 py-1.5 bg-lp-surface-container/70 rounded-xl text-xs font-bold text-lp-on-surface-variant flex items-center gap-2">
                  <Icon name="wc" className="text-sm text-slate-500" />
                  <span>[ Restroom &amp; Musholla ]</span>
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: SLIDE-OVER DETAIL DRAWER MEJA TERPILIH (xl:col-span-5) */}
          <div className="xl:col-span-5 bg-lp-surface-container-lowest rounded-2xl border border-lp-outline-variant/30 shadow-xs overflow-hidden flex flex-col sticky top-4">
            {selectedTable ? (
              <>
                {/* Header Profil Meja */}
                <div className="p-5 border-b border-lp-outline-variant/25 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-lg shadow-sm font-lp-mono ${
                          selectedTable.status === 'available'
                            ? 'bg-emerald-600'
                            : selectedTable.status === 'occupied'
                              ? 'bg-sky-600'
                              : selectedTable.status === 'waiting_bill'
                                ? 'bg-amber-500'
                                : 'bg-purple-600'
                        }`}
                      >
                        {selectedTable.code}
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-lp-on-surface">
                          {selectedTable.name} • {selectedTable.areaLabel}
                        </h2>
                        <p className="text-xs text-lp-on-surface-variant mt-0.5">
                          Kapasitas:{' '}
                          <strong className="font-bold text-lp-on-surface">
                            {selectedTable.capacity} Orang
                          </strong>{' '}
                          • Meja Bersih
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 font-lp-mono ${
                        selectedTable.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : selectedTable.status === 'occupied'
                            ? 'bg-sky-100 text-sky-800 border-sky-300'
                            : selectedTable.status === 'waiting_bill'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-purple-100 text-purple-800 border-purple-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                      {selectedTable.status === 'available'
                        ? 'Tersedia'
                        : selectedTable.status === 'occupied'
                          ? 'Sedang Santap'
                          : selectedTable.status === 'waiting_bill'
                            ? 'Menunggu Bayar'
                            : 'Reservasi'}
                    </span>
                  </div>

                  {/* Sesi Dine-In Metadata */}
                  {selectedTable.status !== 'available' && (
                    <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/90 border border-lp-outline-variant/30 text-[11px]">
                      <div>
                        <p className="text-slate-400">Tamu &amp; Jumlah:</p>
                        <p className="font-bold text-slate-800">
                          {selectedTable.guestName || 'Tamu'} ({selectedTable.pax || 2} Pax)
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Waktu Mulai:</p>
                        <p className="font-lp-mono font-semibold text-slate-800">
                          {selectedTable.startTime || '19:15 WIB'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Durasi Duduk:</p>
                        <p className="font-lp-mono font-bold text-amber-800">
                          {selectedTable.durationMinutes || 45}m
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedTable.cashierName && (
                    <div className="mt-2 text-[11px] text-lp-on-surface-variant flex items-center justify-between">
                      <span>
                        Kasir Bertugas:{' '}
                        <strong className="text-lp-on-surface">
                          {selectedTable.cashierName}
                        </strong>
                      </span>
                      <span className="font-lp-mono bg-lp-surface-low px-1.5 py-0.5 rounded text-[10px] border border-lp-outline-variant/20">
                        {selectedTable.orderNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* Section: Rincian Pesanan Aktif */}
                {selectedTable.items && selectedTable.items.length > 0 ? (
                  <div className="p-5 space-y-4 max-h-[calc(100vh-480px)] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-lp-on-surface uppercase tracking-wide flex items-center gap-1.5">
                        <Icon name="receipt" className="text-sm text-lp-primary" />
                        Daftar Item Pesanan ({selectedTable.items.length} Menu)
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Siap &amp; Disajikan Semua
                      </span>
                    </div>

                    {/* List Items */}
                    <div className="space-y-2 text-xs">
                      {selectedTable.items.map((it) => (
                        <div
                          key={it.id}
                          className="p-2.5 rounded-xl border border-lp-outline-variant/25 bg-lp-surface-low/50 flex items-start justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-lp-on-surface font-lp-mono">
                                {it.qty}x
                              </span>
                              <p className="font-bold text-lp-on-surface">{it.name}</p>
                            </div>
                            {it.notes && (
                              <p className="text-[10px] text-lp-on-surface-variant pl-5">
                                {it.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-lp-mono font-bold text-lp-on-surface">
                              {formatIDR(it.price * it.qty)}
                            </span>
                            <p className="text-[10px] text-slate-400">{it.stationTag}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown Tagihan & Pajak */}
                    <div className="p-3.5 rounded-xl bg-lp-surface-low border border-lp-outline-variant/30 space-y-2">
                      <div className="flex justify-between text-xs text-lp-on-surface-variant">
                        <span>Subtotal F&amp;B:</span>
                        <span className="font-lp-mono font-semibold text-lp-on-surface">
                          {formatIDR(selectedTable.subtotal || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-lp-on-surface-variant">
                        <span>Service Charge (5%):</span>
                        <span className="font-lp-mono text-lp-on-surface">
                          {formatIDR(selectedTable.serviceCharge || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-lp-on-surface-variant pb-2 border-b border-lp-outline-variant/25">
                        <span>PB1 / Pajak Restoran (10%):</span>
                        <span className="font-lp-mono text-lp-on-surface">
                          {formatIDR(selectedTable.tax || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-xs font-bold text-lp-on-surface">
                          TOTAL TAGIHAN:
                        </span>
                        <span className="text-lg font-lp-mono font-black text-amber-950">
                          {formatIDR(selectedTable.totalBill || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Modify Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenInPos(selectedTable)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-lp-outline-variant/40 text-lp-on-surface hover:bg-lp-surface-low text-xs font-semibold transition shadow-2xs"
                      >
                        <Icon name="add_shopping_cart" className="text-sm text-lp-primary" />
                        <span>+ Tambah Order</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedTable.status === 'occupied') {
                            updateTableStatus(selectedTable.id, 'waiting_bill');
                            triggerNotice(`Status ${selectedTable.name} diubah ke Minta Bill`);
                          } else {
                            updateTableStatus(selectedTable.id, 'available');
                            triggerNotice(`${selectedTable.name} dibersihkan & siap digunakan`);
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-lp-outline-variant/40 text-lp-on-surface hover:bg-lp-surface-low text-xs font-semibold transition shadow-2xs"
                      >
                        <Icon
                          name={selectedTable.status === 'occupied' ? 'receipt' : 'cleaning_services'}
                          className="text-sm text-slate-500"
                        />
                        <span>{selectedTable.status === 'occupied' ? 'Tandai Minta Bill' : 'Selesai Bersih'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-lp-primary flex items-center justify-center">
                      <Icon name="table_restaurant" className="text-3xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-lp-on-surface">
                        {selectedTable.status === 'reserved'
                          ? 'Meja Terjadwal Reservasi'
                          : 'Meja Saat Ini Kosong'}
                      </h4>
                      <p className="text-xs text-lp-on-surface-variant max-w-[220px] mt-1 leading-relaxed">
                        {selectedTable.status === 'reserved'
                          ? `Dipesan oleh ${selectedTable.guestName} (${selectedTable.pax} Pax) untuk jam ${selectedTable.reservationSchedule}.`
                          : 'Belum ada tamu aktif. Buka pesanan kasir baru untuk menempati meja ini.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenInPos(selectedTable)}
                      className="px-4 py-2 rounded-xl bg-lp-primary hover:bg-lp-primary/90 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Icon name="point_of_sale" className="text-sm" />
                      <span>Buka Order di Kasir POS</span>
                    </button>
                  </div>
                )}

                {/* Sticky Action Footer */}
                {selectedTable.status !== 'available' && (
                  <div className="p-4 border-t border-lp-outline-variant/25 bg-white space-y-2">
                    <button
                      type="button"
                      onClick={() => handlePrintBill(selectedTable)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-lp-surface-low hover:bg-lp-surface-container text-lp-on-surface font-bold text-xs transition border border-lp-outline-variant/30"
                    >
                      <Icon name="print" className="text-base" />
                      <span>Cetak Bill Sementara (Receipt Preview)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInPos(selectedTable)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lp-primary hover:bg-lp-primary/90 text-white font-extrabold text-xs tracking-wide shadow-md transition"
                    >
                      <Icon name="point_of_sale" className="text-base" />
                      <span>Proses Pembayaran (Kasir POS) →</span>
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
    </div>
  );
}
