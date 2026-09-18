'use client';

import { useState } from 'react';
import { formatIDR } from '@/lib/format';
import { validateSplit } from '@/lib/order-math';
import {
  ASYNC_METHODS,
  PAYMENT_LABELS,
  type CreatedOrder,
  type PaymentMethod,
} from '@/lib/types';
import type { PayInput } from '@/lib/api';
import { Alert, Button, Field, Input } from './pos-ui';

const CASH_QUICK = [50_000, 100_000, 150_000, 200_000, 500_000];

/** Order matters: the cheap, everyday methods sit first. */
const METHOD_ORDER: PaymentMethod[] = [
  'cash',
  'qris',
  'qris_dynamic',
  'debit',
  'credit',
  'ewallet_gopay',
  'ewallet_ovo',
  'ewallet_dana',
  'ewallet_shopeepay',
  'deposit',
];

/**
 * Totals come from the created order, not from the client: the outlet's tax and
 * service-charge settings live on the server, so only `order.total` is payable.
 */
export function PaymentPanel({
  order,
  onBack,
  onSubmit,
}: {
  order: CreatedOrder;
  onBack: () => void;
  onSubmit: (payment: PayInput) => Promise<void>;
}) {
  const total = order.total;
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [splitMode, setSplitMode] = useState(false);
  const [splitSecond, setSplitSecond] = useState<PaymentMethod>('debit');
  const [splitFirstAmount, setSplitFirstAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isAsync = ASYNC_METHODS.has(method);
  const cashReceived = Number(cashInput.replace(/\D/g, '') || 0);
  const change = Math.max(cashReceived - total, 0);
  const splitFirst = Number(splitFirstAmount.replace(/\D/g, '') || 0);
  const splitSecondAmount = Math.max(total - splitFirst, 0);

  async function submit() {
    setError(null);

    if (splitMode) {
      const check = validateSplit({
        methods: [method, splitSecond],
        firstAmount: splitFirst,
        total,
      });
      if (!check.ok) {
        setError(check.reason);
        return;
      }
    }

    if (!splitMode && method === 'cash' && cashReceived > 0 && cashReceived < total) {
      // BE accepts underpayment as a deposit; make that an explicit choice.
      const proceed = window.confirm(
        `Uang tunai kurang ${formatIDR(total - cashReceived)}. Simpan sebagai deposit?`,
      );
      if (!proceed) return;
    }

    setBusy(true);
    try {
      await onSubmit(
        splitMode
          ? {
              orderId: order.id,
              payments: [
                { method, amount: splitFirst },
                { method: splitSecond, amount: splitSecondAmount },
              ],
            }
          : method === 'cash'
            ? { orderId: order.id, method, amount: cashReceived || total }
            : { orderId: order.id, method, amount: total },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pembayaran gagal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-muted hover:text-ink"
        >
          ← Ubah order
        </button>
        <button
          type="button"
          onClick={() => setSplitMode((v) => !v)}
          className="text-xs text-teal-400 hover:text-teal-300"
        >
          {splitMode ? 'Batal split' : 'Split bayar'}
        </button>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-3">
        <p className="text-xs text-muted">{order.orderNumber}</p>
        <p className="mt-1 text-2xl font-semibold text-ink">
          {formatIDR(total)}
        </p>
        <div className="mt-2 space-y-0.5 text-xs text-muted">
          <p>Subtotal {formatIDR(order.subtotal)}</p>
          {order.discountAmount > 0 && (
            <p>Diskon -{formatIDR(order.discountAmount)}</p>
          )}
          {order.serviceCharge > 0 && (
            <p>Service {formatIDR(order.serviceCharge)}</p>
          )}
          <p>Pajak {formatIDR(order.taxAmount)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {METHOD_ORDER.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`rounded-lg border px-2 py-2 text-xs ${
              m === method
                ? 'border-teal-600 bg-teal-950/40 text-ink'
                : 'border-[var(--line)] text-muted hover:text-ink'
            }`}
          >
            {PAYMENT_LABELS[m]}
          </button>
        ))}
      </div>

      {splitMode && (
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--line)] p-3">
          <Field label={`${PAYMENT_LABELS[method]} — nominal pertama`}>
            <Input
              value={splitFirstAmount}
              onChange={(e) => setSplitFirstAmount(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="0"
            />
          </Field>
          <Field label="Metode kedua">
            <select
              value={splitSecond}
              onChange={(e) => setSplitSecond(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-sm text-ink outline-none"
            >
              {METHOD_ORDER.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-muted">
            Sisa {formatIDR(splitSecondAmount)} via {PAYMENT_LABELS[splitSecond]}
          </p>
        </div>
      )}

      {!splitMode && method === 'cash' && (
        <div className="flex flex-col gap-2">
          <Field label="Uang diterima">
            <Input
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder={String(total)}
            />
          </Field>
          <div className="grid grid-cols-5 gap-2">
            {CASH_QUICK.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setCashInput(String(amount))}
                className="rounded-lg border border-[var(--line)] px-1 py-1.5 text-[11px] text-muted hover:text-ink"
              >
                {formatIDR(amount)}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Kembalian</span>
            <span className="font-medium text-ink">{formatIDR(change)}</span>
          </div>
        </div>
      )}

      {isAsync && !splitMode && (
        <Alert kind="info">
          {PAYMENT_LABELS[method]} menunggu konfirmasi webhook gateway.
        </Alert>
      )}

      {error && <Alert kind="error">{error}</Alert>}

      <Button className="mt-auto" onClick={submit} disabled={busy}>
        {busy ? 'Memproses…' : `Bayar ${formatIDR(total)}`}
      </Button>
    </div>
  );
}
