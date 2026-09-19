'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { setOutletDailyTarget } from '@/lib/api';

/**
 * Inline daily-revenue-target editor. Lives inside the "Omzet Hari Ini" KPI so
 * the owner never needs a settings route to set it. BE enforces owner/manager.
 */
export function TargetEditor({
  outletId,
  current,
  canEdit,
}: {
  outletId: string | null;
  current: number;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current > 0 ? String(current) : '');

  const mutation = useMutation({
    mutationFn: (amount: number) => setOutletDailyTarget(outletId!, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'daily'] });
      setEditing(false);
    },
  });

  if (!outletId || !canEdit) return null;

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(current > 0 ? String(current) : '');
          setEditing(true);
        }}
        className="text-[11px] font-semibold text-lp-primary hover:underline"
      >
        {current > 0 ? 'Ubah target' : 'Atur target'}
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const amount = Number(value.replace(/[^\d]/g, ''));
        if (Number.isFinite(amount) && amount >= 0) mutation.mutate(amount);
      }}
      className="flex items-center gap-1"
    >
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Target harian (Rp)"
        aria-label="Target omzet harian"
        className="h-7 w-36 rounded border border-lp-outline-variant px-2 text-[11px] text-lp-on-surface outline-none focus:border-lp-primary"
      />
      <Button
        type="submit"
        disabled={mutation.isPending}
        className="h-7 px-2 text-[11px]"
      >
        {mutation.isPending ? '…' : 'Simpan'}
      </Button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-[11px] text-lp-tertiary hover:underline"
      >
        Batal
      </button>
      {mutation.isError && (
        <span className="text-[11px] text-lp-error">Gagal menyimpan</span>
      )}
    </form>
  );
}
