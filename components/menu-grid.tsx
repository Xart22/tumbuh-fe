'use client';

import { useMemo, useState } from 'react';
import { formatIDR } from '@/lib/format';
import type { Category, Product } from '@/lib/types';
import { Icon } from './icon';
import { Input } from './pos-ui';

export function MenuGrid({
  categories,
  products,
  onPick,
}: {
  categories: Category[];
  products: Product[];
  onPick: (product: Product) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (!product.isAvailable) return false;
      if (activeCategory !== 'all' && product.categoryId !== activeCategory) {
        return false;
      }
      return !needle || product.name.toLowerCase().includes(needle);
    });
  }, [products, activeCategory, query]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-lp-background">
      <div className="border-b border-lp-outline-variant/25 bg-lp-surface-container-lowest p-3 shadow-2xs">
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama menu / produk..."
            className="pl-9 text-xs"
          />
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lp-on-surface-variant/60">
            <Icon name="search" className="text-base" />
          </div>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-lp-on-surface-variant hover:text-lp-on-surface"
              aria-label="Bersihkan pencarian"
            >
              <Icon name="close" className="text-sm" />
            </button>
          )}
        </div>

        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <Chip
            label="Semua Menu"
            count={products.filter((p) => p.isAvailable).length}
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {categories.map((category) => {
            const count = products.filter(
              (p) => p.isAvailable && p.categoryId === category.id,
            ).length;
            return (
              <Chip
                key={category.id}
                label={category.name}
                count={count}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lp-surface-container text-lp-on-surface-variant">
              <Icon name="restaurant_menu" className="text-2xl" />
            </div>
            <p className="mt-3 text-sm font-semibold text-lp-on-surface">Tidak ada menu yang cocok</p>
            <p className="mt-0.5 text-xs text-lp-on-surface-variant">Coba ketik kata kunci lain atau pilih kategori Semua</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onPick(product)}
                className="group relative flex flex-col justify-between rounded-xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-3 text-left shadow-2xs transition-all hover:border-lp-primary hover:shadow-md active:scale-[0.98]"
              >
                <div className="min-w-0 w-full">
                  <span className="line-clamp-2 min-h-10 text-xs font-semibold text-lp-on-surface leading-snug group-hover:text-lp-primary transition-colors">
                    {product.name}
                  </span>
                </div>
                <div className="mt-2.5 flex w-full items-center justify-between border-t border-lp-outline-variant/15 pt-2">
                  <span className="text-xs font-bold font-lp-mono text-lp-primary">
                    {formatIDR(product.basePrice)}
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-lp-primary group-hover:bg-lp-primary group-hover:text-white transition-colors">
                    <Icon name="add" className="text-sm font-bold" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
        active
          ? 'border-lp-primary bg-lp-primary font-semibold text-white shadow-xs'
          : 'border-lp-outline-variant/30 bg-lp-surface-container-lowest text-lp-on-surface-variant hover:bg-lp-surface-low hover:text-lp-on-surface font-medium'
      }`}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-lp-mono font-medium ${
            active ? 'bg-white/20 text-white' : 'bg-lp-surface-container text-lp-on-surface-variant'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
