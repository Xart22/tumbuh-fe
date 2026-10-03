'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { DropdownSearch } from '@/components/ui/dropdown-search';
import { getProductRecipe, listUnits, replaceProductRecipe } from '@/lib/api';
import { formatIDR, formatQty } from '@/lib/format';
import type { RawMaterial } from '@/lib/types';
import { recipeQtyInStockUnit } from './unit-convert';

type DraftItem = { rawMaterialId: string; qtyUsed: number; unit: string };

/**
 * Bill of materials for one product. The BE stores each line in its own unit
 * and converts on consumption, so the stored `unit` is preserved verbatim —
 * rewriting it to the material's current unit would silently rescale the qty.
 */
export function RecipeEditor({
  product,
  materials,
}: {
  product: { id: string; name: string; basePrice: number };
  materials: RawMaterial[];
}) {
  const recipeQ = useQuery({
    queryKey: ['inventory', 'recipe', product.id],
    queryFn: () => getProductRecipe(product.id),
  });

  if (recipeQ.isPending) {
    return <p className="text-sm text-lp-on-surface-variant">Memuat resep…</p>;
  }
  if (recipeQ.isError) {
    return (
      <p className="text-sm text-lp-error">
        {recipeQ.error instanceof Error
          ? recipeQ.error.message
          : 'Gagal memuat resep.'}
      </p>
    );
  }

  return (
    <RecipeForm
      key={product.id}
      product={product}
      materials={materials}
      initial={recipeQ.data.items.map((item) => ({
        rawMaterialId: item.rawMaterialId,
        qtyUsed: item.qtyUsed,
        unit: item.unit,
      }))}
    />
  );
}

function RecipeForm({
  product,
  materials,
  initial,
}: {
  product: { id: string; name: string; basePrice: number };
  materials: RawMaterial[];
  initial: DraftItem[];
}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<DraftItem[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const unitsQ = useQuery({ queryKey: ['units'], queryFn: listUnits });
  const units = unitsQ.data ?? [];

  const byId = new Map(materials.map((material) => [material.id, material]));
  const usedIds = new Set(items.map((item) => item.rawMaterialId));
  const available = materials.filter((material) => !usedIds.has(material.id));
  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: m.name,
    badge: m.sku ?? undefined,
    subLabel: `${formatIDR(m.costPerUnit)} / ${m.stockUnitCode ?? m.unit}`,
  }));

  // Cost per stock unit: convert a line stored in another unit before pricing.
  const costOf = (item: DraftItem): number => {
    const material = byId.get(item.rawMaterialId);
    if (!material) return 0;
    const stockUnit = material.stockUnitCode ?? material.unit;
    const qtyStock = recipeQtyInStockUnit(
      item.qtyUsed,
      item.unit,
      stockUnit,
      units,
    );
    return qtyStock * material.costPerUnit;
  };

  const hpp = items.reduce((sum, item) => sum + costOf(item), 0);
  const foodCostPct = product.basePrice > 0 ? (hpp / product.basePrice) * 100 : null;
  const marginPct =
    product.basePrice > 0 ? ((product.basePrice - hpp) / product.basePrice) * 100 : null;

  const saveM = useMutation({
    mutationFn: () =>
      replaceProductRecipe(
        product.id,
        items
          .filter((item) => item.qtyUsed > 0)
          .map((item) => ({
            rawMaterialId: item.rawMaterialId,
            qtyUsed: item.qtyUsed,
            unit: item.unit,
          })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['inventory', 'recipe', product.id],
      });
      queryClient.invalidateQueries({ queryKey: ['reports', 'margins'] });
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan resep.'),
  });

  function addRow() {
    const next = available[0];
    if (!next) return;
    setItems((state) => [
      ...state,
      { rawMaterialId: next.id, qtyUsed: 1, unit: next.stockUnitCode ?? next.unit },
    ]);
  }

  if (materials.length === 0) {
    return (
      <p className="text-sm text-lp-on-surface-variant">
        Belum ada bahan baku. Tambahkan bahan dulu di tab Bahan Baku.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-lp-tertiary">
              <th className="pb-2">Bahan (BOM)</th>
              <th className="pb-2 text-right">Qty / serving</th>
              <th className="pb-2">Satuan</th>
              <th className="pb-2 text-right">Biaya</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-3 text-xs text-lp-tertiary">
                  Resep kosong. Tambahkan bahan untuk menghitung HPP.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const cost = costOf(item);
                return (
                  <tr
                    key={item.rawMaterialId}
                    className="border-t border-lp-surface-container"
                  >
                    <td className="py-2 pr-2">
                      <DropdownSearch
                        size="sm"
                        value={item.rawMaterialId}
                        aria-label={`Bahan baris ${index + 1}`}
                        onChange={(val) =>
                          setItems((state) =>
                            state.map((row, i) => {
                              if (i !== index) return row;
                              const next = byId.get(val);
                              return {
                                ...row,
                                rawMaterialId: val,
                                unit:
                                  next?.stockUnitCode ??
                                  next?.unit ??
                                  row.unit,
                              };
                            }),
                          )
                        }
                        placeholder="Pilih bahan…"
                        searchPlaceholder="Cari bahan baku / SKU…"
                        options={materialOptions}
                      />
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.qtyUsed}
                        aria-label={`Qty bahan baris ${index + 1}`}
                        onChange={(event) =>
                          setItems((state) =>
                            state.map((row, i) =>
                              i === index
                                ? { ...row, qtyUsed: Number(event.target.value) }
                                : row,
                            ),
                          )
                        }
                        className="w-24 rounded-lg border border-lp-outline-variant px-2 py-1.5 text-right font-lp-mono text-sm outline-none focus:border-lp-primary"
                      />
                    </td>
                    <td className="py-2 text-xs text-lp-on-surface-variant">
                      {item.unit || '—'}
                    </td>
                    <td className="py-2 text-right font-lp-mono text-sm text-lp-on-surface">
                      {formatIDR(cost)}
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <button
                        type="button"
                        aria-label={`Hapus bahan baris ${index + 1}`}
                        onClick={() =>
                          setItems((state) =>
                            state.filter((_, i) => i !== index),
                          )
                        }
                        className="rounded-lg p-1 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container"
                      >
                        <Icon name="close" className="text-[16px]" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={available.length === 0}
        className="flex w-fit items-center gap-1.5 rounded-lg bg-lp-surface-container-low px-3 py-1.5 text-xs font-semibold text-lp-on-surface hover:bg-lp-surface-container disabled:opacity-50"
      >
        <Icon name="add" className="text-[16px]" />
        Tambah bahan
      </button>

      <div className="grid grid-cols-1 gap-2 rounded-lg bg-lp-surface-low p-3 sm:grid-cols-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-lp-tertiary">
            Total HPP / serving
          </span>
          <span className="font-lp-mono text-lg font-bold text-lp-on-surface">
            {formatIDR(hpp)}
          </span>
          <span className="text-[11px] text-lp-tertiary">
            {formatQty(items.length)} bahan
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-lp-tertiary">
            Harga jual POS
          </span>
          <span className="font-lp-mono text-lg font-bold text-lp-on-surface">
            {formatIDR(product.basePrice)}
          </span>
          <span className="text-[11px] text-lp-tertiary">
            Food cost {foodCostPct === null ? '—' : `${foodCostPct.toFixed(1)}%`}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-lp-tertiary">
            Margin kotor
          </span>
          <span
            className={`font-lp-mono text-lg font-bold ${
              marginPct !== null && marginPct < 0 ? 'text-lp-error' : 'text-lp-primary'
            }`}
          >
            {formatIDR(product.basePrice - hpp)}
          </span>
          <span className="text-[11px] text-lp-tertiary">
            {marginPct === null ? '—' : `${marginPct.toFixed(1)}%`}
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {error}
        </p>
      )}
      {saveM.isSuccess && !error && (
        <p className="text-xs font-medium text-lp-primary">Resep tersimpan.</p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => saveM.mutate()}
          disabled={saveM.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="save" className="text-[18px]" />
          {saveM.isPending ? 'Menyimpan…' : 'Simpan Resep'}
        </button>
      </div>
    </div>
  );
}
