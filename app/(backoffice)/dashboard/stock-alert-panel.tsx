import Link from 'next/link';
import { Icon } from '@/components/icon';
import { formatIDR, formatQty } from '@/lib/format';
import type { StockLevel } from '@/lib/types';

const MAX_ROWS = 6;

function statusTone(status: string): {
  dot: string;
  chip: string;
  bar: string;
  text: string;
  label: string;
} {
  if (status === 'critical') {
    return {
      dot: 'bg-lp-error',
      chip: 'bg-lp-error text-lp-on-error',
      bar: 'bg-lp-error',
      text: 'text-lp-error',
      label: 'Darurat',
    };
  }
  return {
    dot: 'bg-lp-secondary-container',
    chip: 'bg-lp-secondary-fixed text-lp-on-secondary-container',
    bar: 'bg-lp-secondary',
    text: 'text-lp-secondary',
    label: 'Menipis',
  };
}

function emptyEta(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/**
 * Safety-stock warning fed by `/v1/inventory/stock-levels?belowSafetyStock=true`.
 * Always rendered: an explicit "all clear" beats a panel that silently vanishes
 * (the owner can't tell "no alerts" from "not checked").
 */
export function StockAlertPanel({
  rows,
  loading,
  inventoryValue = null,
}: {
  rows: StockLevel[];
  loading: boolean;
  /** Total inventory asset value (moving average); null while unknown. */
  inventoryValue?: number | null;
}) {
  const critical = rows.filter((row) => row.status === 'critical').length;
  const shown = rows.slice(0, MAX_ROWS);

  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${rows.length > 0 ? 'bg-lp-error' : 'bg-lp-primary'}`} />
            <h2 className="text-base font-semibold text-lp-on-surface">
              Peringatan Bahan Baku
            </h2>
          </div>
          {rows.length > 0 && (
            <span className="rounded-full bg-lp-error-container px-2 py-0.5 text-[11px] font-bold text-lp-on-error-container">
              {critical} Kritis
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-lp-tertiary">
          Stok di bawah batas minimum (safety stock level).
        </p>
        {inventoryValue !== null && (
          <p className="mt-1 text-xs text-lp-tertiary">
            Nilai persediaan:{' '}
            <span className="font-lp-mono font-semibold text-lp-on-surface">
              {formatIDR(inventoryValue)}
            </span>
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat stok bahan…</p>
      ) : rows.length === 0 ? (
        <p className="flex items-center gap-1.5 text-sm text-lp-on-surface-variant">
          <Icon name="check_circle" className="text-[18px] text-lp-primary" />
          Semua bahan di atas stok minimum.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((row) => {
            const tone = statusTone(row.status);
            const eta = emptyEta(row.depletedAt);
            const level =
              row.minQty > 0
                ? Math.min((row.currentQty / row.minQty) * 100, 100)
                : 0;
            return (
              <div
                key={row.ingredientId}
                className={`flex flex-col gap-1 rounded-lg p-2 ${
                  row.status === 'critical' ? 'bg-lp-error-container/40' : 'bg-lp-surface-low'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-lp-on-surface">
                      {row.name}
                    </span>
                    <span className="text-[11px] text-lp-tertiary">
                      {row.usageNote ?? 'Tanpa catatan pemakaian'}
                    </span>
                    {eta && (
                      <span
                        className={`mt-0.5 flex items-center gap-1 text-[11px] font-semibold ${tone.text}`}
                      >
                        <Icon name="hourglass_bottom" className="text-[14px]" />
                        Perkiraan habis {eta}
                      </span>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${tone.chip}`}
                  >
                    {tone.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-lp-surface-container">
                    <span
                      className={`block h-full rounded-full ${tone.bar}`}
                      style={{ width: `${level}%` }}
                    />
                  </div>
                  <span className="shrink-0 font-lp-mono text-xs font-semibold text-lp-on-surface">
                    {formatQty(row.currentQty)}/{formatQty(row.minQty)} {row.unit}
                  </span>
                </div>
              </div>
            );
          })}
          {rows.length > shown.length && (
            <span className="text-[11px] text-lp-tertiary">
              +{rows.length - shown.length} bahan lain di bawah minimum.
            </span>
          )}
          <Link
            href="/inventory"
            className="flex items-center gap-1 pt-1 text-[11px] font-semibold text-lp-primary hover:underline"
          >
            Kelola bahan &amp; resep di Inventori
            <Icon name="arrow_forward" className="text-[14px]" />
          </Link>
        </div>
      )}
    </div>
  );
}
