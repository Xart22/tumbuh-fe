'use client';

import { useMemo, useState } from 'react';
import { formatIDR } from '@/lib/format';
import type { Category, Product } from '@/lib/types';
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
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-[var(--line)] p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari menu…"
        />
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          <Chip
            label="Semua"
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            Tidak ada menu yang cocok.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onPick(product)}
                className="flex flex-col items-start gap-1 rounded-xl border border-[var(--line)] bg-panel p-3 text-left transition-colors hover:border-teal-700"
              >
                <span className="line-clamp-2 min-h-10 text-sm font-medium text-ink">
                  {product.name}
                </span>
                <span className="text-sm text-teal-400">
                  {formatIDR(product.basePrice)}
                </span>
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
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? 'border-teal-600 bg-teal-950/40 text-ink'
          : 'border-[var(--line)] text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}
