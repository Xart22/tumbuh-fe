'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { Overlay } from '@/components/overlay';
import {
  acceptStockTransfer,
  createOutlet,
  createStockTransfer,
  listOutlets,
  listRawMaterialsPage,
  listStockTransfers,
} from '@/lib/api';
import { formatQty } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import { OutletFormModal, toOutletInput, type OutletFormValues } from './outlet-form';

type Tab = 'daftar' | 'transfer';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'daftar', label: 'Daftar Outlet' },
  { id: 'transfer', label: 'Transfer Stok' },
];

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';
const inputCls =
  'h-10 rounded-lg border border-lp-outline-variant bg-lp-surface-container-lowest px-3 text-sm font-medium text-lp-on-surface outline-none focus:border-lp-primary';

export const transferSchema = z.object({
  toOutletId: z.string().min(1, 'Outlet tujuan wajib dipilih.'),
  notes: z.string().trim().max(200, 'Catatan maksimal 200 karakter.').optional(),
  items: z
    .array(
      z.object({
        rawMaterialId: z.string().min(1),
        qty: z.number().positive('Qty harus lebih dari 0.'),
      }),
    )
    .min(1, 'Minimal satu bahan.'),
});

export type TransferFormValues = z.infer<typeof transferSchema>;

type DraftItem = { rawMaterialId: string; qty: number };

export function OutletsView() {
  const [tab, setTab] = useState<Tab>('daftar');
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-lp-on-surface">Multi-Outlet</h1>
          <p className="text-sm text-lp-on-surface-variant">
            Kelola cabang dan transfer bahan antar outlet.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Bagian multi-outlet">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === item.id
                  ? 'bg-lp-primary text-lp-on-primary'
                  : 'text-lp-on-surface-variant hover:bg-lp-surface-low hover:text-lp-on-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'daftar' && <OutletList />}
      {tab === 'transfer' && <TransferPanel />}
    </section>
  );
}

function OutletList() {
  const queryClient = useQueryClient();
  const outletsQ = useQuery({ queryKey: ['outlets'], queryFn: listOutlets });
  const outlets = outletsQ.data ?? [];
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createM = useMutation({
    mutationFn: (values: OutletFormValues) => createOutlet(toOutletInput(values)),
    onSuccess: () => {
      setShowForm(false);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['outlets'] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menambah outlet.'),
  });

  return (
    <div className={PANEL}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-lp-on-surface">
          Daftar Outlet ({outlets.length})
        </h2>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowForm(true);
          }}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary"
        >
          <Icon name="add" className="text-[16px]" />
          Tambah Outlet
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {outletsQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : outlets.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">Belum ada outlet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                <th className="pb-2">Nama</th>
                <th className="pb-2">Kota</th>
                <th className="pb-2">Telepon</th>
                <th className="pb-2">Timezone</th>
              </tr>
            </thead>
            <tbody>
              {outlets.map((outlet) => (
                <tr
                  key={outlet.id}
                  className="border-t border-lp-surface-container"
                >
                  <td className="py-2.5 font-semibold text-lp-on-surface">
                    {outlet.name}
                  </td>
                  <td className="py-2.5 text-lp-on-surface-variant">
                    {outlet.city ?? '—'}
                  </td>
                  <td className="py-2.5 font-lp-mono text-lp-on-surface-variant">
                    {outlet.phone ?? '—'}
                  </td>
                  <td className="py-2.5 text-lp-on-surface-variant">
                    {outlet.timezone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <OutletFormModal
          pending={createM.isPending}
          errorMessage={error}
          onClose={() => setShowForm(false)}
          onSubmit={(values) => createM.mutate(values)}
        />
      )}
    </div>
  );
}

function TransferPanel() {
  const queryClient = useQueryClient();
  const currentOutletId = useAuthStore((s) => s.outletId);
  const outletsQ = useQuery({ queryKey: ['outlets'], queryFn: listOutlets });
  const transfersQ = useQuery({
    queryKey: ['stock-transfers'],
    queryFn: () => listStockTransfers(),
  });
  const materialsQ = useQuery({
    queryKey: ['stock-transfers', 'materials'],
    queryFn: () => listRawMaterialsPage({ page: 1, limit: 100 }),
  });

  const outlets = outletsQ.data ?? [];
  const transfers = transfersQ.data ?? [];
  const materials = materialsQ.data?.items ?? [];
  const outletName = (id: string) =>
    outlets.find((outlet) => outlet.id === id)?.name ?? id.slice(0, 8);
  const targets = outlets.filter((outlet) => outlet.id !== currentOutletId);

  const [showForm, setShowForm] = useState(false);
  const [toOutletId, setToOutletId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });

  const createM = useMutation({
    mutationFn: (payload: TransferFormValues) =>
      createStockTransfer({
        toOutletId: payload.toOutletId,
        notes: payload.notes?.trim() || undefined,
        items: payload.items,
      }),
    onSuccess: () => {
      setShowForm(false);
      setToOutletId('');
      setNotes('');
      setItems([]);
      setError(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal membuat transfer.'),
  });

  const acceptM = useMutation({
    mutationFn: (id: string) => acceptStockTransfer(id),
    onSuccess: () => void invalidate(),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menerima transfer.'),
  });

  function submit() {
    const parsed = transferSchema.safeParse({ toOutletId, notes, items });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Data belum lengkap.');
      return;
    }
    createM.mutate(parsed.data);
  }

  return (
    <div className={PANEL}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-lp-on-surface">
          Transfer Stok
        </h2>
        <button
          type="button"
          disabled={targets.length === 0}
          onClick={() => {
            setError(null);
            setToOutletId(targets[0]?.id ?? '');
            setItems([]);
            setShowForm(true);
          }}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary disabled:opacity-60"
        >
          <Icon name="add" className="text-[16px]" />
          Buat Transfer
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {transfersQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : transfers.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Belum ada transfer bahan.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                <th className="pb-2">Dari</th>
                <th className="pb-2">Ke</th>
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Status</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr
                  key={transfer.id}
                  className="border-t border-lp-surface-container"
                >
                  <td className="py-2.5 text-lp-on-surface">
                    {outletName(transfer.fromOutletId)}
                  </td>
                  <td className="py-2.5 text-lp-on-surface">
                    {outletName(transfer.toOutletId)}
                  </td>
                  <td className="py-2.5 text-lp-on-surface-variant">
                    {transfer.items
                      .map((item) => `${item.rawMaterialName} ${formatQty(item.qty)}`)
                      .join(', ')}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        transfer.status === 'received'
                          ? 'bg-lp-primary-fixed/40 text-lp-on-primary-fixed'
                          : 'bg-lp-secondary-container/40 text-lp-on-secondary-container'
                      }`}
                    >
                      {transfer.status === 'received' ? 'Diterima' : 'Menunggu'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {transfer.status === 'pending' &&
                      transfer.toOutletId === currentOutletId && (
                        <button
                          type="button"
                          disabled={acceptM.isPending}
                          onClick={() => acceptM.mutate(transfer.id)}
                          className="rounded-lg bg-lp-primary px-3 py-1.5 text-xs font-bold text-lp-on-primary disabled:opacity-60"
                        >
                          Terima
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Overlay title="Buat Transfer Stok" onClose={() => setShowForm(false)}>
          <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-lp-on-surface-variant">
                Outlet tujuan
                <select
                  value={toOutletId}
                  onChange={(event) => setToOutletId(event.target.value)}
                  aria-label="Outlet tujuan"
                  className={`mt-1 w-full ${inputCls}`}
                >
                  {targets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={item.rawMaterialId}
                      onChange={(event) =>
                        setItems((state) =>
                          state.map((row, i) =>
                            i === index
                              ? { ...row, rawMaterialId: event.target.value }
                              : row,
                          ),
                        )
                      }
                      aria-label={`Bahan ${index + 1}`}
                      className="h-9 flex-1 rounded-lg border border-lp-outline-variant px-2 text-sm"
                    >
                      <option value="">Pilih bahan…</option>
                      {materials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0.0001}
                      step={0.01}
                      value={item.qty}
                      onChange={(event) =>
                        setItems((state) =>
                          state.map((row, i) =>
                            i === index
                              ? { ...row, qty: Number(event.target.value) }
                              : row,
                          ),
                        )
                      }
                      aria-label={`Qty ${index + 1}`}
                      className="h-9 w-20 rounded-lg border border-lp-outline-variant px-2 text-right text-sm"
                    />
                    <button
                      type="button"
                      aria-label={`Hapus bahan ${index + 1}`}
                      onClick={() =>
                        setItems((state) => state.filter((_, i) => i !== index))
                      }
                      className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-error-container"
                    >
                      <Icon name="close" className="text-[16px]" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={materials.length === 0}
                onClick={() =>
                  setItems((state) => [
                    ...state,
                    { rawMaterialId: materials[0]?.id ?? '', qty: 1 },
                  ])
                }
                className="w-fit text-[11px] font-semibold text-lp-primary hover:underline disabled:opacity-50"
              >
                + Tambah bahan
              </button>

              <label className="text-xs font-semibold text-lp-on-surface-variant">
                Catatan
                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={`mt-1 w-full ${inputCls}`}
                />
              </label>

              {error && (
                <p role="alert" className="text-xs font-medium text-lp-error">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={createM.isPending}
                  onClick={submit}
                  className="rounded-lg bg-lp-primary px-5 py-2.5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
                >
                  {createM.isPending ? 'Mengirim…' : 'Kirim Transfer'}
                </button>
              </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
