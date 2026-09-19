import { Icon } from '@/components/icon';
import { formatIDR } from '@/lib/format';
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

/** BE returns method codes; unknown codes fall back to the raw string. */
export function methodMeta(method: string): { label: string; color: string } {
  const known = (PAYMENT_METHODS as readonly string[]).includes(method);
  const color =
    method === 'qris' || method === 'qris_dynamic'
      ? 'bg-lp-primary'
      : method === 'cash'
        ? 'bg-lp-tertiary'
        : method === 'debit' || method === 'credit'
          ? 'bg-lp-secondary-container'
          : 'bg-lp-outline';
  return {
    label: known ? PAYMENT_LABELS[method as PaymentMethod] : method,
    color,
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
  const totalTx = rows.reduce((sum, row) => sum + (row.transactionCount ?? 0), 0);

  const cashlessAmount = enriched
    .filter((row) => CASHLESS.has(row.method))
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const cashlessPct = grand > 0 ? (cashlessAmount / grand) * 100 : null;

  return (
    <div className="flex flex-col gap-2">
      {cashlessPct !== null && (
        <div className="flex flex-col gap-1 rounded-lg bg-lp-surface-low p-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-lp-on-surface">
              Rasio Channel Pembayaran
            </span>
            <span className="text-[11px] font-bold text-lp-primary">
              {cashlessPct.toFixed(0)}% Cashless
            </span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-lp-surface-container">
            {enriched.map((row) => (
              <span
                key={row.method}
                className={row.meta.color}
                style={{ width: `${row.share}%` }}
                title={`${row.meta.label} ${row.share.toFixed(0)}%`}
              />
            ))}
          </div>
        </div>
      )}

      {enriched.map((row) => (
        <div key={row.method} className="flex flex-col gap-1 rounded-lg bg-lp-surface-low p-2">
          <div className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-lp-on-surface">
              <span className={`h-2.5 w-2.5 rounded-full ${row.meta.color}`} />
              {row.meta.label}
            </span>
            <span className="rounded bg-lp-surface-container-lowest px-1.5 py-0.5 text-[11px] font-bold text-lp-primary">
              {row.share.toFixed(0)}%
            </span>
          </div>
          <div className="font-lp-mono text-base font-semibold text-lp-on-surface">
            {formatIDR(row.amount ?? 0)}
          </div>
          {row.transactionCount !== undefined && (
            <span className="text-[11px] text-lp-tertiary">
              {row.transactionCount} transaksi
            </span>
          )}
        </div>
      ))}

      <div className="flex flex-col gap-1 rounded-lg bg-lp-surface-container-high/40 p-2">
        <div className="flex items-center gap-2">
          <Icon name="verified_user" className="text-[18px] text-lp-primary" />
          <span className="text-xs text-lp-on-surface">
            Total tercatat: <b>{formatIDR(grand)}</b> · {totalTx} transaksi
          </span>
        </div>
        {cashDrawer && (
          <div className="flex items-start gap-2">
            <Icon name="point_of_sale" className="text-[18px] text-lp-tertiary" />
            <span className="text-[11px] text-lp-on-surface-variant">
              Kas drawer: tercatat {formatIDR(cashDrawer.expectedCash)} · dihitung{' '}
              {formatIDR(cashDrawer.countedCash)} ·{' '}
              <b
                className={
                  cashDrawer.variance === 0 ? 'text-lp-primary' : 'text-lp-error'
                }
              >
                selisih {formatIDR(cashDrawer.variance)}
              </b>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
