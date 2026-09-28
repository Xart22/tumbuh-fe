'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listOutletOverrides, setOutletOverride } from '@/lib/api';
import { formatIDR } from '@/lib/format';

type Draft = { price: string; available: boolean };

/**
 * Per-outlet price/availability for one product (E8). BE stores one row per
 * outlet; a blank price means "use the base price".
 */
export function OutletOverrideEditor({
  productId,
  basePrice,
}: {
  productId: string;
  basePrice: number;
}) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ['product-overrides', productId],
    queryFn: () => listOutletOverrides(productId),
  });
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const overrides = q.data ?? [];

  const saveM = useMutation({
    mutationFn: ({
      outletId,
      draft,
    }: {
      outletId: string;
      draft: Draft;
    }) =>
      setOutletOverride(productId, {
        outletId,
        priceOverride: draft.price.trim() === '' ? null : Number(draft.price),
        isAvailable: draft.available,
      }),
    onSuccess: (_result, variables) => {
      setError(null);
      setSavedId(variables.outletId);
      void queryClient.invalidateQueries({
        queryKey: ['product-overrides', productId],
      });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.'),
  });

  if (q.isPending) {
    return <p className="text-xs text-lp-tertiary">Memuat override…</p>;
  }
  if (q.isError) {
    return (
      <p className="text-xs text-lp-error">
        {q.error instanceof Error ? q.error.message : 'Gagal memuat override.'}
      </p>
    );
  }
  if (overrides.length <= 1) {
    return (
      <p className="text-xs text-lp-tertiary">
        Belum ada outlet lain untuk override harga.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {overrides.map((override) => {
        const draft =
          drafts[override.outletId] ?? {
            price: override.priceOverride === null ? '' : String(override.priceOverride),
            available: override.isAvailable,
          };
        return (
          <div
            key={override.outletId}
            className="flex flex-wrap items-center gap-2 rounded-lg bg-lp-surface-low px-3 py-2"
          >
            <span className="min-w-32 flex-1 text-xs font-semibold text-lp-on-surface">
              {override.outletName}
            </span>
            <input
              type="number"
              min={0}
              step={100}
              value={draft.price}
              onChange={(event) =>
                setDrafts((state) => ({
                  ...state,
                  [override.outletId]: { ...draft, price: event.target.value },
                }))
              }
              placeholder={formatIDR(basePrice)}
              aria-label={`Harga override ${override.outletName}`}
              className="h-8 w-28 rounded-lg border border-lp-outline-variant px-2 text-right font-lp-mono text-xs outline-none focus:border-lp-primary"
            />
            <label className="flex items-center gap-1 text-[11px] text-lp-on-surface-variant">
              <input
                type="checkbox"
                checked={draft.available}
                onChange={(event) =>
                  setDrafts((state) => ({
                    ...state,
                    [override.outletId]: {
                      ...draft,
                      available: event.target.checked,
                    },
                  }))
                }
              />
              Tersedia
            </label>
            <button
              type="button"
              disabled={saveM.isPending}
              onClick={() => saveM.mutate({ outletId: override.outletId, draft })}
              className="h-8 rounded-lg bg-lp-primary px-3 text-[11px] font-bold text-lp-on-primary disabled:opacity-60"
            >
              {savedId === override.outletId ? 'Tersimpan' : 'Simpan'}
            </button>
          </div>
        );
      })}

      {error && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {error}
        </p>
      )}
    </div>
  );
}
