'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { Overlay } from '@/components/overlay';

export const outletSchema = z.object({
  name: z.string().trim().min(1, 'Nama outlet wajib diisi.'),
  address: z.string().trim().max(255, 'Alamat maksimal 255 karakter.').optional(),
  city: z.string().trim().max(100, 'Kota maksimal 100 karakter.').optional(),
  phone: z.string().trim().max(20, 'Nomor HP maksimal 20 karakter.').optional(),
  picName: z.string().trim().max(120, 'Nama PIC maksimal 120 karakter.').optional(),
  timezone: z.string().trim().min(1, 'Timezone wajib diisi.'),
});

export type OutletFormValues = z.infer<typeof outletSchema>;

export function toOutletInput(values: OutletFormValues) {
  return {
    name: values.name.trim(),
    address: values.address?.trim() || undefined,
    city: values.city?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    picName: values.picName?.trim() || undefined,
    timezone: values.timezone.trim(),
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

export function OutletFormModal({
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: OutletFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OutletFormValues>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      phone: '',
      picName: '',
      timezone: 'Asia/Jakarta',
    },
  });

  return (
    <Overlay title="Tambah Outlet" onClose={onClose}>
      <form
        noValidate
        className="space-y-1"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <div>
          <label htmlFor="no-name" className={labelCls}>
            Nama outlet
          </label>
          <input
            id="no-name"
            {...register('name')}
            autoFocus
            aria-invalid={!!errors.name}
            className={inputCls}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <label htmlFor="no-address" className={labelCls}>
            Alamat
          </label>
          <input id="no-address" {...register('address')} className={inputCls} />
          <FieldError message={errors.address?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="no-city" className={labelCls}>
              Kota
            </label>
            <input id="no-city" {...register('city')} className={inputCls} />
            <FieldError message={errors.city?.message} />
          </div>
          <div>
            <label htmlFor="no-phone" className={labelCls}>
              Nomor HP
            </label>
            <input id="no-phone" {...register('phone')} className={inputCls} />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="no-pic" className={labelCls}>
              Nama PIC
            </label>
            <input id="no-pic" {...register('picName')} className={inputCls} />
            <FieldError message={errors.picName?.message} />
          </div>
          <div>
            <label htmlFor="no-tz" className={labelCls}>
              Timezone
            </label>
            <input id="no-tz" {...register('timezone')} className={inputCls} />
            <FieldError message={errors.timezone?.message} />
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className="text-xs font-medium text-lp-error">
            {errorMessage}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-3">
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
            className="flex items-center gap-1.5 rounded-lg bg-lp-primary px-5 py-2.5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
          >
            <Icon name="storefront" className="text-[18px]" />
            {pending ? 'Menyimpan…' : 'Tambah Outlet'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
