'use client';

import { useEffect, useState } from 'react';
import { formatIDR } from '@/lib/format';
import { confirmManualPayment, generateReceipt, listPrinters } from '@/lib/api';
import type {
  CartLine,
  CreatedOrder,
  OrderType,
  PaymentResult,
  ReceiptData,
} from '@/lib/types';
import { Icon } from './icon';
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

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [paperWidth, setPaperWidth] = useState(58);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    generateReceipt(order.id)
      .then((data) => {
        if (!cancelled) setReceipt(data);
      })
      .catch(() => {
        /* fall back to the client-side copy */
      });
    listPrinters()
      .then((res) => {
        if (cancelled) return;
        const printer =
          res.printers.find((p) => p.type === 'receipt') ?? res.printers[0];
        if (printer?.paperWidth) setPaperWidth(printer.paperWidth);
      })
      .catch(() => {
        /* keep default width */
      });
    return () => {
      cancelled = true;
    };
  }, [order.id]);

  const storeName = receipt?.header.storeName ?? outletName ?? 'Tumbuh POS';
  const address = receipt?.header.address ?? '';
  const phone = receipt?.header.phone ?? '';

  const items =
    receipt?.items ??
    lines.map((line) => ({
      name: line.productName,
      qty: line.qty,
      unitPrice: line.unitPrice,
      total: line.unitPrice * line.qty,
      notes: line.notes ?? null,
      modifiers: line.modifierGroups.flatMap((g) =>
        g.selected.map((m) => ({ name: m.name, price: m.priceAddition })),
      ),
    }));

  const summary =
    receipt?.summary ?? {
      subtotal: order.subtotal,
      discount: order.discountAmount,
      tax: order.taxAmount,
      serviceCharge: order.serviceCharge,
      total: order.total,
    };

  const payments =
    receipt?.payments ??
    payment.payments.map((p) => ({
      method: p.method,
      amount: p.amount,
      changeAmount: payment.changeAmount,
      paidAt: null,
    }));

  const qrString = payment.qris?.qrString ?? '';
  const qrImageSrc = /^(https?:|data:image)/.test(qrString) ? qrString : '';

  async function handleConfirmPayment() {
    setConfirming(true);
    setConfirmError(null);
    try {
      await confirmManualPayment(order.id);
      setConfirmed(true);
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : 'Gagal mengonfirmasi pembayaran.',
      );
    } finally {
      setConfirming(false);
    }
  }

  function handlePrint() {
    if (typeof window !== 'undefined') window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 print:static print:bg-transparent print:backdrop-blur-none print:p-0">
      <div className="flex max-h-[92vh] w-full max-w-sm flex-col rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest shadow-2xl overflow-hidden print:max-h-none print:w-auto print:rounded-none print:border-0 print:shadow-none">
        <div
          id="receipt-print"
          className="flex-1 overflow-y-auto p-5 font-lp-mono text-xs text-slate-800 bg-white"
          style={{ width: `${paperWidth}mm`, maxWidth: '100%', margin: '0 auto' }}
        >
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lp-primary print:hidden">
              <Icon name="check_circle" className="text-2xl" />
            </div>
            <p className="text-sm font-bold text-slate-900">{storeName}</p>
            {address && <p className="text-[11px] text-slate-500 font-medium">{address}</p>}
            {phone && <p className="text-[11px] text-slate-500 font-medium">Telp: {phone}</p>}
            <p className="text-[11px] text-slate-500 font-medium">
              {ORDER_TYPE_LABEL[order.orderType]}
            </p>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">{order.orderNumber}</p>
          </div>

          <div className="my-3 border-t border-dashed border-slate-300" />

          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div key={`${item.name}-${idx}`}>
                <div className="flex justify-between font-medium">
                  <span className="truncate pr-2">
                    {item.qty}× {item.name}
                  </span>
                  <span className="shrink-0 font-bold">{formatIDR(item.total)}</span>
                </div>
                {item.modifiers.map((m, mi) => (
                  <p key={`${item.name}-${idx}-m${mi}`} className="pl-3 text-[11px] text-slate-500">
                    + {m.name}
                  </p>
                ))}
                {item.notes && (
                  <p className="pl-3 text-[11px] italic text-amber-700">* {item.notes}</p>
                )}
              </div>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-slate-300" />

          <div className="space-y-1">
            <Row label="Subtotal" value={formatIDR(summary.subtotal)} />
            {summary.discount > 0 && (
              <Row label="Diskon" value={`-${formatIDR(summary.discount)}`} />
            )}
            {summary.serviceCharge > 0 && (
              <Row label="Service" value={formatIDR(summary.serviceCharge)} />
            )}
            <Row label="Pajak" value={formatIDR(summary.tax)} />
            <Row label="Total Tagihan" value={formatIDR(summary.total)} strong />
          </div>

          <div className="my-3 border-t border-dashed border-slate-300" />

          <div className="space-y-1">
            {payments.map((p, idx) => (
              <Row key={`${p.method}-${idx}`} label={p.method} value={formatIDR(p.amount)} />
            ))}
            <Row label="Dibayar" value={formatIDR(payment.totalTendered)} />
            <Row label="Kembalian" value={formatIDR(payment.changeAmount)} strong />
          </div>

          {awaiting && (
            <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 font-sans print:hidden">
              <p className="text-center text-[11px] font-semibold text-amber-800">
                {confirmed
                  ? 'Pembayaran terkonfirmasi.'
                  : `Menunggu pembayaran ${payment.qris?.provider ?? 'gateway'}…`}
              </p>
              {!confirmed && qrString && (
                qrImageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element -- QR image is an arbitrary/remote gateway URL
                  <img
                    src={qrImageSrc}
                    alt="QRIS"
                    className="mx-auto h-44 w-44 rounded-lg border border-slate-200 bg-white object-contain"
                  />
                ) : (
                  <p className="break-all rounded-lg border border-slate-200 bg-white p-2 text-center font-lp-mono text-[11px] text-slate-700">
                    {qrString}
                  </p>
                )
              )}
              {!confirmed && (
                <button
                  type="button"
                  onClick={() => void handleConfirmPayment()}
                  disabled={confirming}
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-lp-primary text-xs font-bold text-white shadow-sm transition hover:bg-lp-primary-container disabled:opacity-50"
                >
                  <Icon name="verified" className="text-base" />
                  <span>{confirming ? 'Mengonfirmasi…' : 'Konfirmasi Pembayaran'}</span>
                </button>
              )}
              {confirmError && (
                <p className="text-center text-[11px] font-medium text-red-600">
                  {confirmError}
                </p>
              )}
            </div>
          )}

          <p className="mt-4 text-center text-[11px] font-medium text-slate-500">
            {receipt?.footer.message ?? 'Terima Kasih!'}
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-lp-outline-variant/20 bg-lp-surface-container-lowest p-4 print:hidden">
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 text-xs" onClick={handlePrint}>
              <Icon name="print" className="text-sm" />
              <span>Cetak Struk</span>
            </Button>
            <Button variant="ghost" className="text-xs" onClick={onClose}>
              Tutup
            </Button>
          </div>
          <Button className="w-full text-xs font-bold" onClick={onNewOrder}>
            <Icon name="add" className="text-sm" />
            <span>Transaksi Baru</span>
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
    <div className={`flex justify-between ${strong ? 'font-bold text-slate-900 text-sm' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
