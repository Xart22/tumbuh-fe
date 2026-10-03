'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import {
  createPurchaseOrder,
  createSupplier,
  distributePurchaseOrder,
  getPurchaseOrder,
  listOutlets,
  listPurchaseOrdersPage,
  listSuppliersPage,
  receivePurchaseOrder,
} from '@/lib/api';
import { formatIDR, formatQty } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import type { PurchaseOrder, RawMaterial } from '@/lib/types';
import { CreatePoModal } from './create-po-modal';
import { DistributePoModal } from './distribute-po-modal';

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';

const PO_STATUS: Record<string, string> = {
  draft: 'Draft',
  partial: 'Sebagian',
  received: 'Diterima',
  distributed: 'Didistribusikan',
  cancelled: 'Dibatalkan',
};

function poStatusChip(status: string): string {
  if (status === 'received') {
    return 'bg-lp-primary-fixed/40 text-lp-on-primary-fixed';
  }
  if (status === 'cancelled') {
    return 'bg-lp-error-container text-lp-on-error-container';
  }
  return 'bg-lp-secondary-fixed/60 text-lp-on-secondary-container';
}

export function PurchaseOrderView({
  materials,
  canWrite,
  initialItems,
  onInitialItemsConsumed,
}: {
  materials: RawMaterial[];
  canWrite: boolean;
  /** Lines handed over from the materials tab (+PO / Buat PO Massal). */
  initialItems?: Array<{
    rawMaterialId: string;
    qtyOrdered: string;
    unitPrice: string;
  }> | null;
  onInitialItemsConsumed?: () => void;
}) {
  const queryClient = useQueryClient();
  const currentOutletId = useAuthStore((s) => s.outletId);
  const [poModal, setPoModal] = useState(initialItems ? true : false);
  const [poError, setPoError] = useState<string | null>(null);
  const [selectedPo, setSelectedPo] = useState<string | null>(null);
  const [distributePo, setDistributePo] = useState<PurchaseOrder | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierError, setSupplierError] = useState<string | null>(null);

  const ordersQ = useQuery({
    queryKey: ['inventory', 'purchase-orders'],
    queryFn: () => listPurchaseOrdersPage({ page: 1, limit: 20 }),
  });
  const suppliersQ = useQuery({
    queryKey: ['inventory', 'suppliers'],
    queryFn: () => listSuppliersPage({ page: 1, limit: 50 }),
  });
  const detailQ = useQuery({
    queryKey: ['inventory', 'purchase-order', selectedPo],
    queryFn: () => getPurchaseOrder(selectedPo!),
    enabled: selectedPo !== null,
  });
  const outletsQ = useQuery({
    queryKey: ['outlets'],
    queryFn: listOutlets,
    enabled: canWrite,
  });
  const otherOutlets = (outletsQ.data ?? []).filter(
    (outlet) => outlet.id !== currentOutletId,
  );

  const distributeM = useMutation({
    mutationFn: (target: {
      outletId: string;
      items: Array<{ rawMaterialId: string; qty: number }>;
    }) => distributePurchaseOrder(distributePo!.id, [target]),
    onSuccess: () => {
      setDistributePo(null);
      void invalidateOrders();
      // Distribution consumes source stock, so refresh the detail (button state)
      // and the materials list too — otherwise it can be distributed again.
      queryClient.invalidateQueries({ queryKey: ['inventory', 'materials'] });
      if (selectedPo) {
        queryClient.invalidateQueries({
          queryKey: ['inventory', 'purchase-order', selectedPo],
        });
      }
    },
  });

  const orders = ordersQ.data?.items ?? [];
  const suppliers = suppliersQ.data?.items ?? [];

  const invalidateOrders = () =>
    queryClient.invalidateQueries({ queryKey: ['inventory', 'purchase-orders'] });

  const createSupplierM = useMutation({
    mutationFn: () =>
      createSupplier({
        name: supplierName.trim(),
        phone: supplierPhone.trim() || undefined,
      }),
    onSuccess: () => {
      setSupplierName('');
      setSupplierPhone('');
      setSupplierError(null);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] });
    },
    onError: (err) =>
      setSupplierError(
        err instanceof Error ? err.message : 'Gagal menambah supplier.',
      ),
  });

  const createPoM = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      setPoModal(false);
      setPoError(null);
      void invalidateOrders();
    },
    onError: (err) =>
      setPoError(err instanceof Error ? err.message : 'Gagal membuat PO.'),
  });

  const receiveM = useMutation({
    mutationFn: (id: string) => receivePurchaseOrder(id),
    onSuccess: () => {
      void invalidateOrders();
      queryClient.invalidateQueries({ queryKey: ['inventory', 'materials'] });
      if (selectedPo) {
        queryClient.invalidateQueries({
          queryKey: ['inventory', 'purchase-order', selectedPo],
        });
      }
    },
  });

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className={`${PANEL} lg:col-span-2`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-lp-on-surface">
            Purchase Order
          </h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setPoError(null);
                setPoModal(true);
              }}
              disabled={suppliers.length === 0 || materials.length === 0}
              title={
                suppliers.length === 0
                  ? 'Tambah supplier dulu'
                  : materials.length === 0
                    ? 'Tambah bahan dulu'
                    : undefined
              }
              className="flex h-9 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary transition hover:bg-lp-primary-container disabled:opacity-50"
            >
              <Icon name="local_shipping" className="text-[16px]" />
              Catat Barang Masuk
            </button>
          )}
        </div>

        {ordersQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat PO…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">
            Belum ada purchase order.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {orders.map((po) => (
              <button
                key={po.id}
                type="button"
                onClick={() =>
                  setSelectedPo((current) => (current === po.id ? null : po.id))
                }
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition ${
                  selectedPo === po.id
                    ? 'bg-lp-surface-container-high'
                    : 'bg-lp-surface-container-low hover:bg-lp-surface-container'
                }`}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-lp-on-surface">
                    {po.poNumber}
                  </span>
                  <span className="text-[11px] text-lp-tertiary">
                    {po.supplierName}
                    {po.expectedDate
                      ? ` · est. ${new Date(po.expectedDate).toLocaleDateString('id-ID')}`
                      : ''}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-lp-mono text-xs text-lp-on-surface">
                    {formatIDR(po.totalAmount)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${poStatusChip(po.status)}`}
                  >
                    {PO_STATUS[po.status] ?? po.status}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedPo && detailQ.data && (
          <div className="mt-3 rounded-lg border border-lp-surface-container p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-lp-on-surface">
                {detailQ.data.poNumber} · {detailQ.data.supplier.name}
              </span>
              {canWrite &&
                detailQ.data.status !== 'received' &&
                detailQ.data.status !== 'distributed' &&
                detailQ.data.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={receiveM.isPending}
                    onClick={() => receiveM.mutate(detailQ.data.id)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    <Icon name="inventory_2" className="text-[14px]" />
                    {receiveM.isPending ? 'Memproses…' : 'Terima Barang'}
                  </button>
                )}
              {canWrite && detailQ.data.status === 'received' && (
                <button
                  type="button"
                  onClick={() => setDistributePo(detailQ.data)}
                  className="flex items-center gap-1 rounded-lg bg-lp-surface-container-high px-3 py-1.5 text-xs font-bold text-lp-on-surface"
                >
                  <Icon name="share" className="text-[14px]" />
                  Distribusikan
                </button>
              )}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-1">Bahan</th>
                  <th className="pb-1 text-right">Dipesan</th>
                  <th className="pb-1 text-right">Diterima</th>
                  <th className="pb-1 text-right">Harga</th>
                </tr>
              </thead>
              <tbody>
                {detailQ.data.items.map((item) => (
                  <tr key={item.id} className="border-t border-lp-surface-container">
                    <td className="py-1.5 text-lp-on-surface">
                      {item.rawMaterialName}
                    </td>
                    <td className="py-1.5 text-right font-lp-mono text-lp-on-surface">
                      {formatQty(item.qtyOrdered)} {item.unit}
                    </td>
                    <td className="py-1.5 text-right font-lp-mono text-lp-on-surface-variant">
                      {formatQty(item.qtyReceived)} {item.unit}
                    </td>
                    <td className="py-1.5 text-right font-lp-mono text-lp-on-surface">
                      {formatIDR(item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {receiveM.isError && (
              <p className="mt-2 text-xs text-lp-error">
                {receiveM.error instanceof Error
                  ? receiveM.error.message
                  : 'Gagal menerima PO.'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className={PANEL}>
        <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
          Supplier
        </h2>
        {suppliersQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
        ) : suppliers.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">Belum ada supplier.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex flex-col rounded-lg bg-lp-surface-container-low px-3 py-1.5"
              >
                <span className="text-sm font-medium text-lp-on-surface">
                  {supplier.name}
                </span>
                {supplier.phone && (
                  <span className="font-lp-mono text-[11px] text-lp-tertiary">
                    {supplier.phone}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {canWrite && (
          <div className="mt-3 flex flex-col gap-2 border-t border-lp-surface-container pt-3">
            <input
              value={supplierName}
              onChange={(event) => setSupplierName(event.target.value)}
              placeholder="Nama supplier baru"
              aria-label="Nama supplier baru"
              className="h-9 rounded-lg border border-lp-outline-variant px-2.5 text-sm text-lp-on-surface outline-none focus:border-lp-primary"
            />
            <div className="flex gap-2">
              <input
                value={supplierPhone}
                onChange={(event) => setSupplierPhone(event.target.value)}
                placeholder="Telepon (opsional)"
                aria-label="Telepon supplier"
                className="h-9 flex-1 rounded-lg border border-lp-outline-variant px-2.5 text-sm text-lp-on-surface outline-none focus:border-lp-primary"
              />
              <button
                type="button"
                onClick={() => createSupplierM.mutate()}
                disabled={createSupplierM.isPending || !supplierName.trim()}
                className="flex h-9 items-center gap-1 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary disabled:opacity-60"
              >
                <Icon name="add" className="text-[16px]" />
                Tambah
              </button>
            </div>
            {supplierError && (
              <p role="alert" className="text-[11px] text-lp-error">
                {supplierError}
              </p>
            )}
          </div>
        )}
      </div>

      {poModal && (
        <CreatePoModal
          suppliers={suppliers}
          materials={materials}
          initialItems={initialItems ?? null}
          pending={createPoM.isPending}
          errorMessage={poError}
          onClose={() => {
            setPoModal(false);
            onInitialItemsConsumed?.();
          }}
          onSubmit={(values) => createPoM.mutate(values)}
        />
      )}

      {distributePo && (
        <DistributePoModal
          order={distributePo}
          outlets={otherOutlets}
          pending={distributeM.isPending}
          errorMessage={
            distributeM.isError
              ? distributeM.error instanceof Error
                ? distributeM.error.message
                : 'Gagal mendistribusikan PO.'
              : null
          }
          onClose={() => setDistributePo(null)}
          onSubmit={(target) => distributeM.mutate(target)}
        />
      )}
    </section>
  );
}
