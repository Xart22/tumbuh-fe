'use client';

import { useEffect, useState } from 'react';
import { CartPanel } from '@/components/cart-panel';
import { MenuGrid } from '@/components/menu-grid';
import { ModifierModal } from '@/components/modifier-modal';
import { PaymentPanel } from '@/components/payment-panel';
import { ReceiptModal } from '@/components/receipt-modal';
import { Alert, Spinner } from '@/components/pos-ui';
import {
  createOrder,
  createPayment,
  loadMenu,
  loadProductOptions,
  lookupProductByCode,
  type CreateOrderLine,
  type PayInput,
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

const ORDER_TYPES: Array<{ value: OrderType; label: string }> = [
  { value: 'dine_in', label: 'Dine In' },
  { value: 'take_away', label: 'Take Away' },
  { value: 'delivery', label: 'Delivery' },
];

type Stage = 'browse' | 'payment';

export default function PosPage() {
  const outletName = useAuthStore((s) => s.outletName);

  const lines = useCartStore((s) => s.lines);
  const orderType = useCartStore((s) => s.orderType);
  const addLine = useCartStore((s) => s.addLine);
  const setQty = useCartStore((s) => s.setQty);
  const setLineNotes = useCartStore((s) => s.setLineNotes);
  const removeLine = useCartStore((s) => s.removeLine);
  const setOrderType = useCartStore((s) => s.setOrderType);
  const clearCart = useCartStore((s) => s.clear);

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

  function toPayload(cartLines: CartLine[]): CreateOrderLine[] {
    return cartLines.map((line) => ({
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

  /** Order is created first: only the server knows tax and service charge. */
  async function startCheckout() {
    setOrderError(null);
    try {
      const order = await createOrder({
        orderType,
        items: toPayload(lines),
      });
      setPendingOrder(order);
      setStage('payment');
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : 'Gagal membuat order.',
      );
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
    setStage('browse');
    // Menu prices and sold-out flags may have changed while selling.
    void refreshMenu();
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col border-b border-[var(--line)] lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 border-b border-[var(--line)] px-3 py-2">
          <input
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void scan(scanCode);
            }}
            placeholder="Scan barcode / SKU, lalu Enter"
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-teal-600"
          />
        </div>

        {menuError && (
          <div className="p-3">
            <Alert kind="error">{menuError}</Alert>
          </div>
        )}

        {loadingMenu ? (
          <div className="p-6">
            <Spinner label="Memuat menu…" />
          </div>
        ) : (
          <MenuGrid
            categories={menu.categories}
            products={menu.products}
            onPick={(product) => void pick(product)}
          />
        )}
      </div>

      <aside className="flex w-full shrink-0 flex-col bg-panel lg:max-w-md">
        {stage === 'browse' ? (
          <>
            <div className="flex gap-2 border-b border-[var(--line)] p-3">
              {ORDER_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setOrderType(type.value)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs ${
                    type.value === orderType
                      ? 'border-teal-600 bg-teal-950/40 text-ink'
                      : 'border-[var(--line)] text-muted hover:text-ink'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {orderError && (
              <div className="p-3 pb-0">
                <Alert kind="error">{orderError}</Alert>
              </div>
            )}

            <CartPanel
              lines={lines}
              subtotal={subtotal}
              onSetQty={setQty}
              onRemove={removeLine}
              onSetNotes={setLineNotes}
              onClear={clearCart}
              onCheckout={startCheckout}
              checkoutDisabled={lines.length === 0}
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
            />
          )
        )}

        {lines.length > 0 && stage === 'browse' && (
          <p className="border-t border-[var(--line)] px-4 py-2 text-[11px] text-muted">
            Pajak & service dihitung server saat order dibuat.
          </p>
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
    </div>
  );
}
