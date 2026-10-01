'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  createVariant,
  deleteVariant,
  listVariants,
  toggleVariant,
  updateVariant,
} from '@/lib/api';
import { formatIDR } from '@/lib/format';
import type { ProductVariant } from '@/lib/types';

export const variantSchema = z.object({
  name: z.string().trim().min(1, 'Nama varian wajib diisi.'),
  priceAdjustment: z
    .number({ error: 'Harga penyesuaian harus berupa angka.' })
    .int('Gunakan angka bulat.')
    .min(-10_000_000, 'Nilai terlalu kecil.')
    .max(10_000_000, 'Nilai terlalu besar.'),
});

const inputCls =
  'w-full rounded-lg bg-lp-surface-low px-2.5 py-1.5 text-sm text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container';

/** Size/portion variants for one product. BE: /v1/product-variants. */
export function VariantEditor({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [adjustment, setAdjustment] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', adjustment: '0' });
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(null);

  const key = ['menu', 'variants', productId];
  const variantsQ = useQuery({
    queryKey: key,
    queryFn: () => listVariants(productId),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const createM = useMutation({
    mutationFn: (input: { name: string; priceAdjustment: number }) =>
      createVariant(productId, input),
    onSuccess: () => {
      setName('');
      setAdjustment('0');
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menambah varian.'),
  });

  const updateM = useMutation({
    mutationFn: (input: { id: string; name: string; priceAdjustment: number }) =>
      updateVariant(input.id, {
        name: input.name,
        priceAdjustment: input.priceAdjustment,
      }),
    onSuccess: () => {
      setEditingId(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan varian.'),
  });

  const deleteM = useMutation({
    mutationFn: (variantId: string) => deleteVariant(variantId),
    onSuccess: () => void invalidate(),
  });

  const toggleM = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      toggleVariant(input.id, input.isActive),
    onSuccess: () => void invalidate(),
  });

  const variants = variantsQ.data ?? [];

  function add() {
    const parsed = variantSchema.safeParse({
      name,
      priceAdjustment: Number(adjustment || 0),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Data varian tidak valid.');
      return;
    }
    setError(null);
    createM.mutate(parsed.data);
  }

  function saveEdit(variant: ProductVariant) {
    const parsed = variantSchema.safeParse({
      name: draft.name,
      priceAdjustment: Number(draft.adjustment || 0),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Data varian tidak valid.');
      return;
    }
    setError(null);
    updateM.mutate({ id: variant.id, ...parsed.data });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {variantsQ.isPending ? (
          <p className="text-xs text-lp-on-surface-variant">Memuat varian…</p>
        ) : variants.length === 0 ? (
          <p className="text-xs text-lp-on-surface-variant">
            Belum ada varian. Tambahkan ukuran seperti Regular/Large.
          </p>
        ) : (
          variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center gap-2 rounded-lg bg-lp-surface-low p-2"
            >
              {editingId === variant.id ? (
                <>
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((d) => ({ ...d, name: event.target.value }))
                    }
                    aria-label="Nama varian"
                    className={inputCls}
                  />
                  <input
                    value={draft.adjustment}
                    onChange={(event) =>
                      setDraft((d) => ({ ...d, adjustment: event.target.value }))
                    }
                    type="number"
                    aria-label="Penyesuaian harga"
                    className={`${inputCls} w-28`}
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(variant)}
                    disabled={updateM.isPending}
                    className="rounded-lg bg-lp-primary px-2.5 py-1.5 text-xs font-bold text-lp-on-primary disabled:opacity-60"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg px-2 py-1.5 text-xs text-lp-on-surface-variant hover:bg-lp-surface-container"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-1 min-w-0 items-center gap-2">
                    <Icon name="drag_handle" className="text-[18px] text-lp-tertiary shrink-0" />
                    <span className="text-sm font-semibold text-lp-on-surface truncate">
                      {variant.name}
                    </span>
                    {variant.priceAdjustment === 0 && (
                      <span className="rounded bg-lp-surface-container-highest px-1.5 py-0.5 text-[10px] text-lp-on-surface">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="font-lp-mono text-xs font-bold text-lp-on-surface">
                    {variant.priceAdjustment === 0
                      ? '(harga dasar)'
                      : `+${formatIDR(variant.priceAdjustment)}`}
                  </span>
                  <label className="flex items-center gap-1 text-[11px] text-lp-tertiary">
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(event) =>
                        toggleM.mutate({
                          id: variant.id,
                          isActive: event.target.checked,
                        })
                      }
                      className="h-3.5 w-3.5 rounded border-lp-outline-variant text-lp-primary"
                    />
                    Aktif
                  </label>
                  <button
                    type="button"
                    aria-label={`Edit varian ${variant.name}`}
                    onClick={() => {
                      setError(null);
                      setEditingId(variant.id);
                      setDraft({
                        name: variant.name,
                        adjustment: String(variant.priceAdjustment),
                      });
                    }}
                    className="rounded-lg p-1 text-lp-on-surface-variant hover:bg-lp-surface-container"
                  >
                    <Icon name="edit" className="text-[16px]" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus varian ${variant.name}`}
                    disabled={deleteM.isPending}
                    onClick={() => setVariantToDelete(variant)}
                    className="rounded-lg p-1 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container"
                  >
                    <Icon name="delete" className="text-[16px]" />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-lp-surface-container pt-3">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-semibold text-lp-on-surface-variant">
            Nama varian
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Large (16oz)"
            aria-label="Nama varian baru"
            className={inputCls}
          />
        </div>
        <div className="w-28">
          <label className="mb-1 block text-[11px] font-semibold text-lp-on-surface-variant">
            +Harga
          </label>
          <input
            value={adjustment}
            onChange={(event) => setAdjustment(event.target.value)}
            type="number"
            aria-label="Penyesuaian harga varian baru"
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={createM.isPending}
          className="flex h-9 items-center gap-1 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary disabled:opacity-60"
        >
          <Icon name="add" className="text-[16px]" />
          Tambah
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={variantToDelete !== null}
        title={`Hapus Varian "${variantToDelete?.name}"?`}
        description="Varian ukuran/porsi ini akan dihapus dari pilihan menu di kasir."
        confirmText="Ya, Hapus Varian"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteM.isPending}
        onClose={() => setVariantToDelete(null)}
        onConfirm={() => {
          if (variantToDelete) {
            deleteM.mutate(variantToDelete.id, {
              onSettled: () => setVariantToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}
