'use client';

import { useEffect, useState } from 'react';
import { listTables, type PosTable } from '@/lib/api';
import { Icon } from './icon';
import { Alert, Button } from './pos-ui';

const STATUS_LABEL: Record<string, string> = {
  available: 'Kosong',
  occupied: 'Terisi',
  reserved: 'Reservasi',
  dirty: 'Perlu Dibersihkan',
  waiting_payment: 'Menunggu Bayar',
};

/** Pick a target table when moving an open dine-in order. */
export function TablePickerModal({
  currentTableName,
  onCancel,
  onPick,
}: {
  currentTableName?: string | null;
  onCancel: () => void;
  onPick: (table: PosTable) => void;
}) {
  const [tables, setTables] = useState<PosTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTables({ limit: 100 })
      .then((res) => {
        if (!cancelled) setTables(res.items);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat meja.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest shadow-2xl">
        <div className="flex items-center gap-2 border-b border-lp-outline-variant/20 px-4 py-3">
          <Icon name="table_restaurant" className="text-base text-lp-primary" />
          <div>
            <h2 className="text-sm font-bold text-lp-on-surface">Pindah Meja</h2>
            {currentTableName && (
              <p className="text-[11px] text-lp-on-surface-variant">
                Saat ini: {currentTableName}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <Alert kind="error">{error}</Alert>}

          {loading ? (
            <p className="py-10 text-center text-xs text-lp-on-surface-variant animate-pulse">
              Memuat daftar meja…
            </p>
          ) : tables.length === 0 ? (
            <p className="py-10 text-center text-xs text-lp-on-surface-variant">
              Belum ada meja terdaftar di outlet ini.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tables.map((t) => {
                const isCurrent = t.name === currentTableName;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => onPick(t)}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                      isCurrent
                        ? 'border-lp-primary/40 bg-emerald-50/60 cursor-default'
                        : 'border-lp-outline-variant/30 bg-lp-surface-low hover:border-lp-primary hover:bg-emerald-50/40'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-1">
                      <span className="truncate text-xs font-bold text-lp-on-surface">
                        {t.name}
                      </span>
                      <Icon
                        name={isCurrent ? 'check_circle' : 'table_restaurant'}
                        className={`text-sm shrink-0 ${isCurrent ? 'text-lp-primary' : 'text-lp-on-surface-variant'}`}
                      />
                    </span>
                    <span className="text-[10px] text-lp-on-surface-variant">
                      {t.capacity} kursi · {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-lp-outline-variant/20 p-4">
          <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
