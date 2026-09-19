'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { globalSearch } from '@/lib/api';
import { formatIDR } from '@/lib/format';
import { NAV } from './backoffice-nav';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-lp-tertiary">
      {children}
    </span>
  );
}

function InfoRow({
  icon,
  title,
  meta,
}: {
  icon: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <Icon name={icon} className="text-[18px] text-lp-on-surface-variant" />
      <span className="flex-1 truncate text-sm text-lp-on-surface">{title}</span>
      <span className="shrink-0 text-[11px] text-lp-tertiary">{meta}</span>
    </div>
  );
}

/**
 * Page jump + global search. Pages navigate; data hits (orders/products/
 * customers) are read-only previews — their detail routes aren't built yet, so
 * a link would misroute.
 */
export function HeaderSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const term = query.trim().toLowerCase();
  const pages = term
    ? NAV.filter((item) => item.label.toLowerCase().includes(term))
    : NAV;

  const searchQ = useQuery({
    queryKey: ['search', debounced],
    queryFn: ({ signal }) => globalSearch(debounced, signal),
    enabled: debounced.length >= 2,
  });
  const results = searchQ.data;
  const hasData = Boolean(
    results &&
      (results.orders.length || results.products.length || results.customers.length),
  );
  const noResults =
    debounced.length >= 2 &&
    !searchQ.isFetching &&
    results !== undefined &&
    !hasData &&
    pages.length === 0;

  function go(href: string) {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    router.push(href);
  }

  return (
    <div className="relative w-full max-w-md">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-lp-on-surface-variant"
      />
      <input
        ref={inputRef}
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('');
            setOpen(false);
            inputRef.current?.blur();
          }
          if (event.key === 'Enter' && pages[0]) go(pages[0].href);
        }}
        placeholder="Cari transaksi, menu, pelanggan…"
        aria-label="Cari"
        className="h-10 w-full rounded-lg bg-lp-surface-container-low pl-10 pr-16 text-sm text-lp-on-surface outline-none transition-colors placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container"
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-lp-surface-container-highest px-1.5 py-0.5 text-[11px] font-semibold text-lp-on-surface-variant">
        ⌘K
      </span>

      {open && (
        <div className="absolute left-0 right-0 top-12 z-50 flex max-h-96 flex-col overflow-y-auto rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest pb-2 shadow-md">
          {pages.length > 0 && (
            <>
              <SectionLabel>Halaman</SectionLabel>
              {pages.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    go(item.href);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-lp-on-surface hover:bg-lp-surface-low"
                >
                  <Icon
                    name={item.icon}
                    className="text-[18px] text-lp-on-surface-variant"
                  />
                  {item.label}
                </button>
              ))}
            </>
          )}

          {searchQ.isFetching && debounced.length >= 2 && (
            <span className="px-3 py-2 text-[11px] text-lp-tertiary">
              Mencari…
            </span>
          )}

          {results && results.orders.length > 0 && (
            <>
              <SectionLabel>Transaksi</SectionLabel>
              {results.orders.map((row) => (
                <InfoRow
                  key={row.id}
                  icon="receipt_long"
                  title={row.orderNumber}
                  meta={`${row.paymentStatus} · ${formatIDR(row.total)}`}
                />
              ))}
            </>
          )}

          {results && results.products.length > 0 && (
            <>
              <SectionLabel>Menu</SectionLabel>
              {results.products.map((row) => (
                <InfoRow
                  key={row.id}
                  icon="restaurant_menu"
                  title={row.name}
                  meta={`${row.isAvailable ? '' : 'Habis · '}${formatIDR(row.basePrice)}`}
                />
              ))}
            </>
          )}

          {results && results.customers.length > 0 && (
            <>
              <SectionLabel>Pelanggan</SectionLabel>
              {results.customers.map((row) => (
                <InfoRow
                  key={row.id}
                  icon="person"
                  title={row.name}
                  meta={row.phone ?? row.tier}
                />
              ))}
            </>
          )}

          {noResults && (
            <p className="px-3 py-2 text-xs text-lp-on-surface-variant">
              Tidak ada hasil untuk “{debounced}”.
            </p>
          )}

          {term.length > 0 && debounced.length < 2 && !hasData && (
            <p className="px-3 py-2 text-xs text-lp-on-surface-variant">
              Ketik minimal 2 huruf untuk mencari transaksi, menu, pelanggan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
