'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CartPanel } from '@/components/cart-panel';
import { MenuGrid } from '@/components/menu-grid';
import { ModifierModal } from '@/components/modifier-modal';
import { PaymentPanel } from '@/components/payment-panel';
import { ReceiptModal } from '@/components/receipt-modal';
import { HoldOrdersModal } from '@/components/hold-orders-modal';
import { ParkOrderModal } from '@/components/park-order-modal';
import { CustomerPickerModal } from '@/components/customer-picker-modal';
import { TablePickerModal } from '@/components/table-picker-modal';
import { VoidModal } from '@/components/void-modal';
import { Alert, Spinner } from '@/components/pos-ui';
import { Icon } from '@/components/icon';
import {
  createOrder,
  createPayment,
  currentShift,
  loadMenu,
  loadProductOptions,
  lookupProductByCode,
  moveOrderTable,
  type PayInput,
  type PosTable,
} from '@/lib/api';
import type {
  CartLine,
  CreatedOrder,
  ModifierGroup,
  OrderType,
  PaymentResult,
  Product,
  ProductVariant,
} from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';
import { cartSubtotal, useCartStore } from '@/stores/cart-store';
import {
  toCartLines,
  toCreatedOrder,
  toOrderLines,
  useHoldStore,
  type ParkedOrder,
} from '@/stores/hold-store';

const ORDER_TYPES: Array<{ value: OrderType; label: string; icon: string }> = [
  { value: 'dine_in', label: 'Dine In', icon: 'restaurant' },
  { value: 'take_away', label: 'Take Away', icon: 'takeout_dining' },
  { value: 'delivery', label: 'Delivery', icon: 'delivery_dining' },
];

type Stage = 'browse' | 'payment';

export default function PosPage() {
  const outletName = useAuthStore((s) => s.outletName);

  const lines = useCartStore((s) => s.lines);
  const orderType = useCartStore((s) => s.orderType);
  const customer = useCartStore((s) => s.customer);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const addLine = useCartStore((s) => s.addLine);
  const setQty = useCartStore((s) => s.setQty);
  const setLineNotes = useCartStore((s) => s.setLineNotes);
  const removeLine = useCartStore((s) => s.removeLine);
  const replaceLines = useCartStore((s) => s.replaceLines);
  const setOrderType = useCartStore((s) => s.setOrderType);
  const clearCart = useCartStore((s) => s.clear);

  const parkedOrders = useHoldStore((s) => s.orders);
  const holdError = useHoldStore((s) => s.error);
  const refreshParked = useHoldStore((s) => s.refresh);
  const parkOrder = useHoldStore((s) => s.park);
  const resumeOrder = useHoldStore((s) => s.resume);
  const replaceParkedItems = useHoldStore((s) => s.replaceItems);
  const voidParkedItems = useHoldStore((s) => s.voidItems);
  const voidParked = useHoldStore((s) => s.voidParked);

  const [showHoldOrders, setShowHoldOrders] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showParkModal, setShowParkModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voidingOrder, setVoidingOrder] = useState<ParkedOrder | null>(null);
  const [movingOrder, setMovingOrder] = useState<ParkedOrder | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [resumingOrderId, setResumingOrderId] = useState<string | null>(null);
  const [shiftOpen, setShiftOpen] = useState<boolean | null>(null);

  useEffect(() => {
    void refreshParked();
  }, [refreshParked]);

  useEffect(() => {
    let cancelled = false;
    currentShift()
      .then((res) => {
        // A shift opened on a previous day is stale: BE rejects sales on it,
        // so treat it as "no open shift" and prompt to open today's.
        if (!cancelled) {
          setShiftOpen(res.currentShift !== null && !res.stale);
        }
      })
      .catch(() => {
        if (!cancelled) setShiftOpen(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shiftBlocked = shiftOpen === false;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'F6') {
        e.preventDefault();
        setShowHoldOrders((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [menu, setMenu] = useState<{
    categories: Awaited<ReturnType<typeof loadMenu>>['categories'];
    products: Product[];
  }>({ categories: [], products: [] });
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [picking, setPicking] = useState<{
    product: Product;
    variants: ProductVariant[];
    modifierGroups: ModifierGroup[];
  } | null>(null);
  const [stage, setStage] = useState<Stage>('browse');
  const [pendingOrder, setPendingOrder] = useState<CreatedOrder | null>(null);
  const [receipt, setReceipt] = useState<{
    order: CreatedOrder;
    payment: PaymentResult;
    lines: CartLine[];
  } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [scanCode, setScanCode] = useState('');

  function refreshMenu() {
    setLoadingMenu(true);
    return loadMenu()
      .then((result) => {
        setMenu(result);
        setMenuError(null);
      })
      .catch((err) => {
        setMenuError(err instanceof Error ? err.message : 'Gagal memuat menu.');
      })
      .finally(() => setLoadingMenu(false));
  }

  useEffect(() => {
    let cancelled = false;
    loadMenu()
      .then((result) => {
        if (!cancelled) {
          setMenu(result);
          setMenuError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMenuError(err instanceof Error ? err.message : 'Gagal memuat menu.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMenu(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = cartSubtotal(lines);

  /** Options are fetched per tap: a menu-wide preload would be N requests. */
  async function pick(product: Product) {
    try {
      const options = await loadProductOptions(product.id);
      if (
        options.variants.length > 0 ||
        options.modifierGroups.length > 0
      ) {
        setPicking({ product, ...options });
        return;
      }
    } catch {
      // Options unavailable — fall through and add the plain product.
    }
    addLine({
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      modifierGroups: [],
      notes: '',
    });
  }

  async function scan(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      const found = await lookupProductByCode(trimmed);
      // Prefer the grid's copy so the tile and the scan agree on price.
      const product =
        menu.products.find((p) => p.id === found.id) ?? found;
      await pick(product);
      setScanCode('');
      setMenuError(null);
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : 'Produk tidak ditemukan.');
    }
  }

  /**
   * The order is created first: only the server knows tax and service charge.
   * When resuming a parked order we update that same order instead of creating
   * a new one, so no duplicate is left behind.
   */
  async function startCheckout() {
    setOrderError(null);
    setSubmitting(true);
    try {
      if (resumingOrderId) {
        const updated = await replaceParkedItems(resumingOrderId, lines);
        if (!updated) throw new Error('Gagal menyimpan perubahan pesanan.');
        setPendingOrder(toCreatedOrder(updated));
      } else {
        const order = await createOrder({
          orderType,
          items: toOrderLines(lines),
          customerId: customer?.id,
        });
        setPendingOrder(order);
      }
      setStage('payment');
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : 'Gagal membuat order.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function pay(payment: PayInput) {
    const result = await createPayment(payment);
    if (pendingOrder) {
      setReceipt({ order: pendingOrder, payment: result, lines });
    }
  }

  function finishOrder() {
    clearCart();
    setReceipt(null);
    setPendingOrder(null);
    setResumingOrderId(null);
    setStage('browse');
    // Menu prices and sold-out flags may have changed while selling.
    void refreshMenu();
    // A paid parked order leaves the Bill Parkir list.
    void refreshParked();
  }

  function handleParkCurrentCart() {
    if (lines.length === 0) return;
    setShowParkModal(true);
  }

  async function confirmPark(label: string) {
    setSubmitting(true);
    const parked = await parkOrder({
      orderType,
      label,
      lines,
      customerId: customer?.id,
    });
    setSubmitting(false);
    if (parked) {
      clearCart();
      setShowParkModal(false);
    }
  }

  async function handleMoveTable(table: PosTable) {
    if (!movingOrder) return;
    setSubmitting(true);
    setMoveError(null);
    try {
      await moveOrderTable(movingOrder.id, table.id);
      await refreshParked();
      setMovingOrder(null);
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : 'Gagal pindah meja.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row bg-lp-background">
      <div className="flex min-h-0 flex-1 flex-col border-b border-lp-outline-variant/25 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 border-b border-lp-outline-variant/25 bg-lp-surface-container-lowest px-4 py-2.5 shadow-2xs">
          <div className="relative flex-1">
            <input
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void scan(scanCode);
              }}
              placeholder="Scan barcode scanner atau ketik SKU, lalu tekan Enter..."
              className="w-full rounded-xl border border-lp-outline-variant/40 bg-lp-surface-low pl-9 pr-16 py-2 text-xs text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant/50 focus:border-lp-primary focus:bg-lp-surface-container-lowest focus:ring-1 focus:ring-lp-primary transition-all font-lp-mono"
            />
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lp-on-surface-variant/70">
              <Icon name="qr_code_scanner" className="text-base" />
            </div>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-lp-surface-container px-1.5 py-0.5 text-[10px] font-semibold text-lp-on-surface-variant">
              Enter ↵
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHoldOrders(true)}
            className={`relative flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all shrink-0 ${
              parkedOrders.length > 0
                ? 'border-lp-primary/40 bg-lp-primary/10 text-lp-primary hover:bg-lp-primary/15 shadow-2xs'
                : 'border-lp-outline-variant/30 bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container'
            }`}
            title="Daftar Tagihan Meja / Bill Parkir (F6)"
          >
            <Icon name="receipt_long" className="text-base" />
            <span className="hidden sm:inline">Bill Parkir</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lp-primary text-[10px] font-bold text-white px-1 font-lp-mono">
              {parkedOrders.length}
            </span>
            <kbd className="hidden lg:inline text-[10px] opacity-60 font-lp-mono border border-current/20 px-1 rounded">
              F6
            </kbd>
          </button>
        </div>

        {menuError && (
          <div className="p-3">
            <Alert kind="error">{menuError}</Alert>
          </div>
        )}

        {loadingMenu ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <Spinner label="Memuat katalog menu POS..." />
          </div>
        ) : (
          <MenuGrid
            categories={menu.categories}
            products={menu.products}
            onPick={(product) => void pick(product)}
          />
        )}
      </div>

      <aside className="flex w-full shrink-0 flex-col bg-lp-surface-container-lowest border-t lg:border-t-0 lg:border-l border-lp-outline-variant/25 lg:max-w-md shadow-xs">
        {stage === 'browse' ? (
          <>
            <div className="flex gap-1.5 border-b border-lp-outline-variant/25 bg-lp-surface-container-lowest p-3 shadow-2xs">
              {ORDER_TYPES.map((type) => {
                const active = type.value === orderType;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setOrderType(type.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs transition-all ${
                      active
                        ? 'border-lp-primary bg-lp-primary text-white font-bold shadow-xs'
                        : 'border-lp-outline-variant/30 bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface font-medium'
                    }`}
                  >
                    <Icon name={type.icon} className="text-sm" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>

            {shiftBlocked && (
              <div className="p-3 pb-0">
                <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Icon name="lock" className="text-sm shrink-0" />
                    Belum ada shift aktif. Buka shift untuk mulai transaksi.
                  </span>
                  <Link
                    href="/shift"
                    className="shrink-0 rounded-lg border border-amber-400 bg-amber-500 px-2.5 py-1 font-bold text-white hover:bg-amber-600 transition-colors"
                  >
                    Buka Shift
                  </Link>
                </div>
              </div>
            )}

            {orderError && (
              <div className="p-3 pb-0">
                <Alert kind="error">{orderError}</Alert>
              </div>
            )}

            {holdError && (
              <div className="p-3 pb-0">
                <Alert kind="error">{holdError}</Alert>
              </div>
            )}

            <CartPanel
              lines={lines}
              subtotal={subtotal}
              customer={customer}
              onSetQty={setQty}
              onRemove={removeLine}
              onSetNotes={setLineNotes}
              onClear={clearCart}
              onCheckout={startCheckout}
              onPark={lines.length > 0 && !shiftBlocked ? handleParkCurrentCart : undefined}
              onPickCustomer={() => setShowCustomerPicker(true)}
              onClearCustomer={() => setCustomer(null)}
              checkoutDisabled={lines.length === 0 || submitting || shiftBlocked}
            />
          </>
        ) : (
          pendingOrder && (
            <PaymentPanel
              order={pendingOrder}
              onBack={() => {
                setStage('browse');
                setPendingOrder(null);
              }}
              onSubmit={pay}
              onOrderChange={(patch) =>
                setPendingOrder((prev) => (prev ? { ...prev, ...patch } : prev))
              }
            />
          )
        )}

        {lines.length > 0 && stage === 'browse' && (
          <div className="border-t border-lp-outline-variant/20 bg-lp-surface-low px-4 py-2 text-[11px] text-lp-on-surface-variant flex items-center gap-1.5">
            <Icon name="info" className="text-xs text-lp-primary" />
            <span>Pajak & service dihitung otomatis oleh server saat checkout.</span>
          </div>
        )}
      </aside>

      {picking && (
        <ModifierModal
          productId={picking.product.id}
          productName={picking.product.name}
          basePrice={picking.product.basePrice}
          variants={picking.variants}
          groups={picking.modifierGroups}
          onCancel={() => setPicking(null)}
          onConfirm={(line) => {
            addLine(line);
            setPicking(null);
          }}
        />
      )}

      {receipt && (
        <ReceiptModal
          order={receipt.order}
          payment={receipt.payment}
          lines={receipt.lines}
          outletName={outletName}
          onClose={() => setReceipt(null)}
          onNewOrder={finishOrder}
        />
      )}

      {showCustomerPicker && (
        <CustomerPickerModal
          onCancel={() => setShowCustomerPicker(false)}
          onPick={(picked) => {
            setCustomer(picked);
            setShowCustomerPicker(false);
          }}
        />
      )}

      {showParkModal && (
        <ParkOrderModal
          orderType={orderType}
          submitting={submitting}
          onCancel={() => setShowParkModal(false)}
          onConfirm={(label) => void confirmPark(label)}
        />
      )}

      {showHoldOrders && (
        <HoldOrdersModal
          outletName={outletName}
          onClose={() => setShowHoldOrders(false)}
          onResumeToCart={async (order) => {
            const detail = await resumeOrder(order.id);
            if (!detail) return;
            setOrderType(detail.orderType ?? 'dine_in');
            replaceLines(toCartLines(detail));
            setResumingOrderId(order.id);
            setShowHoldOrders(false);
          }}
          onDirectPay={async (order) => {
            const detail = await resumeOrder(order.id);
            if (!detail) return;
            setShowHoldOrders(false);
            setPendingOrder(toCreatedOrder(detail));
            setStage('payment');
          }}
          onOpenVoidModal={(order) => setVoidingOrder(order)}
          onMoveTable={(order) => {
            setMoveError(null);
            setMovingOrder(order);
          }}
        />
      )}

      {movingOrder && (
        <TablePickerModal
          currentTableName={movingOrder.tableNumber}
          onCancel={() => setMovingOrder(null)}
          onPick={(table) => void handleMoveTable(table)}
        />
      )}

      {moveError && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <Alert kind="error">{moveError}</Alert>
        </div>
      )}

      {voidingOrder && (
        <VoidModal
          order={voidingOrder}
          submitting={submitting}
          onCancel={() => setVoidingOrder(null)}
          onConfirm={async ({ orderId, itemIds, reason }) => {
            setSubmitting(true);
            const isWhole = (voidingOrder.items?.length ?? 0) === itemIds.length;
            const ok = isWhole
              ? await voidParked(orderId, reason)
              : await voidParkedItems(orderId, itemIds, reason);
            setSubmitting(false);
            if (ok) setVoidingOrder(null);
          }}
        />
      )}
    </div>
  );
}
