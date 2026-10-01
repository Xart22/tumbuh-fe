'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { categorySales, listProducts, menuEngineering, productTrend, topProducts } from '@/lib/api';
import { formatIDR, formatNumber } from '@/lib/format';
import type { TopProduct } from '@/lib/types';
import { Section, DataTable } from '../reports-primitives';
import type { Range } from '../report-utils';
import { MenuEngineeringStudio } from './menu-engineering-studio';

function ProductsTab({ applied }: { applied: Range }) {
  const topQ = useQuery({
    queryKey: ['reports', 'top-products', applied.dateFrom, applied.dateTo],
    queryFn: () => topProducts(applied.dateFrom, applied.dateTo, 10),
  });
  const productsQ = useQuery({
    queryKey: ['reports', 'products-for-trend'],
    queryFn: listProducts,
  });
  const [productId, setProductId] = useState('');
  const trendQ = useQuery({
    queryKey: ['reports', 'product-trend', productId],
    queryFn: () => productTrend(productId, 30),
    enabled: productId !== '',
  });

  const products = productsQ.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-lp-on-surface">Top 10 Menu Terlaris</h2>
        <Section
          q={topQ}
          render={(items: TopProduct[]) =>
            items.length === 0 ? (
              <p className="text-sm text-lp-tertiary">Belum ada data penjualan produk pada rentang ini.</p>
            ) : (
              <DataTable
                head={['Peringkat', 'Nama Menu', 'Kuantitas Terjual', 'Total Omzet']}
                align={['left', 'left', 'right', 'right']}
                rows={items.map((item, idx) => [
                  `#${idx + 1}`,
                  item.name ?? 'Produk',
                  `${formatNumber(item.qty ?? 0)} Porsi`,
                  formatIDR(item.revenue ?? 0),
                ])}
              />
            )
          }
        />
      </div>

      <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-lp-on-surface">Tren Penjualan Produk (30 Hari)</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-lp-tertiary">Pilih Produk:</span>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-10 rounded-lg border border-lp-surface-container bg-lp-surface-low px-3 text-xs text-lp-on-surface outline-none focus:ring-2 focus:ring-lp-primary"
            >
              <option value="">Pilih menu…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {productId === '' ? (
          <p className="text-sm text-lp-tertiary">Pilih produk di atas untuk melihat tren omzet.</p>
        ) : (
          <Section
            q={trendQ}
            render={(data) =>
              data.points.length === 0 ? (
                <p className="text-sm text-lp-tertiary">Belum ada transaksi untuk produk ini.</p>
              ) : (
                <DataTable
                  head={['Tanggal', 'Qty Terjual', 'Total Omzet']}
                  align={['left', 'right', 'right']}
                  rows={data.points.map((point) => [
                    point.date,
                    formatNumber(point.qty),
                    formatIDR(point.revenue),
                  ])}
                />
              )
            }
          />
        )}
      </div>
    </div>
  );
}

function InventoryTab({
  applied,
  onSelectPreset,
}: {
  applied: Range;
  onSelectPreset?: (preset: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom') => void;
}) {
  const categoriesQ = useQuery({
    queryKey: ['reports', 'by-category', applied.dateFrom, applied.dateTo],
    queryFn: () => categorySales(applied.dateFrom, applied.dateTo),
  });
  const engineeringQ = useQuery({
    queryKey: ['reports', 'menu-engineering', applied.dateFrom, applied.dateTo],
    queryFn: () => menuEngineering(applied.dateFrom, applied.dateTo),
  });

  const totalCategoryRev = useMemo(() => {
    return (categoriesQ.data ?? []).reduce((sum, r) => sum + r.revenue, 0);
  }, [categoriesQ.data]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Menu Engineering Studio */}
      <div className="rounded-2xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <Section
          q={engineeringQ}
          render={(data) => (
            <MenuEngineeringStudio
              data={data}
              applied={applied}
              onSelectPreset={onSelectPreset}
            />
          )}
        />
      </div>

      {/* 2. Category Contribution */}
      <div className="rounded-2xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3 border-b border-lp-surface-container/60 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lp-secondary-container/20 text-lp-secondary">
            <Icon name="category" className="text-[20px]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-lp-on-surface">
              Kontribusi Penjualan per Kategori Bahan
            </h2>
            <p className="text-xs text-lp-tertiary">
              Proporsi omzet dan kuantitas menu terjual berdasarkan kelompok kategori menu/bahan.
            </p>
          </div>
        </div>

        <Section
          q={categoriesQ}
          render={(byCategory) =>
            byCategory.length === 0 ? (
              <div className="py-6 text-center text-xs text-lp-tertiary">
                <Icon name="folder_off" className="text-[28px] opacity-50 block mx-auto mb-1" />
                <span>Belum ada data penjualan kategori pada periode ini.</span>
              </div>
            ) : (
              <DataTable
                head={['Kategori', 'Qty Terjual', 'Total Omzet', 'Proporsi Omzet']}
                align={['left', 'right', 'right', 'right']}
                rows={byCategory.map((row) => {
                  const share = totalCategoryRev > 0 ? (row.revenue / totalCategoryRev) * 100 : 0;
                  return [
                    <span key="cat" className="font-semibold text-lp-on-surface">
                      {row.category || 'Tanpa Kategori'}
                    </span>,
                    `${formatNumber(row.soldQty)} Porsi`,
                    formatIDR(row.revenue),
                    <div key="share" className="flex items-center justify-end gap-2">
                      <span className="font-lp-mono font-bold text-lp-on-surface">
                        {share.toFixed(1)}%
                      </span>
                      <div className="h-1.5 w-16 rounded-full bg-lp-surface-container overflow-hidden">
                        <div
                          className="h-full rounded-full bg-lp-secondary"
                          style={{ width: `${Math.min(100, Math.round(share))}%` }}
                        />
                      </div>
                    </div>,
                  ];
                })}
              />
            )
          }
        />
      </div>
    </div>
  );
}

export function MenuTab({
  applied,
  onSelectPreset,
}: {
  applied: Range;
  onSelectPreset?: (preset: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <ProductsTab applied={applied} />
      <InventoryTab applied={applied} onSelectPreset={onSelectPreset} />
    </div>
  );
}