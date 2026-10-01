import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { formatIDR, formatQty } from '@/lib/format';
import type { StockLevel } from '@/lib/types';

function statusTone(status: string): {
  chip: string;
  bar: string;
  text: string;
  label: string;
  icon: string;
  cardBg: string;
  cardBorder: string;
} {
  if (status === 'critical') {
    return {
      chip: 'bg-lp-error text-lp-on-error',
      bar: 'bg-lp-error',
      text: 'text-lp-error',
      label: 'Darurat',
      icon: 'warning',
      cardBg: 'bg-lp-error-container/20 hover:bg-lp-error-container/30',
      cardBorder: 'border-lp-error-container/60',
    };
  }
  return {
    chip: 'bg-lp-secondary-container text-lp-on-secondary-container',
    bar: 'bg-lp-secondary-container',
    text: 'text-lp-secondary',
    label: 'Menipis',
    icon: 'hourglass_bottom',
    cardBg: 'bg-lp-surface-low hover:bg-lp-surface-container/40',
    cardBorder: 'border-lp-surface-container',
  };
}

function emptyEta(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function StockAlertPanel({
  rows,
  loading,
  inventoryValue = null,
  className = '',
}: {
  rows: StockLevel[];
  loading: boolean;
  inventoryValue?: number | null;
  className?: string;
}) {
  const critical = rows.filter((row) => row.status === 'critical').length;

  return (
    <div
      className={`flex h-full min-h-[420px] flex-col justify-between gap-5 rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm transition-all ${className}`}
    >
      <div className="flex flex-col gap-3.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                rows.length > 0
                  ? 'bg-lp-error-container/60 text-lp-error'
                  : 'bg-lp-primary-fixed/50 text-lp-primary'
              }`}
            >
              <Icon
                name={rows.length > 0 ? 'warning' : 'inventory_2'}
                className="text-[20px]"
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-lp-on-surface">
                Peringatan Bahan Baku
              </h2>
              <span className="text-xs text-lp-tertiary">
                Batas stok minimum (Safety Stock)
              </span>
            </div>
          </div>

          {rows.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-lp-error/20 bg-lp-error-container px-2.5 py-0.5 text-[11px] font-bold text-lp-on-error-container">
              <span className="h-1.5 w-1.5 rounded-full bg-lp-error" />
              <span>
                {critical > 0 ? `${critical} Kritis` : `${rows.length} Menipis`}
                {rows.length > 3 ? ` (${rows.length} Bahan)` : ''}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-lp-primary/20 bg-lp-surface-low px-2.5 py-0.5 text-[11px] font-bold text-lp-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-lp-primary" />
              <span>Aman</span>
            </span>
          )}
        </div>

        {/* Total inventory asset value ribbon */}
        {inventoryValue !== null && (
          <div className="flex items-center justify-between rounded-lg border border-lp-surface-container/70 bg-lp-surface-low/80 px-3 py-2 text-xs">
            <span className="text-lp-tertiary">Nilai Aset Persediaan</span>
            <span className="font-lp-mono font-bold text-lp-on-surface">
              {formatIDR(inventoryValue)}
            </span>
          </div>
        )}

        {/* Stock Items List - Renders all items with internal scroll to maintain 516px card height */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-sm text-lp-on-surface-variant">Memuat stok bahan…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-lp-surface-container bg-lp-surface-low/50 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lp-primary/10 text-lp-primary">
              <Icon name="check_circle" className="text-[28px]" />
            </div>
            <p className="text-sm font-semibold text-lp-on-surface">
              Semua Stok Bahan Aman
            </p>
            <p className="max-w-[220px] text-xs text-lp-tertiary">
              Tidak ada bahan baku yang berada di bawah ambang batas stok minimum.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1.5 max-h-[265px] [scrollbar-width:thin] [scrollbar-color:var(--color-lp-surface-container)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-lp-surface-container hover:[&::-webkit-scrollbar-thumb]:bg-lp-outline-variant/60">
            {rows.map((row) => {
              const tone = statusTone(row.status);
              const eta = emptyEta(row.depletedAt);
              const etaDisplay = eta
                ? `Cukup s/d ${eta}`
                : row.depletedAt
                  ? row.depletedAt
                  : `Min. ${formatQty(row.minQty)} ${row.unit}`;
              const level =
                row.minQty > 0
                  ? Math.min((row.currentQty / row.minQty) * 100, 100)
                  : 0;

              return (
                <div
                  key={row.ingredientId}
                  className={`flex flex-col gap-2 rounded-xl p-3 border transition-all ${tone.cardBorder} ${tone.cardBg}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold text-lp-on-surface">
                        {row.name}
                      </span>
                      {row.usageNote && (
                        <span className="truncate text-[11px] text-lp-tertiary">
                          {row.usageNote}
                        </span>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-2xs ${tone.chip}`}
                    >
                      {tone.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div
                      className={`flex items-center gap-1.5 font-lp-mono font-bold ${tone.text}`}
                    >
                      <Icon name={tone.icon} className="text-[15px]" />
                      <span>
                        Sisa {formatQty(row.currentQty)} {row.unit}
                      </span>
                    </div>
                    <span className="font-lp-mono text-[11px] text-lp-tertiary">
                      {etaDisplay}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-lp-surface-container">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${tone.bar}`}
                      style={{ width: `${Math.max(level, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA Buttons */}
      <div className="flex flex-col gap-2 border-t border-lp-surface-container pt-3">
        <Button
          asChild
          className="h-11 w-full gap-2 rounded-lg bg-lp-primary text-lp-on-primary font-semibold shadow-sm transition-all hover:bg-lp-primary-container"
        >
          <Link href="/inventory">
            <Icon name="shopping_cart_checkout" className="text-[18px]" />
            <span>Order Ulang / Catat Belanja</span>
          </Link>
        </Button>
        <Link
          href="/inventory"
          className="flex items-center justify-center gap-1.5 py-1 text-center text-xs font-medium text-lp-tertiary transition-colors hover:text-lp-primary hover:underline"
        >
          <Icon name="history" className="text-[15px]" />
          <span>Lihat Riwayat Purchase Order Supplier</span>
        </Link>
      </div>
    </div>
  );
}
