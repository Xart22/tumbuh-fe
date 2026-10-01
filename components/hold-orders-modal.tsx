'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatIDR } from '@/lib/format';
import { Icon } from './icon';
import { Button } from './pos-ui';
import { useHoldStore, type ParkedOrder } from '@/stores/hold-store';

function elapsedMinutes(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / 60000));
}

export function HoldOrdersModal({
  outletName,
  onClose,
  onResumeToCart,
  onDirectPay,
  onOpenVoidModal,
  onMoveTable,
}: {
  outletName?: string | null;
  onClose: () => void;
  onResumeToCart: (order: ParkedOrder) => void;
  onDirectPay: (order: ParkedOrder) => void;
  onOpenVoidModal: (order: ParkedOrder) => void;
  onMoveTable?: (order: ParkedOrder) => void;
}) {
  const orders = useHoldStore((s) => s.orders);
  const loading = useHoldStore((s) => s.loading);
  const error = useHoldStore((s) => s.error);
  const refresh = useHoldStore((s) => s.refresh);
  const selectedOrderId = useHoldStore((s) => s.selectedOrderId);
  const selectOrder = useHoldStore((s) => s.selectOrder);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId],
  );

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filterType === 'dine_in' && o.orderType !== 'dine_in') return false;
      if (filterType === 'take_away' && o.orderType !== 'take_away') return false;
      if (filterType === 'delivery' && o.orderType !== 'delivery') return false;
      if (filterType === 'warning' && elapsedMinutes(o.createdAt) <= 45) return false;

      if (!q) return true;
      const matchTable = o.tableNumber?.toLowerCase().includes(q);
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchNotes = o.notes?.toLowerCase().includes(q);
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      return matchTable || matchName || matchNotes || matchNum;
    });
  }, [orders, search, filterType]);

  const totalOpenAmount = orders.reduce((s, o) => s + o.total, 0);
  const dineInCount = orders.filter((o) => o.orderType === 'dine_in').length;
  const takeAwayCount = orders.filter((o) => o.orderType === 'take_away').length;
  const deliveryCount = orders.filter((o) => o.orderType === 'delivery').length;
  const warningCount = orders.filter((o) => elapsedMinutes(o.createdAt) > 45).length;
  const avgMinutes = orders.length
    ? Math.round(
        orders.reduce((s, o) => s + elapsedMinutes(o.createdAt), 0) / orders.length,
      )
    : null;

  function labelOf(order: ParkedOrder): string {
    return order.tableNumber || order.customerName || order.notes || order.orderNumber;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="flex h-full w-full flex-col rounded-2xl border border-lp-outline-variant/30 bg-lp-background shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-lp-outline-variant/25 bg-lp-surface-container-lowest px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-lp-outline-variant/30 bg-lp-surface-low px-3 py-1.5 text-xs font-semibold text-lp-on-surface hover:bg-lp-surface-container transition-colors"
            >
              <Icon name="arrow_back" className="text-sm" />
              <span>Kembali ke Kasir [Esc]</span>
            </button>
            <div className="h-4 w-px bg-lp-outline-variant/30" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-lp-on-surface">
                  Daftar Bill Parkir
                </h1>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-lp-primary border border-emerald-200">
                  {orders.length} Order Aktif
                </span>
              </div>
              {outletName && (
                <p className="text-[11px] text-lp-on-surface-variant">{outletName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari meja, nama tamu, atau no. order..."
                className="w-64 rounded-xl border border-lp-outline-variant/40 bg-lp-surface-low pl-8 pr-3 py-1.5 text-xs text-lp-on-surface outline-none focus:border-lp-primary focus:bg-lp-surface-container-lowest transition-all"
              />
              <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-lp-on-surface-variant/60">
                <Icon name="search" className="text-sm" />
              </div>
            </div>
            <Button variant="ghost" className="text-xs py-1.5" onClick={onClose}>
              <Icon name="close" className="text-sm" />
            </Button>
          </div>
        </div>

        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-lp-outline-variant/20 bg-lp-surface-container-lowest px-4 py-2.5">
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Tagihan Berjalan</p>
            <p className="text-base font-extrabold font-lp-mono text-lp-primary">{formatIDR(totalOpenAmount)}</p>
            <p className="text-[10px] text-emerald-700">{orders.length} tagihan belum lunas</p>
          </div>
          <div className="rounded-xl border border-lp-outline-variant/30 bg-lp-surface-low p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-lp-on-surface-variant">Meja Dine-In Aktif</p>
            <p className="text-base font-extrabold font-lp-mono text-lp-on-surface">{dineInCount} Meja</p>
            <p className="text-[10px] text-lp-on-surface-variant">{takeAwayCount} take away · {deliveryCount} delivery</p>
          </div>
          <div className="rounded-xl border border-lp-outline-variant/30 bg-lp-surface-low p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-lp-on-surface-variant">Rata-rata Durasi</p>
            <p className="text-base font-extrabold font-lp-mono text-lp-on-surface">
              {avgMinutes === null ? '—' : `${avgMinutes} Menit`}
            </p>
            <p className="text-[10px] text-lp-on-surface-variant">Dihitung dari waktu parkir</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Tagihan Lama</p>
            <p className="text-base font-extrabold font-lp-mono text-amber-700">{warningCount} Meja</p>
            <p className="text-[10px] text-amber-800">&gt;45 menit perlu cek bill</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between border-b border-lp-outline-variant/20 bg-lp-surface-low px-4 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <FilterChip
              label="Semua Order"
              count={orders.length}
              active={filterType === 'all'}
              onClick={() => setFilterType('all')}
            />
            <FilterChip
              label="Dine In (Meja)"
              count={dineInCount}
              active={filterType === 'dine_in'}
              onClick={() => setFilterType('dine_in')}
            />
            <FilterChip
              label="Take Away"
              count={takeAwayCount}
              active={filterType === 'take_away'}
              onClick={() => setFilterType('take_away')}
            />
            <FilterChip
              label="Delivery Ojol"
              count={deliveryCount}
              active={filterType === 'delivery'}
              onClick={() => setFilterType('delivery')}
            />
            {warningCount > 0 && (
              <FilterChip
                label="Perlu Cek Meja (>45m)"
                count={warningCount}
                active={filterType === 'warning'}
                alert
                onClick={() => setFilterType('warning')}
              />
            )}
          </div>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Content Body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {loading && orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-lp-on-surface-variant animate-pulse">Memuat Bill Parkir…</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lp-surface-container text-lp-on-surface-variant">
                  <Icon name="check_circle" className="text-3xl" />
                </div>
                <p className="mt-3 text-sm font-bold text-lp-on-surface">Tidak ada order terbuka yang cocok</p>
                <p className="mt-1 text-xs text-lp-on-surface-variant">
                  Semua tagihan sudah diproses atau filter pencarian kosong
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredOrders.map((order) => {
                  const isSelected = order.id === selectedOrderId;
                  const minutes = elapsedMinutes(order.createdAt);
                  const late = minutes > 45;
                  return (
                    <div
                      key={order.id}
                      onClick={() => selectOrder(order.id)}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-lp-primary bg-emerald-50/20 shadow-md ring-2 ring-lp-primary/20'
                          : late
                            ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                            : 'border-lp-outline-variant/30 bg-lp-surface-container-lowest hover:border-lp-outline-variant hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-lp-on-surface">
                              {labelOf(order)}
                            </span>
                            {order.customerName && order.tableNumber && (
                              <span className="text-[11px] text-lp-on-surface-variant font-medium">
                                · {order.customerName}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-lp-mono text-lp-outline mt-0.5">
                            {order.orderNumber}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold font-lp-mono ${
                            late
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-lp-surface-container text-lp-on-surface-variant'
                          }`}
                        >
                          <Icon name="schedule" className="text-xs" />
                          {minutes}m lalu
                        </span>
                      </div>

                      <div className="my-2.5 rounded-xl border border-lp-outline-variant/15 bg-lp-surface-low/60 p-2 text-xs space-y-1">
                        {(order.items ?? []).slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between text-[11px] text-lp-on-surface">
                            <span className="truncate pr-2">
                              {item.qty}× {item.productName ?? 'Produk'}
                            </span>
                            <span className="font-lp-mono font-medium shrink-0">
                              {formatIDR(item.unitPrice * item.qty)}
                            </span>
                          </div>
                        ))}
                        {(order.items?.length ?? 0) > 3 && (
                          <p className="text-[10px] text-lp-on-surface-variant italic">
                            +{order.items!.length - 3} menu lainnya...
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-lp-outline-variant/15 pt-2">
                        <div>
                          <p className="text-[10px] text-lp-on-surface-variant">Total Tagihan</p>
                          <p className="text-sm font-bold font-lp-mono text-lp-on-surface">
                            {formatIDR(order.total)}
                          </p>
                        </div>
                        <Button
                          className="text-xs py-1 px-3 h-8 font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDirectPay(order);
                          }}
                        >
                          Bayar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Slide-out: Selected Order Details */}
          {selectedOrder && !loading && (
            <aside className="w-80 sm:w-96 shrink-0 border-l border-lp-outline-variant/25 bg-lp-surface-container-lowest flex flex-col shadow-xs">
              <div className="flex items-center justify-between border-b border-lp-outline-variant/20 px-4 py-3">
                <div>
                  <h3 className="text-xs font-bold text-lp-on-surface">
                    {labelOf(selectedOrder)}
                  </h3>
                  <p className="text-[11px] text-lp-on-surface-variant font-lp-mono">
                    {selectedOrder.orderNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenVoidModal(selectedOrder)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Icon name="cancel" className="text-xs" />
                  <span>Void Order</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 divide-y divide-lp-outline-variant/15 text-xs">
                {(selectedOrder.items ?? []).map((item) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex justify-between font-bold text-lp-on-surface">
                      <span>
                        {item.qty}× {item.productName ?? 'Produk'}
                        {item.variantName ? ` (${item.variantName})` : ''}
                      </span>
                      <span className="font-lp-mono">
                        {formatIDR(item.unitPrice * item.qty)}
                      </span>
                    </div>
                    {item.modifiers.length > 0 && (
                      <p className="text-[10px] text-lp-on-surface-variant mt-0.5">
                        {item.modifiers.map((m) => m.modifierName).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] italic text-amber-700 mt-0.5">* {item.notes}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-lp-outline-variant/20 bg-lp-surface-low p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-lp-on-surface-variant">
                  <span>Subtotal:</span>
                  <span className="font-lp-mono font-medium">{formatIDR(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-lp-on-surface-variant">
                    <span>Diskon:</span>
                    <span className="font-lp-mono font-medium">
                      -{formatIDR(selectedOrder.discountAmount)}
                    </span>
                  </div>
                )}
                {selectedOrder.serviceCharge > 0 && (
                  <div className="flex justify-between text-lp-on-surface-variant">
                    <span>Service:</span>
                    <span className="font-lp-mono font-medium">{formatIDR(selectedOrder.serviceCharge)}</span>
                  </div>
                )}
                {selectedOrder.taxAmount > 0 && (
                  <div className="flex justify-between text-lp-on-surface-variant">
                    <span>Pajak:</span>
                    <span className="font-lp-mono font-medium">{formatIDR(selectedOrder.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-lp-outline-variant/20 pt-2 flex justify-between items-baseline font-bold text-lp-on-surface">
                  <span className="text-xs uppercase tracking-wider">Total Tagihan:</span>
                  <span className="text-base font-lp-mono text-lp-primary">{formatIDR(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="p-4 border-t border-lp-outline-variant/20 bg-lp-surface-container-lowest flex flex-col gap-2">
                <Button
                  className="w-full h-11 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
                  onClick={() => onDirectPay(selectedOrder)}
                >
                  <Icon name="payments" className="text-base" />
                  <span>Proses Pembayaran</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => onResumeToCart(selectedOrder)}
                >
                  <Icon name="shopping_cart" className="text-sm" />
                  <span>Lanjut di Kasir (Edit)</span>
                </Button>
                {onMoveTable && (
                  <Button
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => onMoveTable(selectedOrder)}
                  >
                    <Icon name="table_restaurant" className="text-sm" />
                    <span>Pindah Meja</span>
                  </Button>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  alert,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  alert?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
        active
          ? alert
            ? 'border-amber-400 bg-amber-500 font-bold text-white shadow-xs'
            : 'border-lp-primary bg-lp-primary font-bold text-white shadow-xs'
          : alert
            ? 'border-amber-300 bg-amber-50 text-amber-900 font-semibold'
            : 'border-lp-outline-variant/30 bg-lp-surface-container-lowest text-lp-on-surface-variant hover:bg-lp-surface-low hover:text-lp-on-surface font-medium'
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.2 text-[10px] font-lp-mono ${
          active ? 'bg-white/25 text-white' : 'bg-lp-surface-container text-lp-on-surface-variant'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
