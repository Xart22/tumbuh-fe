import Link from 'next/link';
import { Icon } from '@/components/icon';
import { apiUrl } from '@/lib/api-client';
import { formatIDR, formatNumber } from '@/lib/format';
import type { TopProduct } from '@/lib/types';

export function TopProductsPanel({
  tops,
  grossRevenue,
  loading,
}: {
  tops: TopProduct[];
  grossRevenue: number;
  loading: boolean;
}) {
  const topRevenue = tops.reduce((sum, p) => sum + (p.revenue ?? 0), 0);
  const topShare = grossRevenue > 0 ? (topRevenue / grossRevenue) * 100 : null;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl bg-lp-surface-container-lowest p-6 shadow-sm">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-lp-on-surface">
              Top 5 Produk Terlaris Hari Ini
            </h2>
            <span className="text-xs text-lp-tertiary">
              Diurutkan berdasarkan frekuensi transaksi &amp; kontribusi omzet
            </span>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lp-surface-low text-lp-primary">
            <Icon name="local_fire_department" className="text-[20px]" filled />
          </span>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-lp-on-surface-variant">Memuat ringkasan produk…</p>
        ) : tops.length === 0 ? (
          <p className="mt-4 text-sm text-lp-on-surface-variant">
            Belum ada penjualan hari ini.
          </p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-lp-surface-container">
            {tops.map((product, index) => {
              const rankStr = String(index + 1).padStart(2, '0');
              const isFirst = index === 0;
              const imageSrc = product.imageUrl
                ? apiUrl(product.imageUrl)
                : null;

              return (
                <div
                  key={product.productId ?? index}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`w-6 text-center font-lp-mono text-sm font-bold ${
                        isFirst ? 'text-lp-primary' : 'text-lp-tertiary'
                      }`}
                    >
                      {rankStr}
                    </span>
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-lp-surface-container shadow-sm">
                      {imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageSrc}
                          alt={product.name ?? 'Produk'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lp-tertiary">
                          <Icon name="image" className="text-[20px]" />
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold text-lp-on-surface">
                        {product.name ?? '—'}
                      </span>
                      {product.categoryName && (
                        <span className="truncate text-xs text-lp-tertiary">
                          {product.categoryName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end pl-2">
                    <span className="font-lp-mono text-sm font-semibold text-lp-on-surface">
                      {formatNumber(product.qty ?? 0)}
                    </span>
                    <span className="font-lp-mono text-xs font-medium text-lp-primary">
                      {formatIDR(product.revenue ?? 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && tops.length > 0 && (
        <div className="flex items-center justify-between border-t border-lp-surface-container pt-3">
          <span className="text-xs text-lp-tertiary">
            {topShare !== null
              ? `Total ${tops.length} item berkontribusi ${topShare.toFixed(0)}% omzet`
              : `Total ${tops.length} item terlaris`}
          </span>
          <Link
            href="/menu"
            className="flex items-center gap-1 text-xs font-semibold text-lp-primary transition-colors hover:underline"
          >
            <span>Kelola Resep &amp; Menu</span>
            <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
      )}
    </div>
  );
}
