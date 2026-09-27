import Link from 'next/link';
import { Icon } from '@/components/icon';
import { formatIDR, formatNumber } from '@/lib/format';
import {
  PAYMENT_LABELS,
  PAYMENT_METHODS,
  type CashDrawer,
  type PaymentMethod,
  type PaymentMethodRow,
} from '@/lib/types';

export type MethodRow = PaymentMethodRow;

/** Methods that settle without touching the cash drawer. */
const CASHLESS = new Set([
  'qris',
  'qris_dynamic',
  'debit',
  'credit',
  'ewallet_gopay',
  'ewallet_ovo',
  'ewallet_dana',
  'ewallet_shopeepay',
  'deposit',
]);

/** Display labels and accent colors aligned with Stitch design tokens. */
export function methodMeta(method: string): { label: string; color: string; badgeColor: string; hint: string } {
  const known = (PAYMENT_METHODS as readonly string[]).includes(method);
  const label = known ? PAYMENT_LABELS[method as PaymentMethod] : method;

  if (method === 'qris' || method === 'qris_dynamic') {
    return {
      label: 'QRIS Dinamis POS',
      color: 'bg-lp-primary',
      badgeColor: 'text-lp-primary',
      hint: 'BCA, GoPay, OVO, ShopeePay',
    };
  }
  if (method === 'debit' || method === 'credit') {
    return {
      label: 'Kartu Debit & EDC',
      color: 'bg-lp-secondary-container',
      badgeColor: 'text-lp-secondary',
      hint: 'BCA, Mandiri, BRI',
    };
  }
  if (method === 'cash') {
    return {
      label: 'Uang Tunai (Cash)',
      color: 'bg-lp-tertiary',
      badgeColor: 'text-lp-tertiary',
      hint: 'Cash drawer kasir',
    };
  }
  return {
    label,
    color: 'bg-lp-outline',
    badgeColor: 'text-lp-on-surface-variant',
    hint: 'Direct e-wallet API',
  };
}

export function PaymentMethodsPanel({
  rows,
  cashDrawer = null,
}: {
  rows: MethodRow[];
  cashDrawer?: CashDrawer | null;
}) {
  const grand = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const enriched = rows.map((row) => ({
    ...row,
    meta: methodMeta(row.method),
    share: row.percentage ?? (grand > 0 ? ((row.amount ?? 0) / grand) * 100 : 0),
  }));

  const cashlessAmount = enriched
    .filter((row) => CASHLESS.has(row.method))
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const cashlessPct = grand > 0 ? (cashlessAmount / grand) * 100 : null;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl bg-lp-surface-container-lowest p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-lp-on-surface">
              Metode Pembayaran Terpopuler
            </h2>
            <span className="text-xs text-lp-tertiary">
              Distribusi transaksi non-tunai vs tunai hari ini
            </span>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lp-surface-low text-lp-secondary">
            <Icon name="account_balance_wallet" className="text-[20px]" filled />
          </span>
        </div>

        {/* Visual Combined Progress Bar */}
        {cashlessPct !== null && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-lp-tertiary">
                Rasio Channel Pembayaran
              </span>
              <span className="font-lp-mono font-bold text-lp-on-surface">
                {cashlessPct.toFixed(0)}% Cashless
              </span>
            </div>
            <div className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full bg-lp-surface-low p-0.5">
              {enriched.map((row, idx) => (
                <span
                  key={row.method}
                  className={`h-full transition-all ${row.meta.color} ${
                    idx === 0 ? 'rounded-l-full' : ''
                  } ${idx === enriched.length - 1 ? 'rounded-r-full' : ''}`}
                  style={{ width: `${Math.max(row.share, 3)}%` }}
                  title={`${row.meta.label} ${row.share.toFixed(0)}%`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 2x2 Breakdown Cards Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {enriched.map((row) => (
            <div
              key={row.method}
              className="flex flex-col gap-1 rounded-lg bg-lp-surface-low p-3 transition-colors hover:bg-lp-surface-container/60"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-lp-on-surface">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.meta.color}`} />
                  <span className="truncate">{row.meta.label}</span>
                </span>
                <span
                  className={`shrink-0 rounded bg-lp-surface-container-lowest px-1.5 py-0.5 font-lp-mono text-[11px] font-bold ${row.meta.badgeColor}`}
                >
                  {row.share.toFixed(0)}%
                </span>
              </div>
              <div className="font-lp-mono text-base font-bold text-lp-on-surface">
                {formatIDR(row.amount ?? 0)}
              </div>
              <span className="text-[11px] text-lp-tertiary">
                {row.transactionCount !== undefined
                  ? `${formatNumber(row.transactionCount)} transaksi`
                  : row.meta.hint}
                {row.method === 'cash' && cashDrawer && (
                  <span className="ml-1 text-lp-primary">· Drawer seimbang</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Settlement & Reconciliation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-lp-surface-container-high/40 p-2.5">
        <div className="flex items-center gap-2">
          <Icon name="verified_user" className="text-[18px] text-lp-primary" />
          <span className="text-xs text-lp-on-surface">
            {cashDrawer ? (
              <>
                Kas drawer:{' '}
                <b>
                  tercatat {formatIDR(cashDrawer.expectedCash)} · dihitung{' '}
                  {formatIDR(cashDrawer.countedCash)}
                </b>
              </>
            ) : (
              <>
                Settlement Otomatis Bank:{' '}
                <b>Pukul 23:30 WIB</b>
              </>
            )}
          </span>
        </div>
        <Link
          href="/reports"
          className="text-xs font-bold text-lp-primary transition-colors hover:underline"
        >
          Rekonsiliasi Kas
        </Link>
      </div>
    </div>
  );
}
