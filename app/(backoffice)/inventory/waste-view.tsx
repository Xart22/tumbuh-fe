'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { createWasteRecord, listWasteRecords } from '@/lib/api';
import { formatIDR, formatQty } from '@/lib/format';
import {
  WASTE_REASON_LABELS,
  WASTE_REASONS,
  type RawMaterial,
  type WasteReason,
} from '@/lib/types';

export const wasteSchema = z.object({
  rawMaterialId: z.string().min(1, 'Pilih bahan.'),
  qty: z
    .number({ error: 'Qty harus berupa angka.' })
    .positive('Qty harus lebih dari 0.'),
  reason: z.enum(WASTE_REASONS),
  notes: z.string().trim().max(200).optional(),
});

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';
const labelCls =
  'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600';
const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20';

/** Waste log: records shrink stock and cost the material's `costPerUnit`. */
export function WasteView({
  materials,
  canWrite,
}: {
  materials: RawMaterial[];
  canWrite: boolean;
}) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? '');
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState<WasteReason>('expired');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recordsQ = useQuery({
    queryKey: ['inventory', 'waste'],
    queryFn: () => listWasteRecords(),
  });
  const records = recordsQ.data ?? [];
  const totalCost = records.reduce((sum, record) => sum + record.totalCost, 0);

  const createM = useMutation({
    mutationFn: () =>
      createWasteRecord({
        rawMaterialId: materialId,
        qty: Number(qty),
        reason,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      setModal(false);
      setQty('1');
      setNotes('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'waste'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'materials'] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal mencatat waste.'),
  });

  function submit() {
    const parsed = wasteSchema.safeParse({
      rawMaterialId: materialId,
      qty: Number(qty),
      reason,
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Data waste tidak valid.');
      return;
    }
    setError(null);
    createM.mutate();
  }

  return (
    <section className={PANEL}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-lp-on-surface">
            Catatan Waste
          </h2>
          <p className="text-xs text-lp-tertiary">
            {records.length} catatan · total {formatIDR(totalCost)}
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            disabled={materials.length === 0}
            onClick={() => {
              setError(null);
              setModal(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary transition hover:bg-lp-primary-container disabled:opacity-50"
          >
            <Icon name="delete_sweep" className="text-[16px]" />
            Catat Waste
          </button>
        )}
      </div>

      {recordsQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Belum ada bahan terbuang tercatat.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-lp-tertiary">
                <th className="pb-2">Tanggal</th>
                <th className="pb-2">Bahan</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2">Alasan</th>
                <th className="pb-2 text-right">Biaya</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={record.id}
                  className="border-t border-lp-surface-container"
                >
                  <td className="py-2 text-lp-on-surface-variant">
                    {new Date(record.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td className="py-2 text-lp-on-surface">
                    {record.rawMaterialName}
                  </td>
                  <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                    {formatQty(record.qty)} {record.unit}
                  </td>
                  <td className="py-2 text-lp-on-surface-variant">
                    {WASTE_REASON_LABELS[record.reason as WasteReason] ??
                      record.reason}
                  </td>
                  <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                    {formatIDR(record.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-lp-surface-container-lowest p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-lp-on-surface">
                Catat Bahan Terbuang
              </h2>
              <button
                type="button"
                onClick={() => setModal(false)}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-surface-container"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="w-material" className={labelCls}>
                  Bahan
                </label>
                <select
                  id="w-material"
                  value={materialId}
                  onChange={(event) => setMaterialId(event.target.value)}
                  className={inputCls}
                >
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="w-qty" className={labelCls}>
                    Qty
                  </label>
                  <input
                    id="w-qty"
                    type="number"
                    min={0}
                    step={0.01}
                    value={qty}
                    onChange={(event) => setQty(event.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="w-reason" className={labelCls}>
                    Alasan
                  </label>
                  <select
                    id="w-reason"
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value as WasteReason)
                    }
                    className={inputCls}
                  >
                    {WASTE_REASONS.map((value) => (
                      <option key={value} value={value}>
                        {WASTE_REASON_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="w-notes" className={labelCls}>
                  Catatan (opsional)
                </label>
                <input
                  id="w-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
              >
                {error}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={createM.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <Icon name="save" className="text-[18px]" />
                {createM.isPending ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
