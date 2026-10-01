'use client';

import { useEffect, useState } from 'react';
import { createCustomer, listCustomers } from '@/lib/api';
import type { Customer } from '@/lib/types';
import type { CartCustomer } from '@/stores/cart-store';
import { Icon } from './icon';
import { Alert, Button, Input } from './pos-ui';

/** Attach a CRM customer to the current sale, or create one on the spot. */
export function CustomerPickerModal({
  onCancel,
  onPick,
}: {
  onCancel: () => void;
  onPick: (customer: CartCustomer) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      listCustomers({ search: query.trim() || undefined, limit: 20 })
        .then((res) => {
          if (!cancelled) {
            setResults(res.items);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Gagal memuat pelanggan.');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  async function submitNew() {
    if (!newName.trim() || !newPhone.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createCustomer({
        name: newName.trim(),
        phone: newPhone.trim(),
      });
      onPick({ id: created.id, name: created.name, phone: created.phone });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah pelanggan.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest shadow-2xl">
        <div className="flex items-center gap-2 border-b border-lp-outline-variant/20 px-4 py-3">
          <Icon name="person" className="text-base text-lp-primary" />
          <h2 className="text-sm font-bold text-lp-on-surface">Pilih Pelanggan</h2>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau nomor HP…"
            className="text-xs"
          />

          {error && <Alert kind="error">{error}</Alert>}

          <div className="min-h-24">
            {loading ? (
              <p className="py-6 text-center text-xs text-lp-on-surface-variant animate-pulse">
                Memuat pelanggan…
              </p>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-xs text-lp-on-surface-variant">
                Belum ada pelanggan. Tambahkan di bawah.
              </p>
            ) : (
              <ul className="divide-y divide-lp-outline-variant/15 rounded-xl border border-lp-outline-variant/25 overflow-hidden">
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onPick({ id: c.id, name: c.name, phone: c.phone })}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-lp-surface-low transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-lp-on-surface">
                          {c.name}
                        </span>
                        <span className="block font-lp-mono text-[11px] text-lp-on-surface-variant">
                          {c.phone ?? '—'}
                        </span>
                      </span>
                      <span className="shrink-0 rounded bg-lp-surface-container px-1.5 py-0.5 text-[10px] font-semibold text-lp-on-surface-variant">
                        {c.tier}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-lp-outline-variant/25 bg-lp-surface-low p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant">
              Pelanggan Baru
            </p>
            <div className="flex flex-col gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama"
                className="text-xs"
              />
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Nomor HP"
                inputMode="tel"
                className="text-xs font-lp-mono"
              />
              <Button
                type="button"
                variant="subtle"
                className="h-9 text-xs"
                onClick={() => void submitNew()}
                disabled={creating || !newName.trim() || !newPhone.trim()}
              >
                <Icon name="person_add" className="text-sm" />
                <span>{creating ? 'Menyimpan…' : 'Tambah & Pilih'}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-lp-outline-variant/20 p-4 pt-0">
          <Button type="button" variant="ghost" className="mt-4 w-full" onClick={onCancel}>
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
