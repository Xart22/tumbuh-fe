'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { Overlay } from '@/components/overlay';
import type { CustomerInput } from '@/lib/api';

export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Nomor HP wajib diisi.')
    .max(20, 'Nomor HP maksimal 20 karakter.'),
  email: z
    .string()
    .trim()
    .email('Email yang valid wajib diisi.')
    .optional()
    .or(z.literal('')),
  birthDate: z.string().optional(),
  notes: z.string().trim().max(500, 'Catatan maksimal 500 karakter.').optional(),
  referralCode: z.string().trim().max(50).optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export function toCustomerInput(values: CustomerFormValues): CustomerInput {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email?.trim() || undefined,
    birthDate: values.birthDate || undefined,
    notes: values.notes?.trim() || undefined,
    referralCode: values.referralCode?.trim() || undefined,
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

export function CustomerFormModal({
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      birthDate: '',
      notes: '',
      referralCode: '',
    },
  });

  return (
    <Overlay title="Tambah Pelanggan" onClose={onClose}>
      <form
        noValidate
        className="space-y-1"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <div>
          <label htmlFor="c-name" className={labelCls}>
            Nama
          </label>
          <input
            id="c-name"
            {...register('name')}
            autoFocus
            aria-invalid={!!errors.name}
            className={inputCls}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="c-phone" className={labelCls}>
              Nomor HP
            </label>
            <input
              id="c-phone"
              {...register('phone')}
              placeholder="0812…"
              aria-invalid={!!errors.phone}
              className={inputCls}
            />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <label htmlFor="c-email" className={labelCls}>
              Email
            </label>
            <input
              id="c-email"
              {...register('email')}
              type="email"
              placeholder="nama@email.com"
              aria-invalid={!!errors.email}
              className={inputCls}
            />
            <FieldError message={errors.email?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="c-birth" className={labelCls}>
              Tanggal lahir
            </label>
            <input
              id="c-birth"
              {...register('birthDate')}
              type="date"
              className={inputCls}
            />
            <FieldError />
          </div>
          <div>
            <label htmlFor="c-ref" className={labelCls}>
              Kode referral
            </label>
            <input
              id="c-ref"
              {...register('referralCode')}
              placeholder="REF…"
              className={inputCls}
            />
            <FieldError />
          </div>
        </div>

        <div>
          <label htmlFor="c-notes" className={labelCls}>
            Catatan
          </label>
          <input
            id="c-notes"
            {...register('notes')}
            placeholder="Alergi, preferensi, dll."
            className={inputCls}
          />
          <FieldError message={errors.notes?.message} />
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
            <Icon name="person_add" className="text-[18px]" />
            {pending ? 'Menyimpan…' : 'Tambah'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
