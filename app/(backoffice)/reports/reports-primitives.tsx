'use client';

import { useMemo, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Icon } from '@/components/icon';

/** Loading / error / empty wrapper around a React Query result. */
export function Section<T>({
  q,
  render,
}: {
  q: UseQueryResult<T>;
  render: (data: T) => React.ReactNode;
}) {
  if (q.isPending) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-lp-tertiary gap-2">
        <Icon name="progress_activity" className="animate-spin text-lp-primary text-[20px]" />
        <span>Memuat data laporan…</span>
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="rounded-xl border border-lp-error-container/60 bg-lp-error-container/20 p-4 text-xs font-semibold text-lp-error">
        {q.error instanceof Error ? q.error.message : 'Gagal memuat laporan.'}
      </div>
    );
  }
  if (q.data === undefined) {
    return <p className="text-xs text-lp-tertiary">Belum ada data.</p>;
  }
  return <>{render(q.data)}</>;
}

export function MetricCard({
  label,
  value,
  delta = null,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-xl border border-lp-surface-container/70 bg-lp-surface-low p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">{label}</p>
      <p className="mt-1 font-lp-mono text-xl font-bold text-lp-on-surface">{value}</p>
      {delta !== null && (
        <div className="mt-1.5">
          <Delta pct={delta} />
        </div>
      )}
    </div>
  );
}

/** Percentage chip vs a previous period. Null = no baseline → render nothing. */
export function Delta({ pct }: { pct: number | null }) {
  if (pct === null || !Number.isFinite(pct)) return null;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up
          ? 'bg-lp-primary-fixed/40 text-lp-on-primary-fixed'
          : 'bg-lp-error-container text-lp-on-error-container'
      }`}
    >
      <Icon name={up ? 'trending_up' : 'trending_down'} className="text-[14px]" />
      {up ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  );
}

export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="text-lp-tertiary">{label}</span>
      <span className="font-lp-mono font-bold text-lp-on-surface">{value}</span>
    </div>
  );
}

export function extractCellSortValue(cell: React.ReactNode): number | string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'number') return cell;
  if (typeof cell === 'string') {
    const trimmed = cell.trim();
    // Currency: e.g. "Rp 1.500.000", "Rp -20.000", "Rp 0"
    if (trimmed.startsWith('Rp') || trimmed.includes('Rp ')) {
      const clean = trimmed.replace(/[^0-9,-]/g, '').replace(',', '.');
      const num = parseFloat(clean);
      if (!isNaN(num)) return num;
    }
    // Percentage: e.g. "25.5%", "100.0%"
    if (trimmed.endsWith('%')) {
      const num = parseFloat(trimmed.replace('%', '').replace(',', '.'));
      if (!isNaN(num)) return num;
    }
    // Quantity or count with text: e.g. "150 Porsi", "30 Transaksi", "2.000 gram", "12 Jam"
    const qtyMatch = trimmed.match(/^(-?[0-9.,]+)\s*[a-zA-Z]/);
    if (qtyMatch) {
      const clean = qtyMatch[1].replace(/\./g, '').replace(',', '.');
      const num = parseFloat(clean);
      if (!isNaN(num)) return num;
    }
    // Rank: e.g. "#1", "#10"
    if (trimmed.startsWith('#')) {
      const num = parseInt(trimmed.slice(1), 10);
      if (!isNaN(num)) return num;
    }
    // Standard formatted number: e.g. "1.250" or "25,000"
    if (/^-?[0-9]{1,3}(\.[0-9]{3})+(,[0-9]+)?$/.test(trimmed)) {
      const clean = trimmed.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(clean);
      if (!isNaN(num)) return num;
    }
    // Plain number string
    if (!isNaN(Number(trimmed)) && trimmed !== '') {
      return Number(trimmed);
    }
    return trimmed.toLowerCase();
  }
  if (typeof cell === 'boolean') return cell ? 1 : 0;
  // If React Element with children or data attributes
  if (typeof cell === 'object' && cell !== null && 'props' in cell) {
    const el = cell as React.ReactElement<{
      'data-sort'?: string | number;
      children?: React.ReactNode;
    }>;
    if (el.props?.['data-sort'] !== undefined) {
      const val = el.props['data-sort'];
      return typeof val === 'number' ? val : String(val).toLowerCase();
    }
    if (typeof el.props?.children === 'string' || typeof el.props?.children === 'number') {
      return extractCellSortValue(el.props.children);
    }
    if (Array.isArray(el.props?.children)) {
      const text = el.props.children
        .map((c) => (typeof c === 'string' || typeof c === 'number' ? c : ''))
        .join(' ');
      if (text.trim()) return extractCellSortValue(text.trim());
    }
  }
  return '';
}

export function DataTable({
  head,
  rows,
  align = [],
  searchable = false,
  searchPlaceholder = 'Cari di tabel…',
  emptyMessage = 'Tidak ada baris data.',
}: {
  head: string[];
  rows: React.ReactNode[][];
  align?: Array<'left' | 'right' | 'center'>;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const alignClass = (index: number) => {
    const a = align[index] ?? 'left';
    if (a === 'right') return 'text-right justify-end';
    if (a === 'center') return 'text-center justify-center';
    return 'text-left justify-start';
  };

  const handleSort = (index: number) => {
    if (sortCol === index) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(index);
      const firstVal = rows[0] ? extractCellSortValue(rows[0][index]) : '';
      setSortDir(typeof firstVal === 'number' ? 'desc' : 'asc');
    }
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((row) =>
      row.some((cell) => {
        const val = String(extractCellSortValue(cell)).toLowerCase();
        return val.includes(q);
      }),
    );
  }, [rows, searchQuery]);

  const sortedRows = useMemo(() => {
    if (sortCol === null) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = extractCellSortValue(a[sortCol]);
      const valB = extractCellSortValue(b[sortCol]);

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA);
      const strB = String(valB);
      return sortDir === 'asc'
        ? strA.localeCompare(strB, 'id-ID')
        : strB.localeCompare(strA, 'id-ID');
    });
  }, [filteredRows, sortCol, sortDir]);

  const showSearch = searchable;

  return (
    <div className="flex flex-col gap-2.5">
      {(showSearch || sortCol !== null) && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-lp-tertiary">
            <span>
              Menampilkan <strong className="font-lp-mono text-lp-on-surface">{sortedRows.length}</strong>{' '}
              {sortedRows.length !== rows.length ? `dari ${rows.length}` : ''} baris
            </span>
            {sortCol !== null && (
              <button
                type="button"
                onClick={() => setSortCol(null)}
                className="inline-flex items-center gap-1 rounded-md bg-lp-surface-container px-2 py-0.5 text-[11px] font-semibold text-lp-primary hover:bg-lp-surface-container-high transition-colors"
                title="Kembalikan urutan semula"
              >
                <span>Reset Urutan</span>
                <Icon name="close" className="text-[12px]" />
              </button>
            )}
          </div>

          {showSearch && (
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-lp-tertiary"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label="Cari di tabel"
                className="h-8 w-44 rounded-lg border border-lp-surface-container bg-lp-surface-low pl-7 pr-2.5 text-xs text-lp-on-surface placeholder:text-lp-tertiary outline-none transition focus:border-lp-primary focus:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-lp-tertiary hover:text-lp-on-surface"
                >
                  <Icon name="close" className="text-[12px]" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin rounded-xl border border-lp-surface-container/70">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-lp-surface-low text-lp-tertiary font-bold uppercase tracking-wider border-b border-lp-surface-container">
              {head.map((label, index) => {
                const isSorted = sortCol === index;
                return (
                  <th
                    key={label}
                    onClick={() => handleSort(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort(index);
                      }
                    }}
                    tabIndex={0}
                    aria-sort={
                      isSorted
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    className={`group cursor-pointer select-none py-3 px-3 transition-colors hover:bg-lp-surface-container ${
                      isSorted ? 'bg-lp-primary/10 text-lp-primary font-bold' : ''
                    } ${align[index] === 'right' ? 'text-right' : align[index] === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${alignClass(index)}`}>
                      <span>{label}</span>
                      <span className="inline-flex shrink-0">
                        {isSorted ? (
                          <Icon
                            name={sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            className="text-[14px] text-lp-primary"
                          />
                        ) : (
                          <Icon
                            name="unfold_more"
                            className="text-[14px] text-lp-tertiary opacity-0 group-hover:opacity-70 transition-opacity"
                          />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-lp-surface-container/60 bg-lp-surface-container-lowest">
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={head.length}
                  className="py-8 text-center text-xs text-lp-tertiary"
                >
                  <Icon name="search_off" className="text-[24px] mb-1 opacity-50 block mx-auto" />
                  {searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-lp-surface-low/60 transition-colors"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`py-3 px-3 text-lp-on-surface font-medium ${
                        align[cellIndex] === 'right'
                          ? 'text-right font-lp-mono'
                          : align[cellIndex] === 'center'
                            ? 'text-center'
                            : 'text-left'
                      } ${sortCol === cellIndex ? 'bg-lp-primary/[0.02]' : ''}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
