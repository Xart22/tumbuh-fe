'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { Overlay } from '@/components/overlay';
import type { VoucherInput } from '@/lib/api';
import { VOUCHER_TYPES } from '@/lib/types';

const money = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || Number(value) >= 0, `${label} tidak boleh negatif.`);

export const voucherSchema = z.object({
  code: z.string().trim().min(1, 'Kode wajib diisi.'),
  name: z.string().trim().min(1, 'Nama wajib diisi.'),
  type: z.enum(VOUCHER_TYPES),
  value: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, 'Nilai harus lebih dari 0.'),
  minOrder: money('Minimum order'),
  maxDiscount: money('Maksimal diskon'),
  maxUses: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (Number.isInteger(Number(value)) && Number(value) >= 1),
      'Batas pakai minimal 1.',
    ),
  expiresAt: z.string().optional(),
});

export type VoucherFormValues = z.infer<typeof voucherSchema>;

/** Empty optional strings become undefined so BE keeps its own defaults. */
export function toVoucherInput(values: VoucherFormValues): VoucherInput {
  const optionalNumber = (raw: string): number | undefined => {
    const trimmed = raw.trim();
    return trimmed === '' ? undefined : Number(trimmed);
  };
  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    type: values.type,
    value: Number(values.value),
    minOrder: optionalNumber(values.minOrder),
    maxDiscount: optionalNumber(values.maxDiscount),
    maxUses: optionalNumber(values.maxUses),
    expiresAt: values.expiresAt || undefined,
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

export function VoucherFormModal({
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: VoucherFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'percent',
      value: '',
      minOrder: '',
      maxDiscount: '',
      maxUses: '',
      expiresAt: '',
    },
  });

  return (
    <Overlay title="Tambah Voucher" onClose={onClose}>
      <form
        noValidate
        className="space-y-1"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="v-code" className={labelCls}>
              Kode
            </label>
            <input
              id="v-code"
              {...register('code')}
              autoFocus
              placeholder="DISKON10"
              aria-invalid={!!errors.code}
              className={inputCls}
            />
            <FieldError message={errors.code?.message} />
          </div>
          <div>
            <label htmlFor="v-name" className={labelCls}>
              Nama
            </label>
            <input
              id="v-name"
              {...register('name')}
              placeholder="Promo akhir bulan"
              aria-invalid={!!errors.name}
              className={inputCls}
            />
            <FieldError message={errors.name?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="v-type" className={labelCls}>
              Tipe
            </label>
            <select id="v-type" {...register('type')} className={inputCls}>
              <option value="percent">Persen (%)</option>
              <option value="fixed">Nominal (Rp)</option>
            </select>
            <FieldError message={errors.type?.message} />
          </div>
          <div>
            <label htmlFor="v-value" className={labelCls}>
              Nilai
            </label>
            <input
              id="v-value"
              {...register('value')}
              type="number"
              min={0}
              step={1}
              aria-invalid={!!errors.value}
              className={inputCls}
            />
            <FieldError message={errors.value?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="v-min" className={labelCls}>
              Minimum order
            </label>
            <input
              id="v-min"
              {...register('minOrder')}
              type="number"
              min={0}
              step={1000}
              placeholder="0"
              className={inputCls}
            />
            <FieldError message={errors.minOrder?.message} />
          </div>
          <div>
            <label htmlFor="v-maxdisc" className={labelCls}>
              Maksimal diskon
            </label>
            <input
              id="v-maxdisc"
              {...register('maxDiscount')}
              type="number"
              min={0}
              step={1000}
              placeholder="Tanpa batas"
              className={inputCls}
            />
            <FieldError message={errors.maxDiscount?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="v-maxuses" className={labelCls}>
              Batas pakai
            </label>
            <input
              id="v-maxuses"
              {...register('maxUses')}
              type="number"
              min={1}
              step={1}
              placeholder="Tanpa batas"
              className={inputCls}
            />
            <FieldError message={errors.maxUses?.message} />
          </div>
          <div>
            <label htmlFor="v-exp" className={labelCls}>
              Kedaluwarsa
            </label>
            <input
              id="v-exp"
              {...register('expiresAt')}
              type="date"
              className={inputCls}
            />
            <FieldError />
          </div>
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
            <Icon name="confirmation_number" className="text-[18px]" />
            {pending ? 'Menyimpan…' : 'Tambah'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
