'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { Overlay } from '@/components/overlay';
import type { ExpenseInput } from '@/lib/api';
import {
  EXPENSE_CATEGORY_SUGGESTIONS,
  EXPENSE_COST_TYPES,
} from '@/lib/types';

export const expenseSchema = z.object({
  category: z.string().trim().min(1, 'Kategori wajib diisi.'),
  costType: z.enum(EXPENSE_COST_TYPES),
  amount: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, 'Jumlah harus lebih dari 0.'),
  description: z.string().trim().max(200, 'Keterangan maksimal 200 karakter.').optional(),
  expenseDate: z.string().min(1, 'Tanggal wajib diisi.'),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function toExpenseInput(values: ExpenseFormValues): ExpenseInput {
  return {
    category: values.category.trim(),
    costType: values.costType,
    amount: Number(values.amount),
    description: values.description?.trim() || undefined,
    expenseDate: values.expenseDate,
  };
}

const labelCls =
  'mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary';
const inputCls =
  'w-full rounded-lg border border-lp-outline-variant bg-lp-surface-container-lowest px-3 py-2.5 text-sm font-medium text-lp-on-surface outline-none transition focus:border-lp-primary aria-[invalid=true]:border-lp-error';

function FieldError({ message }: { message?: string }) {
  return (
    <div className="min-h-4">
      {message && (
        <p role="alert" className="mt-1 text-xs font-medium text-lp-error">
          {message}
        </p>
      )}
    </div>
  );
}

export function ExpenseFormModal({
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => void;
}) {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '',
      costType: 'variable',
      amount: '',
      description: '',
      expenseDate: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    },
  });

  return (
    <Overlay title="Catat Pengeluaran" onClose={onClose}>
      <form
        noValidate
        className="space-y-1"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="x-cat" className={labelCls}>
              Kategori
            </label>
            <input
              id="x-cat"
              {...register('category')}
              list="expense-categories"
              autoFocus
              placeholder="Operasional"
              aria-invalid={!!errors.category}
              className={inputCls}
            />
            <datalist id="expense-categories">
              {EXPENSE_CATEGORY_SUGGESTIONS.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
            <FieldError message={errors.category?.message} />
          </div>
          <div>
            <label htmlFor="x-type" className={labelCls}>
              Jenis biaya
            </label>
            <select id="x-type" {...register('costType')} className={inputCls}>
              <option value="variable">Variabel</option>
              <option value="fixed">Tetap</option>
            </select>
            <FieldError message={errors.costType?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="x-amount" className={labelCls}>
              Jumlah
            </label>
            <input
              id="x-amount"
              {...register('amount')}
              type="number"
              min={0}
              step={1000}
              aria-invalid={!!errors.amount}
              className={inputCls}
            />
            <FieldError message={errors.amount?.message} />
          </div>
          <div>
            <label htmlFor="x-date" className={labelCls}>
              Tanggal
            </label>
            <input
              id="x-date"
              {...register('expenseDate')}
              type="date"
              aria-invalid={!!errors.expenseDate}
              className={inputCls}
            />
            <FieldError message={errors.expenseDate?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="x-desc" className={labelCls}>
            Keterangan
          </label>
          <input
            id="x-desc"
            {...register('description')}
            placeholder="Gas, sabun, plastik…"
            className={inputCls}
          />
          <FieldError message={errors.description?.message} />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-1 rounded-lg border border-lp-error-container bg-lp-error-container px-3 py-2 text-xs font-medium text-lp-on-error-container"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-lp-primary px-5 py-2.5 text-sm font-bold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="payments" className="text-[18px]" />
            {pending ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
