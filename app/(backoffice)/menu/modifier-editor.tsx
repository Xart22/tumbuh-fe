'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import {
  createModifier,
  createModifierGroup,
  deleteModifier,
  deleteModifierGroup,
  listModifierGroups,
} from '@/lib/api';
import { formatIDR } from '@/lib/format';

export const modifierGroupSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama grup wajib diisi.'),
    isRequired: z.boolean(),
    minSelect: z.number({ error: 'Min harus angka.' }).int().min(0),
    maxSelect: z.number({ error: 'Max harus angka.' }).int().min(1),
  })
  .refine((value) => value.maxSelect >= value.minSelect, {
    path: ['maxSelect'],
    message: 'Max tidak boleh kurang dari Min.',
  });

export const modifierSchema = z.object({
  name: z.string().trim().min(1, 'Nama pilihan wajib diisi.'),
  priceAddition: z
    .number({ error: 'Tambahan harga harus angka.' })
    .int('Gunakan angka bulat.')
    .min(0, 'Tidak boleh negatif.'),
});

const inputCls =
  'w-full rounded-lg bg-lp-surface-low px-2.5 py-1.5 text-sm text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container';

/** Modifier groups (required/optional choice sets) for one product. */
export function ModifierEditor({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [maxSelect, setMaxSelect] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [newModifier, setNewModifier] = useState<Record<string, string>>({});
  const [newModifierPrice, setNewModifierPrice] = useState<
    Record<string, string>
  >({});

  const key = ['menu', 'modifier-groups', productId];
  const groupsQ = useQuery({
    queryKey: key,
    queryFn: () => listModifierGroups(productId),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const createGroupM = useMutation({
    mutationFn: (input: {
      name: string;
      isRequired: boolean;
      minSelect: number;
      maxSelect: number;
    }) => createModifierGroup(productId, input),
    onSuccess: () => {
      setGroupName('');
      setIsRequired(false);
      setMaxSelect('1');
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menambah grup.'),
  });

  const deleteGroupM = useMutation({
    mutationFn: (groupId: string) => deleteModifierGroup(groupId),
    onSuccess: () => void invalidate(),
  });

  const createModifierM = useMutation({
    mutationFn: (input: { groupId: string; name: string; priceAddition: number }) =>
      createModifier(input.groupId, {
        name: input.name,
        priceAddition: input.priceAddition,
      }),
    onSuccess: (_data, variables) => {
      setNewModifier((state) => ({ ...state, [variables.groupId]: '' }));
      setNewModifierPrice((state) => ({ ...state, [variables.groupId]: '' }));
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menambah pilihan.'),
  });

  const deleteModifierM = useMutation({
    mutationFn: (modifierId: string) => deleteModifier(modifierId),
    onSuccess: () => void invalidate(),
  });

  const groups = groupsQ.data ?? [];

  function addGroup() {
    const parsed = modifierGroupSchema.safeParse({
      name: groupName,
      isRequired,
      minSelect: isRequired ? 1 : 0,
      maxSelect: Number(maxSelect || 1),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Data grup tidak valid.');
      return;
    }
    setError(null);
    createGroupM.mutate(parsed.data);
  }

  function addModifier(groupId: string) {
    const draft = newModifier[groupId] ?? '';
    const parsed = modifierSchema.safeParse({
      name: draft,
      priceAddition: Number(newModifierPrice[groupId] || 0),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Pilihan tidak valid.');
      return;
    }
    setError(null);
    createModifierM.mutate({ groupId, ...parsed.data });
  }

  return (
    <div className="flex flex-col gap-3">
      {groupsQ.isPending ? (
        <p className="text-xs text-lp-on-surface-variant">Memuat modifier…</p>
      ) : groups.length === 0 ? (
        <p className="text-xs text-lp-on-surface-variant">
          Belum ada grup modifier. Contoh: Sugar Level, Ice Level.
        </p>
      ) : (
        groups.map((group) => (
          <div
            key={group.id}
            className="flex flex-col gap-2 rounded-lg border border-lp-surface-container p-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-lp-on-surface">
                {group.name}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    group.isRequired
                      ? 'bg-lp-primary-fixed/50 text-lp-on-primary-fixed'
                      : 'bg-lp-surface-container-high text-lp-on-surface-variant'
                  }`}
                >
                  {group.isRequired ? 'Wajib' : 'Opsional'}
                </span>
                <span className="text-[10px] text-lp-tertiary">
                  pilih {group.minSelect}–{group.maxSelect}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Hapus grup ${group.name}`}
                disabled={deleteGroupM.isPending}
                onClick={() => {
                  if (window.confirm(`Hapus grup "${group.name}"?`)) {
                    deleteGroupM.mutate(group.id);
                  }
                }}
                className="rounded-lg p-1 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container"
              >
                <Icon name="delete" className="text-[16px]" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(group.modifiers ?? []).length === 0 ? (
                <span className="text-[11px] text-lp-tertiary">
                  Belum ada pilihan.
                </span>
              ) : (
                group.modifiers?.map((modifier) => (
                  <span
                    key={modifier.id}
                    className="flex items-center gap-1 rounded-full bg-lp-surface-low px-2 py-0.5 text-[11px] text-lp-on-surface"
                  >
                    {modifier.name}
                    {modifier.priceAddition > 0 && (
                      <span className="font-lp-mono text-lp-tertiary">
                        +{formatIDR(modifier.priceAddition)}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`Hapus ${modifier.name}`}
                      onClick={() => deleteModifierM.mutate(modifier.id)}
                      className="text-lp-on-surface-variant hover:text-lp-error"
                    >
                      <Icon name="close" className="text-[13px]" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={newModifier[group.id] ?? ''}
                onChange={(event) =>
                  setNewModifier((state) => ({
                    ...state,
                    [group.id]: event.target.value,
                  }))
                }
                placeholder="Tambah pilihan…"
                aria-label={`Pilihan baru untuk ${group.name}`}
                className={inputCls}
              />
              <input
                value={newModifierPrice[group.id] ?? ''}
                onChange={(event) =>
                  setNewModifierPrice((state) => ({
                    ...state,
                    [group.id]: event.target.value,
                  }))
                }
                type="number"
                min={0}
                step={500}
                placeholder="+Rp 0"
                aria-label={`Tambahan harga untuk ${group.name}`}
                className={`${inputCls} w-24 shrink-0 font-lp-mono`}
              />
              <button
                type="button"
                onClick={() => addModifier(group.id)}
                disabled={createModifierM.isPending}
                className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-lp-surface-container-high px-2.5 text-xs font-bold text-lp-on-surface disabled:opacity-60"
              >
                <Icon name="add" className="text-[14px]" />
                Tambah
              </button>
            </div>
          </div>
        ))
      )}

      <div className="flex flex-col gap-2 border-t border-lp-surface-container pt-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-semibold text-lp-on-surface-variant">
              Grup baru
            </label>
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Sugar Level"
              aria-label="Nama grup modifier baru"
              className={inputCls}
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-[11px] font-semibold text-lp-on-surface-variant">
              Max
            </label>
            <input
              value={maxSelect}
              onChange={(event) => setMaxSelect(event.target.value)}
              type="number"
              min={1}
              aria-label="Maksimum pilihan"
              className={inputCls}
            />
          </div>
          <label className="flex h-9 items-center gap-1 text-[11px] text-lp-on-surface-variant">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(event) => setIsRequired(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-lp-outline-variant text-lp-primary"
            />
            Wajib
          </label>
          <button
            type="button"
            onClick={addGroup}
            disabled={createGroupM.isPending}
            className="flex h-9 items-center gap-1 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary disabled:opacity-60"
          >
            <Icon name="library_add" className="text-[16px]" />
            Grup
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {error}
        </p>
      )}
    </div>
  );
}
