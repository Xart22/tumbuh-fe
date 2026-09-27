import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { formatIDR, formatQty } from '@/lib/format';
import type { StockLevel } from '@/lib/types';

const MAX_ROWS = 4;

function statusTone(status: string): {
  chip: string;
  bar: string;
  text: string;
  label: string;
  icon: string;
  bg: string;
} {
  if (status === 'critical') {
    return {
      chip: 'bg-lp-error text-lp-on-error',
      bar: 'bg-lp-error',
      text: 'text-lp-error',
      label: 'Darurat',
      icon: 'warning',
      bg: 'bg-lp-error-container/40 hover:bg-lp-error-container/60',
    };
  }
  return {
    chip: 'bg-lp-secondary-container text-lp-on-secondary-container',
    bar: 'bg-lp-secondary-container',
    text: 'text-lp-secondary',
    label: 'Menipis',
    icon: 'hourglass_bottom',
    bg: 'bg-lp-surface-container-high/60 hover:bg-lp-surface-container-high',
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
}: {
  rows: StockLevel[];
  loading: boolean;
  inventoryValue?: number | null;
}) {
  const critical = rows.filter((row) => row.status === 'critical').length;
  const shown = rows.slice(0, MAX_ROWS);

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl bg-lp-surface-container-lowest p-6 shadow-sm">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                rows.length > 0 ? 'bg-lp-error' : 'bg-lp-primary'
              }`}
            />
            <h2 className="text-lg font-bold text-lp-on-surface">
              Peringatan Bahan Baku
            </h2>
          </div>
          {rows.length > 0 && (
            <span className="rounded-full bg-lp-error-container px-2 py-0.5 text-[11px] font-bold text-lp-on-error-container">
              {critical || rows.length} Kritis
            </span>
          )}
        </div>

        <p className="text-xs text-lp-tertiary">
          Stok di bawah batas minimum (Safety Stock Level). Berpotensi kehabisan sebelum
          shift malam selesai.
        </p>

        {inventoryValue !== null && (
          <p className="text-xs text-lp-tertiary">
            Nilai aset persediaan:{' '}
            <span className="font-lp-mono font-semibold text-lp-on-surface">
              {formatIDR(inventoryValue)}
            </span>
          </p>
        )}

        {/* Stock Items List */}
        {loading ? (
          <p className="mt-2 text-sm text-lp-on-surface-variant">Memuat stok bahan…</p>
        ) : rows.length === 0 ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-lp-surface-low p-3 text-sm text-lp-on-surface-variant">
            <Icon name="check_circle" className="text-[20px] text-lp-primary" />
            <span>Semua bahan aman di atas batas stok minimum.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
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
                  className={`flex flex-col gap-1.5 rounded-lg p-3 transition-colors ${tone.bg}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold text-lp-on-surface">
                        {row.name}
                      </span>
                      <span className="truncate text-xs text-lp-tertiary">
                        {row.usageNote ?? 'Bahan utama operasional'}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${tone.chip}`}
                    >
                      {tone.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5 text-xs">
                    <div className={`flex items-center gap-1.5 font-lp-mono font-medium ${tone.text}`}>
                      <Icon name={tone.icon} className="text-[16px]" />
                      <span>
                        Sisa {formatQty(row.currentQty)} {row.unit}
                      </span>
                    </div>
                    <span className="text-[11px] text-lp-tertiary">
                      {eta ? `Cukup s/d ${eta}` : `Min. ${formatQty(row.minQty)} ${row.unit}`}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-lp-surface-container-highest">
                    <div
                      className={`h-full rounded-full transition-all ${tone.bar}`}
                      style={{ width: `${Math.max(level, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <Button
          asChild
          className="h-11 w-full gap-2 rounded-lg bg-lp-primary text-lp-on-primary shadow-sm transition-all hover:bg-lp-primary-container"
        >
          <Link href="/inventory">
            <Icon name="shopping_cart_checkout" className="text-[18px]" />
            <span>Order Ulang / Catat Belanja</span>
          </Link>
        </Button>
        <Link
          href="/inventory"
          className="text-center text-xs text-lp-tertiary transition-colors hover:underline"
        >
          Lihat Riwayat Purchase Order Supplier
        </Link>
      </div>
    </div>
  );
}
