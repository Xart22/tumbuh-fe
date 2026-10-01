'use client';

import { useMemo, useState } from 'react';
import { formatIDR } from '@/lib/format';
import type { ModifierGroup, ProductVariant } from '@/lib/types';
import type { PendingLine } from '@/stores/cart-store';
import { Icon } from './icon';
import { Button, Field, Input } from './pos-ui';

type Selection = Record<string, string[]>;

export function ModifierModal({
  productId,
  productName,
  basePrice,
  variants,
  groups,
  onCancel,
  onConfirm,
}: {
  productId: string;
  productName: string;
  basePrice: number;
  variants: ProductVariant[];
  groups: ModifierGroup[];
  onCancel: () => void;
  onConfirm: (line: PendingLine) => void;
}) {
  const activeVariants = variants.filter((v) => v.isActive);
  const [variantId, setVariantId] = useState(activeVariants[0]?.id ?? '');
  const [selection, setSelection] = useState<Selection>(() => {
    const initial: Selection = {};
    for (const group of groups) {
      // Pre-select the first option of a required group so the cashier can
      // confirm immediately — required groups block submission otherwise.
      initial[group.id] =
        group.isRequired || group.minSelect > 0
          ? group.modifiers.slice(0, Math.max(group.minSelect, 1)).map((m) => m.id)
          : [];
    }
    return initial;
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const variant = activeVariants.find((v) => v.id === variantId);
  const unitBase = basePrice + (variant?.priceAdjustment ?? 0);

  const selectedGroups = useMemo(
    () =>
      groups.map((group) => ({
        groupId: group.id,
        groupName: group.name,
        selected: group.modifiers
          .filter((m) => (selection[group.id] ?? []).includes(m.id))
          .map((m) => ({
            id: m.id,
            name: m.name,
            priceAddition: m.priceAddition,
          })),
      })),
    [groups, selection],
  );

  const additions = selectedGroups.reduce(
    (sum, g) => sum + g.selected.reduce((s, m) => s + m.priceAddition, 0),
    0,
  );

  function toggle(group: ModifierGroup, modifierId: string) {
    setSelection((prev) => {
      const current = prev[group.id] ?? [];
      const isSelected = current.includes(modifierId);

      if (group.maxSelect === 1) {
        return { ...prev, [group.id]: isSelected ? [] : [modifierId] };
      }
      if (isSelected) {
        return { ...prev, [group.id]: current.filter((id) => id !== modifierId) };
      }
      if (current.length >= group.maxSelect) return prev;
      return { ...prev, [group.id]: [...current, modifierId] };
    });
  }

  function confirm() {
    for (const group of groups) {
      const picked = (selection[group.id] ?? []).length;
      const min = group.isRequired ? Math.max(group.minSelect, 1) : group.minSelect;
      if (picked < min) {
        setError(`"${group.name}" wajib pilih minimal ${min}.`);
        return;
      }
    }
    onConfirm({
      productId,
      productName,
      variantId: variant?.id,
      variantName: variant?.name,
      basePrice: unitBase,
      modifierGroups: selectedGroups.filter((g) => g.selected.length > 0),
      notes,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest shadow-2xl sm:rounded-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-lp-outline-variant/20 bg-lp-surface-container-lowest p-4">
          <div>
            <h2 className="text-base font-bold text-lp-on-surface">{productName}</h2>
            <p className="text-xs font-semibold text-lp-on-surface-variant font-lp-mono mt-0.5">
              Total <span className="text-lp-primary font-bold">{formatIDR(unitBase + additions)}</span>
            </p>
          </div>
          <Button variant="ghost" onClick={onCancel} className="py-1 px-3 text-xs">
            Tutup
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeVariants.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant">
                Varian Produk
              </p>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-xl border px-3 py-2 text-xs transition-all ${
                      v.id === variantId
                        ? 'border-lp-primary bg-emerald-50 text-lp-primary font-bold shadow-xs'
                        : 'border-lp-outline-variant/30 bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface font-medium'
                    }`}
                  >
                    <span>{v.name}</span>
                    {v.priceAdjustment !== 0 && (
                      <span className="ml-1 text-[11px] font-lp-mono">
                        {v.priceAdjustment > 0 ? '+' : ''}
                        {formatIDR(v.priceAdjustment)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant">
                {group.name}
                <span className="ml-1.5 normal-case font-medium text-lp-outline">
                  {group.isRequired ? '(wajib)' : `(maks ${group.maxSelect})`}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {group.modifiers
                  .filter((m) => m.isActive)
                  .map((modifier) => {
                    const picked = (selection[group.id] ?? []).includes(modifier.id);
                    return (
                      <button
                        key={modifier.id}
                        type="button"
                        onClick={() => toggle(group, modifier.id)}
                        className={`rounded-xl border px-3 py-2 text-xs transition-all ${
                          picked
                            ? 'border-lp-primary bg-emerald-50 text-lp-primary font-bold shadow-xs'
                            : 'border-lp-outline-variant/30 bg-lp-surface-low text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface font-medium'
                        }`}
                      >
                        <span>{modifier.name}</span>
                        {modifier.priceAddition !== 0 && (
                          <span className="ml-1 text-[11px] font-lp-mono">
                            +{formatIDR(modifier.priceAddition)}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}

          <Field label="Catatan Tambahan">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: tanpa bawang, es sedikit..."
              className="text-xs"
            />
          </Field>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 flex items-center gap-1.5">
              <Icon name="error" className="text-sm" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="border-t border-lp-outline-variant/20 bg-lp-surface-container-lowest p-4">
          <Button className="w-full h-11 text-sm font-bold shadow-sm flex items-center justify-center gap-2" onClick={confirm}>
            <Icon name="add_circle" className="text-base" />
            <span>Tambah ke Pesanan · {formatIDR(unitBase + additions)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
