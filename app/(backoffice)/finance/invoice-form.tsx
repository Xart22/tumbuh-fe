'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { Overlay } from '@/components/overlay';
import type { Supplier } from '@/lib/types';

export const invoiceSchema = z.object({
  supplierId: z.string().min(1, 'Supplier wajib dipilih.'),
  invoiceNumber: z
    .string()
    .trim()
    .max(100, 'Nomor invoice maksimal 100 karakter.')
    .optional(),
  totalAmount: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, 'Total harus lebih dari 0.'),
  dueDate: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function toInvoicePayload(values: InvoiceFormValues): {
  supplierId: string;
  totalAmount: number;
  invoiceNumber?: string;
  dueDate?: string;
} {
  return {
    supplierId: values.supplierId,
    totalAmount: Number(values.totalAmount),
    invoiceNumber: values.invoiceNumber?.trim() || undefined,
    dueDate: values.dueDate || undefined,
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

export function InvoiceFormModal({
  suppliers,
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  suppliers: Supplier[];
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: InvoiceFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      supplierId: suppliers[0]?.id ?? '',
      invoiceNumber: '',
      totalAmount: '',
      dueDate: '',
    },
  });

  return (
    <Overlay title="Catat Hutang Supplier" onClose={onClose}>
      <form
        noValidate
        className="space-y-1"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <div>
          <label htmlFor="inv-sup" className={labelCls}>
            Supplier
          </label>
          <select
            id="inv-sup"
            {...register('supplierId')}
            aria-invalid={!!errors.supplierId}
            className={inputCls}
          >
            {suppliers.length === 0 && <option value="">Belum ada supplier</option>}
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.supplierId?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="inv-no" className={labelCls}>
              Nomor invoice
            </label>
            <input
              id="inv-no"
              {...register('invoiceNumber')}
              placeholder="INV-001"
              className={inputCls}
            />
            <FieldError message={errors.invoiceNumber?.message} />
          </div>
          <div>
            <label htmlFor="inv-total" className={labelCls}>
              Total
            </label>
            <input
              id="inv-total"
              {...register('totalAmount')}
              type="number"
              min={0}
              step={1000}
              aria-invalid={!!errors.totalAmount}
              className={inputCls}
            />
            <FieldError message={errors.totalAmount?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="inv-due" className={labelCls}>
            Jatuh tempo
          </label>
          <input
            id="inv-due"
            {...register('dueDate')}
            type="date"
            className={inputCls}
          />
          <FieldError />
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
            disabled={pending || suppliers.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-lp-primary px-5 py-2.5 text-sm font-bold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="receipt_long" className="text-[18px]" />
            {pending ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
