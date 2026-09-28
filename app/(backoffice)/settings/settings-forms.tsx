'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import type { OutletDetail, OutletSettings } from '@/lib/types';

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

export const outletProfileSchema = z.object({
  name: z.string().trim().min(1, 'Nama outlet wajib diisi.'),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  postalCode: z
    .string()
    .trim()
    .max(10, 'Kode pos maksimal 10 karakter.')
    .optional(),
  phone: z.string().trim().max(20, 'Nomor HP maksimal 20 karakter.').optional(),
  picName: z.string().trim().max(120, 'Nama PIC maksimal 120 karakter.').optional(),
  timezone: z.string().trim().min(1, 'Timezone wajib diisi.'),
});

export type OutletProfileValues = z.infer<typeof outletProfileSchema>;

export function toProfilePayload(values: OutletProfileValues) {
  return {
    name: values.name.trim(),
    address: values.address?.trim() || null,
    city: values.city?.trim() || null,
    postalCode: values.postalCode?.trim() || null,
    phone: values.phone?.trim() || null,
    picName: values.picName?.trim() || null,
    timezone: values.timezone.trim(),
  };
}

export function OutletProfileForm({
  outlet,
  pending,
  errorMessage,
  onSubmit,
}: {
  outlet: OutletDetail;
  pending: boolean;
  errorMessage?: string | null;
  onSubmit: (values: OutletProfileValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OutletProfileValues>({
    resolver: zodResolver(outletProfileSchema),
    defaultValues: {
      name: outlet.name,
      address: outlet.address ?? '',
      city: outlet.city ?? '',
      postalCode: outlet.postalCode ?? '',
      phone: outlet.phone ?? '',
      picName: outlet.picName ?? '',
      timezone: outlet.timezone,
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-1"
      onSubmit={handleSubmit((values) => onSubmit(values))}
    >
      <div>
        <label htmlFor="o-name" className={labelCls}>
          Nama outlet
        </label>
        <input
          id="o-name"
          {...register('name')}
          aria-invalid={!!errors.name}
          className={inputCls}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="o-phone" className={labelCls}>
            Nomor HP
          </label>
          <input id="o-phone" {...register('phone')} className={inputCls} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <label htmlFor="o-pic" className={labelCls}>
            Nama PIC
          </label>
          <input id="o-pic" {...register('picName')} className={inputCls} />
          <FieldError message={errors.picName?.message} />
        </div>
      </div>

      <div>
        <label htmlFor="o-address" className={labelCls}>
          Alamat
        </label>
        <input id="o-address" {...register('address')} className={inputCls} />
        <FieldError message={errors.address?.message} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="o-city" className={labelCls}>
            Kota
          </label>
          <input id="o-city" {...register('city')} className={inputCls} />
          <FieldError message={errors.city?.message} />
        </div>
        <div>
          <label htmlFor="o-postal" className={labelCls}>
            Kode pos
          </label>
          <input id="o-postal" {...register('postalCode')} className={inputCls} />
          <FieldError message={errors.postalCode?.message} />
        </div>
        <div>
          <label htmlFor="o-tz" className={labelCls}>
            Timezone
          </label>
          <input id="o-tz" {...register('timezone')} className={inputCls} />
          <FieldError message={errors.timezone?.message} />
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
        >
          <Icon name="save" className="text-[18px]" />
          {pending ? 'Menyimpan…' : 'Simpan Profil'}
        </button>
      </div>
    </form>
  );
}

export const taxSchema = z.object({
  taxEnabled: z.boolean(),
  taxRate: z
    .number({ error: 'Tarif pajak wajib diisi.' })
    .min(0, 'Tidak boleh negatif.')
    .max(100, 'Maksimal 100%.'),
  taxName: z.string().trim().min(1, 'Nama pajak wajib diisi.'),
  scEnabled: z.boolean(),
  scRate: z
    .number({ error: 'Tarif service wajib diisi.' })
    .min(0, 'Tidak boleh negatif.')
    .max(100, 'Maksimal 100%.'),
  roundingBase: z
    .number({ error: 'Pembulatan wajib diisi.' })
    .int()
    .min(1, 'Minimal 1.')
    .max(100000, 'Maksimal 100000.'),
});

export type TaxValues = z.infer<typeof taxSchema>;

export function toTaxPatch(values: TaxValues): Partial<OutletSettings> {
  return {
    tax: {
      enabled: values.taxEnabled,
      rate: values.taxRate,
      name: values.taxName.trim(),
    },
    serviceCharge: { enabled: values.scEnabled, rate: values.scRate },
    roundingBase: values.roundingBase,
  };
}

export function TaxForm({
  settings,
  pending,
  errorMessage,
  onSubmit,
}: {
  settings: OutletSettings;
  pending: boolean;
  errorMessage?: string | null;
  onSubmit: (values: TaxValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaxValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      taxEnabled: settings.tax.enabled,
      taxRate: settings.tax.rate,
      taxName: settings.tax.name,
      scEnabled: settings.serviceCharge.enabled,
      scRate: settings.serviceCharge.rate,
      roundingBase: settings.roundingBase,
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-1"
      onSubmit={handleSubmit((values) => onSubmit(values))}
    >
      <label className="flex items-center gap-2 text-sm font-semibold text-lp-on-surface">
        <input type="checkbox" {...register('taxEnabled')} className="h-4 w-4" />
        Aktifkan pajak (PPN)
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="t-name" className={labelCls}>
            Nama pajak
          </label>
          <input id="t-name" {...register('taxName')} className={inputCls} />
          <FieldError message={errors.taxName?.message} />
        </div>
        <div>
          <label htmlFor="t-rate" className={labelCls}>
            Tarif pajak (%)
          </label>
          <input
            id="t-rate"
            {...register('taxRate', { valueAsNumber: true })}
            type="number"
            min={0}
            max={100}
            step={0.5}
            aria-invalid={!!errors.taxRate}
            className={inputCls}
          />
          <FieldError message={errors.taxRate?.message} />
        </div>
      </div>

      <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-lp-on-surface">
        <input type="checkbox" {...register('scEnabled')} className="h-4 w-4" />
        Aktifkan service charge
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="t-sc" className={labelCls}>
            Tarif service (%)
          </label>
          <input
            id="t-sc"
            {...register('scRate', { valueAsNumber: true })}
            type="number"
            min={0}
            max={100}
            step={0.5}
            aria-invalid={!!errors.scRate}
            className={inputCls}
          />
          <FieldError message={errors.scRate?.message} />
        </div>
        <div>
          <label htmlFor="t-round" className={labelCls}>
            Pembulatan ke (Rp)
          </label>
          <input
            id="t-round"
            {...register('roundingBase', { valueAsNumber: true })}
            type="number"
            min={1}
            step={100}
            aria-invalid={!!errors.roundingBase}
            className={inputCls}
          />
          <FieldError message={errors.roundingBase?.message} />
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
        >
          <Icon name="save" className="text-[18px]" />
          {pending ? 'Menyimpan…' : 'Simpan Pajak & Biaya'}
        </button>
      </div>
    </form>
  );
}

export const opsSchema = z.object({
  alertMinutes: z
    .number({ error: 'Menit alert wajib diisi.' })
    .int()
    .min(0, 'Tidak boleh negatif.'),
  maxRadiusM: z
    .number({ error: 'Radius wajib diisi.' })
    .int()
    .min(0, 'Tidak boleh negatif.'),
  requireGps: z.boolean(),
  requirePhoto: z.boolean(),
  receiptWhatsapp: z.boolean(),
});

export type OpsValues = z.infer<typeof opsSchema>;

export function toOpsPatch(values: OpsValues): Partial<OutletSettings> {
  return {
    kds: { alertMinutes: values.alertMinutes, stationRules: [] },
    attendance: {
      maxRadiusM: values.maxRadiusM,
      requireGps: values.requireGps,
      requirePhoto: values.requirePhoto,
    },
    receipt: { whatsapp: values.receiptWhatsapp },
  };
}

export function OpsForm({
  settings,
  pending,
  errorMessage,
  onSubmit,
}: {
  settings: OutletSettings;
  pending: boolean;
  errorMessage?: string | null;
  onSubmit: (values: OpsValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpsValues>({
    resolver: zodResolver(opsSchema),
    defaultValues: {
      alertMinutes: settings.kds.alertMinutes,
      maxRadiusM: settings.attendance.maxRadiusM,
      requireGps: settings.attendance.requireGps,
      requirePhoto: settings.attendance.requirePhoto,
      receiptWhatsapp: settings.receipt.whatsapp,
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-1"
      onSubmit={handleSubmit((values) => onSubmit(values))}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="k-alert" className={labelCls}>
            Alert dapur (menit)
          </label>
          <input
            id="k-alert"
            {...register('alertMinutes', { valueAsNumber: true })}
            type="number"
            min={0}
            aria-invalid={!!errors.alertMinutes}
            className={inputCls}
          />
          <FieldError message={errors.alertMinutes?.message} />
        </div>
        <div>
          <label htmlFor="k-radius" className={labelCls}>
            Radius absensi (meter, 0 = nonaktif)
          </label>
          <input
            id="k-radius"
            {...register('maxRadiusM', { valueAsNumber: true })}
            type="number"
            min={0}
            aria-invalid={!!errors.maxRadiusM}
            className={inputCls}
          />
          <FieldError message={errors.maxRadiusM?.message} />
        </div>
      </div>

      <label className="mt-2 flex items-center gap-2 text-sm text-lp-on-surface">
        <input type="checkbox" {...register('requireGps')} className="h-4 w-4" />
        Wajib GPS saat clock-in
      </label>
      <label className="flex items-center gap-2 text-sm text-lp-on-surface">
        <input type="checkbox" {...register('requirePhoto')} className="h-4 w-4" />
        Wajib foto saat clock-in
      </label>
      <label className="flex items-center gap-2 text-sm text-lp-on-surface">
        <input
          type="checkbox"
          {...register('receiptWhatsapp')}
          className="h-4 w-4"
        />
        Kirim struk via WhatsApp
      </label>

      {errorMessage && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
        >
          <Icon name="save" className="text-[18px]" />
          {pending ? 'Menyimpan…' : 'Simpan Operasional'}
        </button>
      </div>
    </form>
  );
}
