'use client';

import { useMemo, useState } from 'react';
import { formatIDR } from '@/lib/format';
import type { ModifierGroup, ProductVariant } from '@/lib/types';
import type { PendingLine } from '@/stores/cart-store';
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--line)] bg-panel sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{productName}</h2>
            <p className="text-sm text-muted">Total {formatIDR(unitBase + additions)}</p>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            Tutup
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeVariants.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Varian
              </p>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      v.id === variantId
                        ? 'border-teal-600 bg-teal-950/40 text-ink'
                        : 'border-[var(--line)] text-muted hover:text-ink'
                    }`}
                  >
                    {v.name}
                    {v.priceAdjustment !== 0 && (
                      <span className="ml-1 text-xs">
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
            <div key={group.id} className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                {group.name}
                <span className="ml-2 normal-case">
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
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          picked
                            ? 'border-teal-600 bg-teal-950/40 text-ink'
                            : 'border-[var(--line)] text-muted hover:text-ink'
                        }`}
                      >
                        {modifier.name}
                        {modifier.priceAddition !== 0 && (
                          <span className="ml-1 text-xs">
                            +{formatIDR(modifier.priceAddition)}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}

          <Field label="Catatan">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="tanpa bawang, es sedikit…"
            />
          </Field>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        <div className="border-t border-[var(--line)] p-4">
          <Button className="w-full" onClick={confirm}>
            Tambah · {formatIDR(unitBase + additions)}
          </Button>
        </div>
      </div>
    </div>
  );
}
