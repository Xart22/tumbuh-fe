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
import {
  applyVoucherToOrder,
  removeVoucherFromOrder,
  setOrderDiscount,
  type OrderAdjustmentResult,
  type PayInput,
} from '@/lib/api';
import { Icon } from './icon';
import { ConfirmDialog } from './ui/confirm-dialog';
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

const METHOD_ICONS: Record<PaymentMethod, string> = {
  cash: 'payments',
  qris: 'qr_code_2',
  qris_dynamic: 'qr_code',
  debit: 'credit_card',
  credit: 'credit_score',
  ewallet_gopay: 'account_balance_wallet',
  ewallet_ovo: 'account_balance_wallet',
  ewallet_dana: 'account_balance_wallet',
  ewallet_shopeepay: 'account_balance_wallet',
  deposit: 'account_balance',
};

/**
 * Totals come from the created order, not from the client: the outlet's tax and
 * service-charge settings live on the server, so only `order.total` is payable.
 */
export function PaymentPanel({
  order,
  onBack,
  onSubmit,
  onOrderChange,
}: {
  order: CreatedOrder;
  onBack: () => void;
  onSubmit: (payment: PayInput) => Promise<void>;
  onOrderChange?: (patch: Partial<OrderAdjustmentResult>) => void;
}) {
  const total = order.total;
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [splitMode, setSplitMode] = useState(false);
  const [splitSecond, setSplitSecond] = useState<PaymentMethod>('debit');
  const [splitFirstAmount, setSplitFirstAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDepositOpen, setConfirmDepositOpen] = useState(false);

  const [showAdjust, setShowAdjust] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  const voucherActive = appliedVoucher !== null;
  const manualActive = !voucherActive && order.discountAmount > 0;

  function applyTotals(res: OrderAdjustmentResult) {
    onOrderChange?.({
      discountAmount: res.discountAmount,
      taxAmount: res.taxAmount,
      serviceCharge: res.serviceCharge,
      total: res.total,
    });
  }

  async function applyManualDiscount() {
    const amount = Number(manualInput.replace(/\D/g, '') || 0);
    if (amount <= 0) return;
    setAdjusting(true);
    setAdjustError(null);
    try {
      applyTotals(await setOrderDiscount(order.id, amount, 'Diskon manual'));
      setManualInput('');
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Gagal menerapkan diskon.');
    } finally {
      setAdjusting(false);
    }
  }

  async function applyVoucher() {
    const code = voucherInput.trim();
    if (!code) return;
    setAdjusting(true);
    setAdjustError(null);
    try {
      const res = await applyVoucherToOrder(order.id, code);
      applyTotals(res);
      setAppliedVoucher(res.code);
      setVoucherInput('');
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Voucher tidak valid.');
    } finally {
      setAdjusting(false);
    }
  }

  async function removeVoucher() {
    setAdjusting(true);
    setAdjustError(null);
    try {
      applyTotals(await removeVoucherFromOrder(order.id));
      setAppliedVoucher(null);
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Gagal menghapus voucher.');
    } finally {
      setAdjusting(false);
    }
  }

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
      setConfirmDepositOpen(true);
      return;
    }

    await executeSubmit();
  }

  async function executeSubmit() {
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
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4 bg-lp-surface-container-lowest">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-lp-on-surface-variant hover:text-lp-on-surface transition-colors"
        >
          <Icon name="arrow_back" className="text-sm" />
          <span>Kembali ke Menu</span>
        </button>
        <button
          type="button"
          onClick={() => setSplitMode((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-bold text-lp-primary hover:text-lp-primary-container transition-colors"
        >
          <Icon name="call_split" className="text-sm" />
          <span>{splitMode ? 'Batal Split' : 'Split Pembayaran'}</span>
        </button>
      </div>

      <div className="rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-low p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="font-lp-mono text-[11px] font-bold text-lp-primary bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            {order.orderNumber}
          </span>
          <span className="text-[11px] font-medium text-lp-on-surface-variant">Total Tagihan</span>
        </div>
        <p className="mt-1.5 text-2xl font-extrabold font-lp-mono text-lp-on-surface tracking-tight">
          {formatIDR(total)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-1 border-t border-lp-outline-variant/20 pt-2 text-xs text-lp-on-surface-variant">
          <p>Subtotal: <span className="font-lp-mono font-medium">{formatIDR(order.subtotal)}</span></p>
          {order.discountAmount > 0 && (
            <p className="text-lp-error">Diskon: <span className="font-lp-mono font-medium">-{formatIDR(order.discountAmount)}</span></p>
          )}
          {order.serviceCharge > 0 && (
            <p>Service: <span className="font-lp-mono font-medium">{formatIDR(order.serviceCharge)}</span></p>
          )}
          <p>Pajak: <span className="font-lp-mono font-medium">{formatIDR(order.taxAmount)}</span></p>
        </div>
      </div>

      <div className="rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-low">
        <button
          type="button"
          onClick={() => setShowAdjust((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-bold text-lp-on-surface"
        >
          <span className="flex items-center gap-1.5">
            <Icon name="sell" className="text-base text-lp-primary" />
            <span>Diskon &amp; Voucher</span>
            {order.discountAmount > 0 && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-lp-mono text-[10px] font-bold text-lp-primary">
                -{formatIDR(order.discountAmount)}
              </span>
            )}
          </span>
          <Icon name={showAdjust ? 'expand_less' : 'expand_more'} className="text-base text-lp-on-surface-variant" />
        </button>

        {showAdjust && (
          <div className="flex flex-col gap-2.5 border-t border-lp-outline-variant/20 p-3.5">
            {voucherActive ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-lp-primary font-lp-mono">
                  <Icon name="confirmation_number" className="text-sm" />
                  {appliedVoucher}
                </span>
                <button
                  type="button"
                  onClick={() => void removeVoucher()}
                  disabled={adjusting}
                  className="text-[11px] font-semibold text-lp-error hover:text-red-700 disabled:opacity-50"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <>
                <Field label="Kode Voucher">
                  <div className="flex gap-2">
                    <Input
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                      placeholder="mis. HEMAT10"
                      className="font-lp-mono text-xs uppercase"
                      disabled={manualActive || adjusting}
                    />
                    <Button
                      type="button"
                      variant="subtle"
                      className="shrink-0 px-3 text-xs"
                      onClick={() => void applyVoucher()}
                      disabled={manualActive || adjusting || !voucherInput.trim()}
                    >
                      Pakai
                    </Button>
                  </div>
                </Field>

                <Field label="Diskon Manual (Rp)">
                  <div className="flex gap-2">
                    <Input
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value.replace(/\D/g, ''))}
                      inputMode="numeric"
                      placeholder="0"
                      className="font-lp-mono text-xs"
                      disabled={adjusting}
                    />
                    <Button
                      type="button"
                      variant="subtle"
                      className="shrink-0 px-3 text-xs"
                      onClick={() => void applyManualDiscount()}
                      disabled={adjusting || !manualInput.replace(/\D/g, '')}
                    >
                      Terapkan
                    </Button>
                  </div>
                </Field>

                {manualActive && (
                  <p className="text-[11px] text-lp-on-surface-variant">
                    Diskon manual aktif. Ubah nominal atau kosongkan lalu Terapkan 0 untuk membatalkan.
                  </p>
                )}
              </>
            )}

            {adjustError && <Alert kind="error">{adjustError}</Alert>}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant">
          Pilih Metode Bayar
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {METHOD_ORDER.map((m) => {
            const active = m === method;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-all ${
                  active
                    ? 'border-2 border-lp-primary bg-emerald-50/70 text-lp-primary shadow-xs font-bold'
                    : 'border-lp-outline-variant/30 bg-lp-surface-container-lowest text-lp-on-surface-variant hover:bg-lp-surface-low hover:border-lp-outline-variant/60 font-medium'
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-lp-primary text-white' : 'bg-lp-surface-container text-lp-on-surface-variant'}`}>
                  <Icon name={METHOD_ICONS[m] ?? 'payment'} className="text-base" />
                </span>
                <span className="truncate">{PAYMENT_LABELS[m]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {splitMode && (
        <div className="flex flex-col gap-3 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-low p-3.5">
          <Field label={`${PAYMENT_LABELS[method]} — Nominal Pertama`}>
            <Input
              value={splitFirstAmount}
              onChange={(e) => setSplitFirstAmount(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="0"
              className="font-lp-mono text-sm"
            />
          </Field>
          <Field label="Metode Pembayaran Kedua">
            <select
              value={splitSecond}
              onChange={(e) => setSplitSecond(e.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-lp-outline-variant/40 bg-lp-surface-container-lowest px-3 py-2.5 text-xs text-lp-on-surface outline-none focus:border-lp-primary"
            >
              {METHOD_ORDER.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-center justify-between text-xs text-lp-on-surface-variant border-t border-lp-outline-variant/20 pt-2 font-medium">
            <span>Sisa Pelunasan:</span>
            <span className="font-bold font-lp-mono text-lp-primary">{formatIDR(splitSecondAmount)} via {PAYMENT_LABELS[splitSecond]}</span>
          </div>
        </div>
      )}

      {!splitMode && method === 'cash' && (
        <div className="flex flex-col gap-3">
          <Field label="Uang Tunai Diterima">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-lp-mono text-xs font-bold text-lp-on-surface-variant">
                Rp
              </span>
              <Input
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                placeholder={String(total)}
                className="pl-9 font-lp-mono text-base font-bold"
              />
            </div>
          </Field>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-lp-on-surface-variant">Pecahan Cepat</span>
              <button
                type="button"
                onClick={() => setCashInput(String(total))}
                className="text-[11px] font-bold text-lp-primary hover:underline"
              >
                Uang Pas ({formatIDR(total)})
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {CASH_QUICK.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setCashInput(String(amount))}
                  className="rounded-lg border border-lp-outline-variant/30 bg-lp-surface-low px-1 py-1.5 text-center text-[10px] font-lp-mono font-medium text-lp-on-surface hover:bg-lp-surface-container hover:border-lp-outline-variant transition-colors"
                >
                  {formatIDR(amount).replace('Rp\u00a0', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Kembalian</span>
            <span className="text-lg font-bold font-lp-mono text-lp-primary">{formatIDR(change)}</span>
          </div>
        </div>
      )}

      {isAsync && !splitMode && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 flex items-center gap-2">
          <Icon name="info" className="text-base text-blue-600 shrink-0" />
          <span>{PAYMENT_LABELS[method]} memerlukan pemindaian QR pelanggan dan konfirmasi otomatis gateway.</span>
        </div>
      )}

      {error && <Alert kind="error">{error}</Alert>}

      <Button
        className="mt-auto h-12 text-sm font-bold shadow-sm flex items-center justify-center gap-2"
        onClick={submit}
        disabled={busy}
      >
        <Icon name="check_circle" className="text-base" />
        <span>{busy ? 'Memproses Transaksi...' : `Bayar ${formatIDR(total)}`}</span>
      </Button>

      <ConfirmDialog
        open={confirmDepositOpen}
        title="Simpan sebagai Deposit?"
        description={`Uang tunai yang diterima kurang ${formatIDR(total - cashReceived)}. Simpan sisa tagihan pesanan sebagai deposit / piutang pelanggan?`}
        confirmText="Ya, Simpan Deposit"
        cancelText="Batal & Ubah Nominal"
        variant="primary"
        icon="account_balance_wallet"
        isLoading={busy}
        onClose={() => setConfirmDepositOpen(false)}
        onConfirm={async () => {
          setConfirmDepositOpen(false);
          await executeSubmit();
        }}
      />
    </div>
  );
}
