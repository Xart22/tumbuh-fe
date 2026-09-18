'use client';

import { formatIDR } from '@/lib/format';
import type { CartLine, CreatedOrder, PaymentResult, OrderType } from '@/lib/types';
import { Button } from './pos-ui';

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  dine_in: 'Dine In',
  take_away: 'Take Away',
  delivery: 'Delivery',
};

export function ReceiptModal({
  order,
  payment,
  lines,
  outletName,
  onClose,
  onNewOrder,
}: {
  order: CreatedOrder;
  payment: PaymentResult;
  lines: CartLine[];
  outletName: string | null;
  onClose: () => void;
  onNewOrder: () => void;
}) {
  const awaiting = payment.qris?.awaitingWebhook === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-sm flex-col rounded-2xl border border-[var(--line)] bg-panel">
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-ink">
          <div className="text-center">
            <p className="text-sm font-semibold">{outletName ?? 'Tumbuh POS'}</p>
            <p className="text-muted">{ORDER_TYPE_LABEL[order.orderType]}</p>
            <p className="text-muted">{order.orderNumber}</p>
          </div>

          <div className="my-3 border-t border-dashed border-[var(--line)]" />

          {lines.map((line) => (
            <div key={line.key} className="mb-2">
              <div className="flex justify-between">
                <span>
                  {line.qty}× {line.productName}
                  {line.variantName ? ` (${line.variantName})` : ''}
                </span>
                <span>{formatIDR(line.unitPrice * line.qty)}</span>
              </div>
              {line.modifierGroups.map((g) =>
                g.selected.map((m) => (
                  <p key={`${g.groupId}-${m.id}`} className="pl-3 text-muted">
                    + {m.name}
                  </p>
                )),
              )}
              {line.notes && <p className="pl-3 text-muted">* {line.notes}</p>}
            </div>
          ))}

          <div className="my-3 border-t border-dashed border-[var(--line)]" />

          <Row label="Subtotal" value={formatIDR(order.subtotal)} />
          {order.discountAmount > 0 && (
            <Row label="Diskon" value={`-${formatIDR(order.discountAmount)}`} />
          )}
          {order.serviceCharge > 0 && (
            <Row label="Service" value={formatIDR(order.serviceCharge)} />
          )}
          <Row label="Pajak" value={formatIDR(order.taxAmount)} />
          <Row label="Total" value={formatIDR(order.total)} strong />

          <div className="my-3 border-t border-dashed border-[var(--line)]" />

          {payment.payments.map((p) => (
            <Row
              key={p.id}
              label={`${p.method} · ${p.status}`}
              value={formatIDR(p.amount)}
            />
          ))}
          <Row label="Dibayar" value={formatIDR(payment.totalTendered)} />
          <Row label="Kembalian" value={formatIDR(payment.changeAmount)} />

          {awaiting && (
            <p className="mt-3 text-center text-amber-400">
              Menunggu pembayaran {payment.qris?.provider ?? 'gateway'}…
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-[var(--line)] p-4">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Tutup
          </Button>
          <Button className="flex-1" onClick={onNewOrder}>
            Order Baru
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? 'font-semibold' : ''}`}>
      <span className={strong ? '' : 'text-muted'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
