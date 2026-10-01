'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  confirmStockOpname,
  createStockOpname,
  getStockOpname,
  listStockOpnames,
  updateStockOpnameItem,
} from '@/lib/api';
import { formatQty } from '@/lib/format';
import type { StockOpname, StockOpnameItem, StockOpnameSummary } from '@/lib/types';

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'Berjalan',
  confirmed: 'Selesai',
};

function statusChip(status: string): string {
  if (status === 'confirmed') {
    return 'bg-lp-primary-fixed/40 text-lp-on-primary-fixed';
  }
  return 'bg-lp-secondary-fixed/60 text-lp-on-secondary-container';
}

export function OpnameView({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpnameId, setConfirmOpnameId] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ['inventory', 'opnames'],
    queryFn: () => listStockOpnames(),
  });
  const detailQ = useQuery({
    queryKey: ['inventory', 'opname', selectedId],
    queryFn: () => getStockOpname(selectedId!),
    enabled: selectedId !== null,
  });

  const opnames: StockOpnameSummary[] = listQ.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory', 'opnames'] });
    if (selectedId) {
      queryClient.invalidateQueries({
        queryKey: ['inventory', 'opname', selectedId],
      });
    }
  };

  const createM = useMutation({
    mutationFn: () => createStockOpname({}),
    onSuccess: (opname) => {
      setError(null);
      setSelectedId(opname.id);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal memulai opname.'),
  });

  const confirmM = useMutation({
    mutationFn: (opnameId: string) => confirmStockOpname(opnameId),
    onSuccess: () => {
      setError(null);
      void invalidate();
      queryClient.invalidateQueries({ queryKey: ['inventory', 'materials'] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyelesaikan opname.'),
  });

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className={PANEL}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-lp-on-surface">
            Stok Opname
          </h2>
          {canWrite && (
            <button
              type="button"
              disabled={createM.isPending}
              onClick={() => createM.mutate()}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary transition hover:bg-lp-primary-container disabled:opacity-60"
            >
              <Icon name="add" className="text-[16px]" />
              Mulai Opname
            </button>
          )}
        </div>

        {listQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
        ) : opnames.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">
            Belum ada sesi opname.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {opnames.map((opname) => (
              <button
                key={opname.id}
                type="button"
                onClick={() => setSelectedId(opname.id)}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedId === opname.id
                    ? 'bg-lp-surface-container-high'
                    : 'bg-lp-surface-container-low hover:bg-lp-surface-container'
                }`}
              >
                <span className="flex flex-col">
                  <span className="font-medium text-lp-on-surface">
                    {new Date(opname.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-[11px] text-lp-tertiary">
                    {opname.itemCount} bahan
                    {opname.conductedByName ? ` · ${opname.conductedByName}` : ''}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusChip(
                    opname.status,
                  )}`}
                >
                  {STATUS_LABEL[opname.status] ?? opname.status}
                </span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-2 text-[11px] text-lp-error">
            {error}
          </p>
        )}
      </div>

      <div className={`${PANEL} lg:col-span-2`}>
        {!selectedId ? (
          <p className="text-sm text-lp-on-surface-variant">
            Pilih sesi opname untuk menghitung stok fisik.
          </p>
        ) : detailQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat detail…</p>
        ) : detailQ.data ? (
          <OpnameDetail
            key={detailQ.data.id}
            opname={detailQ.data}
            canWrite={canWrite}
            confirming={confirmM.isPending}
            onConfirm={(id) => setConfirmOpnameId(id)}
            onSaved={invalidate}
            onError={setError}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpnameId !== null}
        title="Selesaikan & Terapkan Opname?"
        description="Hasil opname fisik akan disahkan dan penyesuaian stok akan langsung diterapkan ke master data gudang."
        confirmText="Ya, Selesaikan Opname"
        cancelText="Batal"
        variant="primary"
        icon="fact_check"
        isLoading={confirmM.isPending}
        onClose={() => setConfirmOpnameId(null)}
        onConfirm={() => {
          if (confirmOpnameId) {
            confirmM.mutate(confirmOpnameId, {
              onSettled: () => setConfirmOpnameId(null),
            });
          }
        }}
      />
    </section>
  );
}

function OpnameDetail({
  opname,
  canWrite,
  confirming,
  onConfirm,
  onSaved,
  onError,
}: {
  opname: StockOpname;
  canWrite: boolean;
  confirming: boolean;
  onConfirm: (id: string) => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const editable = canWrite && opname.status !== 'confirmed';
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      opname.items.map((item) => [
        item.id,
        item.physicalQty === null ? '' : String(item.physicalQty),
      ]),
    ),
  );

  const save = useMutation({
    mutationFn: ({ item, qty }: { item: StockOpnameItem; qty: number }) =>
      updateStockOpnameItem(opname.id, item.id, { physicalQty: qty }),
    onSuccess: () => onSaved(),
    onError: (err) =>
      onError(err instanceof Error ? err.message : 'Gagal menyimpan hitungan.'),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-lp-on-surface">
            Hitung Stok Fisik
          </h2>
          <p className="text-xs text-lp-tertiary">
            {opname.summary.countedItems}/{opname.summary.itemCount} dihitung ·{' '}
            {opname.summary.discrepancyCount} selisih · total selisih{' '}
            {formatQty(opname.summary.totalVarianceQty)}
          </p>
        </div>
        {editable && (
          <button
            type="button"
            disabled={confirming || opname.summary.countedItems === 0}
            onClick={() => onConfirm(opname.id)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-50"
          >
            <Icon name="task_alt" className="text-[16px]" />
            {confirming ? 'Memproses…' : 'Selesaikan Opname'}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-lp-tertiary">
              <th className="pb-2">Bahan</th>
              <th className="pb-2 text-right">Sistem</th>
              <th className="pb-2 text-right">Fisik</th>
              <th className="pb-2 text-right">Selisih</th>
            </tr>
          </thead>
          <tbody>
            {opname.items.map((item) => {
              const draft = drafts[item.id] ?? '';
              const variance = item.variance;
              return (
                <tr
                  key={item.id}
                  className="border-t border-lp-surface-container"
                >
                  <td className="py-2 text-lp-on-surface">
                    {item.rawMaterialName}
                  </td>
                  <td className="py-2 text-right font-lp-mono text-lp-on-surface-variant">
                    {formatQty(item.systemQty)} {item.unit}
                  </td>
                  <td className="py-2 text-right">
                    {editable ? (
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={draft}
                        aria-label={`Stok fisik ${item.rawMaterialName}`}
                        onChange={(event) =>
                          setDrafts((state) => ({
                            ...state,
                            [item.id]: event.target.value,
                          }))
                        }
                        onBlur={() => {
                          if (draft === '') return;
                          const qty = Number(draft);
                          if (Number.isFinite(qty) && qty >= 0) {
                            save.mutate({ item, qty });
                          }
                        }}
                        className="w-24 rounded-lg border border-lp-outline-variant px-2 py-1 text-right font-lp-mono text-sm outline-none focus:border-lp-primary"
                      />
                    ) : (
                      <span className="font-lp-mono text-lp-on-surface">
                        {item.physicalQty === null
                          ? '—'
                          : `${formatQty(item.physicalQty)} ${item.unit}`}
                      </span>
                    )}
                  </td>
                  <td
                    className={`py-2 text-right font-lp-mono ${
                      variance ? 'text-lp-error' : 'text-lp-tertiary'
                    }`}
                  >
                    {variance === null ? '—' : formatQty(variance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
