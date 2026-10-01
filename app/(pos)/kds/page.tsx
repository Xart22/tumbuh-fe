'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { playKitchenChime } from '@/lib/kds-audio';
import { useAuthStore } from '@/stores/auth-store';
import {
  bumpKitchenItem,
  kitchenQueue,
  kitchenSummary,
  recallKitchenOrder,
  serveKitchenOrder,
} from '@/lib/api';
import type { KitchenQueueItem, KitchenSummary } from '@/lib/types';

const SOURCE_LABEL: Record<string, string> = {
  dine_in: 'DINE-IN',
  take_away: 'TAKE AWAY',
  delivery: 'DELIVERY',
};

const STATION_META: Record<string, { label: string; icon: string }> = {
  all: { label: 'Semua Stasiun', icon: 'restaurant_menu' },
  kitchen: { label: 'Hot Kitchen', icon: 'skillet' },
  bar: { label: 'Bar & Minuman', icon: 'local_cafe' },
  pastry: { label: 'Pastry & Bakery', icon: 'bakery_dining' },
  cold: { label: 'Cold / Salad', icon: 'nutrition' },
};

function stationMeta(station: string | null) {
  return (
    STATION_META[station ?? ''] ?? {
      label: station ?? 'Lainnya',
      icon: 'restaurant_menu',
    }
  );
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function secondsSince(iso: string | null, now: number): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
}

type KdsTicket = {
  orderId: string;
  orderNumber: string;
  source: string;
  sourceLabel: string;
  label: string;
  subMeta: string | null;
  items: KitchenQueueItem[];
};

const TARGET_MINUTES = 15;

export default function KDSPage() {
  const outletName = useAuthStore((s) => s.outletName);

  const [items, setItems] = useState<KitchenQueueItem[]>([]);
  const [summary, setSummary] = useState<KitchenSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStation, setActiveStation] = useState<string>('all');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [columnCount, setColumnCount] = useState<4 | 5>(4);
  const [now, setNow] = useState(() => Date.now());
  const [clock, setClock] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [recallStack, setRecallStack] = useState<KdsTicket[]>([]);

  const knownOrders = useRef<Set<string> | null>(null);
  const audioRef = useRef(audioEnabled);

  useEffect(() => {
    audioRef.current = audioEnabled;
  }, [audioEnabled]);

  const refresh = useCallback(async () => {
    try {
      const [queue, sum] = await Promise.all([kitchenQueue(), kitchenSummary()]);
      setItems(queue);
      setSummary(sum);
      setError(null);

      const ids = new Set(queue.map((i) => i.orderId));
      if (knownOrders.current === null) {
        knownOrders.current = ids;
      } else {
        const hasNew = [...ids].some((id) => !knownOrders.current!.has(id));
        knownOrders.current = ids;
        if (hasNew && audioRef.current) playKitchenChime();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat antrian dapur.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) void refresh();
    };
    run();
    const poll = setInterval(run, 8000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [refresh]);

  useEffect(() => {
    const tick = setInterval(() => {
      setNow(Date.now());
      const d = new Date();
      setClock(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`,
      );
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const tickets = useMemo<KdsTicket[]>(() => {
    const byOrder = new Map<string, KdsTicket>();
    for (const item of items) {
      let ticket = byOrder.get(item.orderId);
      if (!ticket) {
        const source = item.orderType;
        ticket = {
          orderId: item.orderId,
          orderNumber: item.orderNumber,
          source,
          sourceLabel: SOURCE_LABEL[source] ?? source.toUpperCase(),
          label: item.tableName || item.orderNumber,
          subMeta: item.tableName ? item.orderNumber : null,
          items: [],
        };
        byOrder.set(item.orderId, ticket);
      }
      ticket.items.push(item);
    }
    return [...byOrder.values()];
  }, [items]);

  const stations = useMemo(() => {
    const present = new Set(
      items.map((i) => i.station).filter((s): s is string => Boolean(s)),
    );
    const ids = ['all', 'kitchen', 'bar', ...[...present].filter((s) => !['kitchen', 'bar'].includes(s))];
    return [...new Set(ids)];
  }, [items]);

  const filteredTickets = useMemo(() => {
    if (activeStation === 'all') return tickets;
    return tickets.filter((t) => t.items.some((i) => i.station === activeStation));
  }, [tickets, activeStation]);

  const activeCount = tickets.length;
  const dineInCount = tickets.filter((t) => t.source === 'dine_in').length;
  const takeAwayCount = tickets.filter((t) => t.source === 'take_away').length;
  const deliveryCount = tickets.filter((t) => t.source === 'delivery').length;
  const urgentCount = tickets.filter((t) =>
    t.items.some((i) => secondsSince(i.sentToKitchenAt, now) >= TARGET_MINUTES * 60),
  ).length;

  const avgPrepSeconds = tickets.length
    ? Math.round(
        tickets.reduce(
          (sum, t) =>
            sum +
            Math.max(...t.items.map((i) => secondsSince(i.sentToKitchenAt, now))),
          0,
        ) / tickets.length,
      )
    : 0;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleBump(ticket: KdsTicket) {
    try {
      await serveKitchenOrder(ticket.orderId);
      setRecallStack((prev) => [ticket, ...prev].slice(0, 20));
      showToast(`Tiket ${ticket.orderNumber} (${ticket.label}) selesai dibump.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal bump tiket.');
    }
  }

  async function handleRecall() {
    const last = recallStack[0];
    if (!last) return;
    try {
      await recallKitchenOrder(last.orderId);
      setRecallStack((prev) => prev.slice(1));
      showToast(`Tiket ${last.orderNumber} dikembalikan ke antrian.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal recall tiket.');
    }
  }

  async function handleItemClick(item: KitchenQueueItem) {
    try {
      await bumpKitchenItem(item.orderItemId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal ubah status item.');
    }
  }

  function handleToggleAudio() {
    const next = !audioEnabled;
    setAudioEnabled(next);
    if (next) {
      playKitchenChime();
      showToast('Audio notifikasi dapur aktif');
    } else {
      showToast('Audio notifikasi dimatikan');
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        void handleRecall();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (filteredTickets[0]) void handleBump(filteredTickets[0]);
        return;
      }
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 6) {
        const target = filteredTickets[num - 1];
        if (target) {
          e.preventDefault();
          void handleBump(target);
        }
        return;
      }
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const idx = stations.indexOf(activeStation);
        setActiveStation(stations[(idx + 1) % stations.length]);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col bg-[#0B0F17] text-white select-none overflow-hidden font-lp-sans">
      {/* TOP HEADER BAR */}
      <header className="h-20 bg-[#0F172A] border-b border-[#1E293B] px-5 flex items-center justify-between shrink-0 shadow-lg z-30">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3 pr-4 border-r border-[#334155]">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <Icon name="soup_kitchen" className="text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white uppercase font-lp-mono">
                  Tumbuh KDS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {outletName || 'Dapur'} · {summary?.active ?? 0} item aktif
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 bg-[#0B0F17] p-1.5 rounded-xl border border-[#1E293B]">
            {stations.map((station) => {
              const meta = stationMeta(station === 'all' ? null : station);
              const isActive = activeStation === station;
              const count =
                station === 'all'
                  ? tickets.length
                  : tickets.filter((t) => t.items.some((i) => i.station === station)).length;
              return (
                <button
                  key={station}
                  onClick={() => setActiveStation(station)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <Icon name={station === 'all' ? 'restaurant_menu' : meta.icon} className="text-sm opacity-80" />
                  <span>{station === 'all' ? 'Semua Stasiun' : meta.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-lp-mono font-bold ${
                      isActive ? 'bg-emerald-950/80 text-emerald-200' : 'bg-[#1E293B] text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden xl:flex items-center gap-3">
          <div className="bg-[#0B0F17] px-3.5 py-1.5 rounded-xl border border-[#1E293B] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Icon name="timer" className="text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Prep Time</p>
              <p className="font-lp-mono text-base font-extrabold text-white">
                {formatTimer(avgPrepSeconds)}{' '}
                <span className="text-[10px] text-emerald-400 font-sans font-normal">(Target &lt;{TARGET_MINUTES}m)</span>
              </p>
            </div>
          </div>

          <div className="bg-[#0B0F17] px-3.5 py-1.5 rounded-xl border border-[#1E293B] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Icon name="receipt_long" className="text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Antrian Aktif</p>
              <p className="font-lp-mono text-base font-extrabold text-white">
                {activeCount} Tiket{' '}
                <span className="text-[10px] text-slate-400 font-sans font-normal">
                  ({dineInCount} Dine In · {takeAwayCount} TA · {deliveryCount} Ojol)
                </span>
              </p>
            </div>
          </div>

          {urgentCount > 0 ? (
            <div className="bg-red-950/50 px-3.5 py-1.5 rounded-xl border border-red-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black">
                <Icon name="warning" className="text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-300 uppercase tracking-wider">Tiket Terlambat (&gt;{TARGET_MINUTES}m)</p>
                <p className="font-lp-mono text-base font-black text-red-200">{urgentCount} Tiket Urgent!</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0B0F17] px-3.5 py-1.5 rounded-xl border border-[#1E293B] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
                <Icon name="check_circle" className="text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status SLA Dapur</p>
                <p className="font-lp-mono text-base font-extrabold text-emerald-400">On-Time</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleRecall()}
            disabled={recallStack.length === 0}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm border ${
              recallStack.length > 0
                ? 'bg-[#1E293B] hover:bg-[#334155] text-slate-200 hover:text-white border-[#334155]'
                : 'bg-[#131B2A] text-slate-600 border-[#1E293B] cursor-not-allowed'
            }`}
            title="Kembalikan tiket yang baru saja ter-bump (Ctrl+Z)"
          >
            <Icon name="undo" className="text-base" />
            <span>Recall Tiket</span>
            <kbd className="text-[10px] opacity-70 font-lp-mono">Ctrl+Z</kbd>
          </button>

          <button
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
              audioEnabled
                ? 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-700/60'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Nyalakan / matikan nada notifikasi pesanan baru"
          >
            <Icon name={audioEnabled ? 'volume_up' : 'volume_off'} className="text-base" />
            <span>Audio: {audioEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <div className="flex items-center bg-[#0B0F17] rounded-xl border border-[#1E293B] p-1">
            <button
              onClick={() => setColumnCount(4)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                columnCount === 4 ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4 Kolom
            </button>
            <button
              onClick={() => setColumnCount(5)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                columnCount === 5 ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              5 Kolom
            </button>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#0B0F17] border border-[#1E293B] flex items-center gap-2">
            <Icon name="schedule" className="text-amber-400 text-base" />
            <span className="font-lp-mono text-base font-black tracking-wider text-amber-400">
              {clock || '--:--:--'}{' '}
              <span className="text-xs text-slate-400 font-sans font-medium">WIB</span>
            </span>
          </div>
        </div>
      </header>

      {toast && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md transition-all">
          <div className="flex items-center gap-2">
            <Icon name="check_circle" className="text-base" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">
            <Icon name="close" className="text-sm" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-950/70 text-red-200 border-b border-red-800 px-4 py-2 text-xs font-bold flex items-center gap-2">
          <Icon name="error" className="text-base" />
          <span>{error}</span>
        </div>
      )}

      <main className="flex-1 p-5 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400 animate-pulse">Memuat antrian dapur…</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
              <Icon name="check_circle" className="text-5xl" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Semua Pesanan Dapur Selesai!</h2>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Tidak ada antrian aktif pada stasiun ini. Pesanan baru dari terminal kasir atau QR meja
              akan otomatis muncul.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-5 items-start ${
              columnCount === 5
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}
          >
            {filteredTickets.map((ticket, index) => {
              const elapsed = Math.max(
                0,
                ...ticket.items.map((i) => secondsSince(i.sentToKitchenAt, now)),
              );
              const isUrgent = elapsed >= TARGET_MINUTES * 60;
              const isWarning = !isUrgent && elapsed >= (TARGET_MINUTES - 5) * 60;
              const isDelivery = ticket.source === 'delivery';

              let borderStyle = 'border-emerald-600/70 shadow-lg';
              let headerBg = 'bg-emerald-700 text-white';
              let timerTag = formatTimer(elapsed) + ' (Baru)';
              let bumpGradient =
                'from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-950/60';

              if (isUrgent) {
                borderStyle = 'border-2 border-red-600 shadow-2xl';
                headerBg = 'bg-red-600 text-white';
                const overdueMins = Math.floor((elapsed - TARGET_MINUTES * 60) / 60);
                timerTag = `${formatTimer(elapsed)} (TELAT +${overdueMins}m)`;
                bumpGradient = 'from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-red-950/60';
              } else if (isWarning) {
                borderStyle = 'border-2 border-amber-500 shadow-xl';
                headerBg = 'bg-amber-600 text-white';
                timerTag = `${formatTimer(elapsed)} (Mendekati Batas)`;
                bumpGradient = 'from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-950/50';
              } else if (isDelivery) {
                borderStyle = 'border-2 border-sky-500 shadow-xl';
                headerBg = 'bg-sky-600 text-white';
                timerTag = `${formatTimer(elapsed)}`;
                bumpGradient = 'from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 shadow-sky-950/60';
              }

              const visibleItems =
                activeStation === 'all'
                  ? ticket.items
                  : ticket.items.filter((it) => it.station === activeStation);
              const allItemsReady = visibleItems.every((it) => it.status === 'ready');

              return (
                <div
                  key={ticket.orderId}
                  className={`bg-[#131B2A] rounded-2xl border flex flex-col overflow-hidden relative transition-all ${borderStyle}`}
                >
                  <div className={`px-4 py-2 flex items-center justify-between font-lp-mono ${headerBg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full bg-white shrink-0 ${isUrgent ? 'animate-ping' : ''}`} />
                      <span className="font-black text-sm tracking-wider">{ticket.orderNumber}</span>
                      <span className="text-xs font-bold bg-black/30 px-2 py-0.5 rounded">{ticket.sourceLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-0.5 rounded-lg border border-white/20">
                      <Icon name="schedule" className="text-sm" />
                      <span className="font-black text-xs">{timerTag}</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-[#182234] border-b border-[#1E293B] flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-base text-white leading-tight">{ticket.label}</h3>
                      {ticket.subMeta && (
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{ticket.subMeta}</p>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 font-lp-mono">
                      {visibleItems.length} ITEM
                    </span>
                  </div>

                  <div className="p-4 space-y-3 flex-1">
                    {visibleItems.map((item) => {
                      const isReady = item.status === 'ready';
                      const isCooking = item.status === 'cooking';
                      const meta = stationMeta(item.station);
                      return (
                        <div
                          key={item.orderItemId}
                          className={`p-3 rounded-xl border transition-all ${
                            isReady
                              ? 'bg-[#0B0F17]/60 border-emerald-500/30 opacity-75'
                              : isCooking
                                ? 'bg-[#0B0F17] border-amber-500/50'
                                : 'bg-[#0B0F17] border-[#1E293B] hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`font-lp-mono text-base font-black px-2 py-0.5 rounded ${
                                  isReady
                                    ? 'bg-emerald-500/10 text-emerald-400 line-through'
                                    : isCooking
                                      ? 'bg-amber-500/10 text-amber-400'
                                      : 'bg-slate-800 text-cyan-400'
                                }`}
                              >
                                {item.qty}x
                              </span>
                              <div>
                                <h4 className={`text-sm font-extrabold leading-tight ${isReady ? 'text-slate-400 line-through' : 'text-white'}`}>
                                  {item.productName}
                                </h4>
                                {item.modifiers.length > 0 && (
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {item.modifiers.map((m) => m.modifierName).join(', ')}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-xs text-amber-300 font-semibold mt-0.5 flex items-center gap-1">
                                    <Icon name="edit_note" className="text-sm" />
                                    <span>Catatan: {item.notes}</span>
                                  </p>
                                )}
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-500">{meta.label}</span>
                                  {isReady && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                                      <Icon name="check_circle" className="text-xs" />
                                      <span>SIAP</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleItemClick(item)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition shrink-0 border ${
                                isReady
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500 hover:text-black'
                                  : isCooking
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-black'
                                    : 'bg-[#1E293B] text-slate-300 border-[#334155] hover:bg-slate-700'
                              }`}
                              title="Ubah status: Pending → Dimasak → Siap"
                            >
                              {isReady ? 'Ready ✓' : isCooking ? 'Siap' : 'Masak'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 bg-[#0F172A] border-t border-[#1E293B]">
                    <button
                      type="button"
                      onClick={() => void handleBump(ticket)}
                      className={`w-full py-3.5 px-4 rounded-xl text-white font-black text-xs tracking-wide shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] bg-gradient-to-r ${bumpGradient}`}
                    >
                      <Icon name={allItemsReady ? 'done_all' : 'check_circle'} className="text-lg" />
                      <span>
                        BUMP SELESAI [F{index + 1}
                        {index === 0 ? ' / Space' : ''}]
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="h-14 bg-[#0F172A] border-t border-[#1E293B] px-5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-lp-mono text-slate-300">Auto-refresh 8s</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Icon name="keyboard" className="text-base text-emerald-400" />
            <span>KDS Bump Bar Ready</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] font-lp-mono">
          <span className="text-slate-400 mr-1 font-sans">Pintasan Dapur:</span>
          <span className="px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-amber-400 font-bold">[1-6] Bump Tiket</span>
          <span className="px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-emerald-400 font-bold">[Space] Bump Pertama</span>
          <span className="px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-cyan-400 font-bold">[Ctrl+Z] Recall</span>
          <span className="px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-pink-400 font-bold">[M] Ganti Stasiun</span>
        </div>
      </footer>
    </div>
  );
}
