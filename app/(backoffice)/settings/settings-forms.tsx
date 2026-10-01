'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { setOutletTargets, updateOutletProfile } from '@/lib/api';
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

const DAY_KEYS = [
  ['mon', 'Senin'],
  ['tue', 'Selasa'],
  ['wed', 'Rabu'],
  ['thu', 'Kamis'],
  ['fri', 'Jumat'],
  ['sat', 'Sabtu'],
  ['sun', 'Minggu'],
] as const;

type DayInterval = { open: string; close: string };

/** Per-day opening hours → `{ mon: [["08:00","22:00"]], … }` (empty array = closed). */
export function OperatingHoursForm({ outlet }: { outlet: OutletDetail }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const raw = (outlet.operatingHours ?? {}) as Record<string, unknown>;
  const [days, setDays] = useState<Record<string, DayInterval>>(() => {
    const out: Record<string, DayInterval> = {};
    for (const [key] of DAY_KEYS) {
      const interval = Array.isArray(raw[key]) ? (raw[key] as unknown[]) : [];
      const first = Array.isArray(interval[0]) ? (interval[0] as unknown[]) : [];
      out[key] = {
        open: typeof first[0] === 'string' ? (first[0] as string) : '08:00',
        close: typeof first[1] === 'string' ? (first[1] as string) : '22:00',
      };
    }
    return out;
  });
  const [closed, setClosed] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const [key] of DAY_KEYS) {
      out[key] = !(Array.isArray(raw[key]) && (raw[key] as unknown[]).length > 0);
    }
    return out;
  });

  const saveM = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {};
      for (const [key] of DAY_KEYS) {
        payload[key] = closed[key] ? [] : [[days[key].open, days[key].close]];
      }
      return updateOutletProfile(outlet.id, { operatingHours: payload });
    },
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ['outlet', outlet.id] });
    },
    onError: (err) =>
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan jam operasional.',
      ),
  });

  return (
    <div className="flex flex-col gap-2">
      {DAY_KEYS.map(([key, label]) => (
        <div key={key} className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex w-28 items-center gap-2 text-lp-on-surface">
            <input
              type="checkbox"
              checked={!closed[key]}
              onChange={(event) =>
                setClosed((prev) => ({ ...prev, [key]: !event.target.checked }))
              }
              className="h-4 w-4"
            />
            {label}
          </label>
          {closed[key] ? (
            <span className="text-xs text-lp-tertiary">Tutup</span>
          ) : (
            <>
              <input
                type="time"
                value={days[key].open}
                onChange={(event) =>
                  setDays((prev) => ({
                    ...prev,
                    [key]: { ...prev[key], open: event.target.value },
                  }))
                }
                aria-label={`Jam buka ${label}`}
                className={`${inputCls} w-32`}
              />
              <span className="text-lp-tertiary">–</span>
              <input
                type="time"
                value={days[key].close}
                onChange={(event) =>
                  setDays((prev) => ({
                    ...prev,
                    [key]: { ...prev[key], close: event.target.value },
                  }))
                }
                aria-label={`Jam tutup ${label}`}
                className={`${inputCls} w-32`}
              />
            </>
          )}
        </div>
      ))}

      {error && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-xs font-medium text-lp-primary">
          Jam operasional tersimpan.
        </p>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="button"
          disabled={saveM.isPending}
          onClick={() => saveM.mutate()}
          className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
        >
          <Icon name="save" className="text-[18px]" />
          {saveM.isPending ? 'Menyimpan…' : 'Simpan Jam Operasional'}
        </button>
      </div>
    </div>
  );
}

export function FoodCostTargetForm({
  outletId,
  current,
}: {
  outletId: string;
  current: number;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(current));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const saveM = useMutation({
    mutationFn: (pct: number) => setOutletTargets(outletId, { foodCostPct: pct }),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ['outlet', outletId] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan target.'),
  });

  const pct = Number(value);
  const valid = Number.isFinite(pct) && pct >= 1 && pct <= 100;

  return (
    <div className="mt-4 border-t border-lp-surface-container pt-4">
      <h3 className="mb-1 text-sm font-semibold text-lp-on-surface">
        Target Food Cost (HPP)
      </h3>
      <p className="mb-3 text-xs text-lp-on-surface-variant">
        Dipakai laporan &amp; margin: idealnya HPP ÷ harga jual di bawah persentase
        ini.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="food-cost-target" className={labelCls}>
            Target (%)
          </label>
          <input
            id="food-cost-target"
            type="number"
            min={1}
            max={100}
            step={1}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setSaved(false);
            }}
            aria-invalid={!valid}
            className={`${inputCls} w-28`}
          />
        </div>
        <button
          type="button"
          disabled={saveM.isPending || !valid}
          onClick={() => saveM.mutate(pct)}
          className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
        >
          <Icon name="save" className="text-[18px]" />
          {saveM.isPending ? 'Menyimpan…' : 'Simpan Target'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-2 text-xs font-medium text-lp-primary">Target tersimpan.</p>
      )}
    </div>
  );
}

export const deliverySchema = z.object({
  enabled: z.boolean(),
  flatFee: z
    .number({ error: 'Biaya dasar wajib diisi.' })
    .min(0, 'Tidak boleh negatif.'),
  perKmFee: z
    .number({ error: 'Biaya per km wajib diisi.' })
    .min(0, 'Tidak boleh negatif.'),
  freeRadiusKm: z
    .number({ error: 'Radius gratis wajib diisi.' })
    .min(0, 'Tidak boleh negatif.'),
  maxRadiusKm: z
    .number({ error: 'Radius maksimal wajib diisi.' })
    .min(0, 'Tidak boleh negatif.'),
});

export type DeliveryValues = z.infer<typeof deliverySchema>;

export function toDeliveryPatch(values: DeliveryValues): Partial<OutletSettings> {
  return {
    delivery: {
      enabled: values.enabled,
      flatFee: values.flatFee,
      perKmFee: values.perKmFee,
      freeRadiusKm: values.freeRadiusKm,
      maxRadiusKm: values.maxRadiusKm,
    },
  };
}

export function DeliveryForm({
  settings,
  pending,
  errorMessage,
  onSubmit,
}: {
  settings: OutletSettings;
  pending: boolean;
  errorMessage?: string | null;
  onSubmit: (values: DeliveryValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      enabled: settings.delivery.enabled,
      flatFee: settings.delivery.flatFee,
      perKmFee: settings.delivery.perKmFee,
      freeRadiusKm: settings.delivery.freeRadiusKm,
      maxRadiusKm: settings.delivery.maxRadiusKm,
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-1"
      onSubmit={handleSubmit((values) => onSubmit(values))}
    >
      <p className="mb-2 text-xs text-lp-on-surface-variant">
        Dipakai order delivery di storefront publik: ongkir dihitung server-side.
        Radius 0 = tanpa batas.
      </p>

      <label className="flex items-center gap-2 text-sm font-semibold text-lp-on-surface">
        <input type="checkbox" {...register('enabled')} className="h-4 w-4" />
        Aktifkan pengiriman (delivery)
      </label>

      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="d-flat" className={labelCls}>
            Biaya dasar (Rp)
          </label>
          <input
            id="d-flat"
            {...register('flatFee', { valueAsNumber: true })}
            type="number"
            min={0}
            step={1000}
            aria-invalid={!!errors.flatFee}
            className={inputCls}
          />
          <FieldError message={errors.flatFee?.message} />
        </div>
        <div>
          <label htmlFor="d-perkm" className={labelCls}>
            Biaya per km (Rp)
          </label>
          <input
            id="d-perkm"
            {...register('perKmFee', { valueAsNumber: true })}
            type="number"
            min={0}
            step={500}
            aria-invalid={!!errors.perKmFee}
            className={inputCls}
          />
          <FieldError message={errors.perKmFee?.message} />
        </div>
        <div>
          <label htmlFor="d-free" className={labelCls}>
            Radius gratis (km)
          </label>
          <input
            id="d-free"
            {...register('freeRadiusKm', { valueAsNumber: true })}
            type="number"
            min={0}
            step={0.5}
            aria-invalid={!!errors.freeRadiusKm}
            className={inputCls}
          />
          <FieldError message={errors.freeRadiusKm?.message} />
        </div>
        <div>
          <label htmlFor="d-max" className={labelCls}>
            Radius maksimal (km)
          </label>
          <input
            id="d-max"
            {...register('maxRadiusKm', { valueAsNumber: true })}
            type="number"
            min={0}
            step={0.5}
            aria-invalid={!!errors.maxRadiusKm}
            className={inputCls}
          />
          <FieldError message={errors.maxRadiusKm?.message} />
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
          {pending ? 'Menyimpan…' : 'Simpan Pengiriman'}
        </button>
      </div>
    </form>
  );
}

const nonNeg = (label: string) =>
  z.number({ error: `${label} wajib diisi.` }).min(0, 'Tidak boleh negatif.');

export const loyaltySchema = z.object({
  pointsPerRp: z
    .number({ error: 'Rupiah per poin wajib diisi.' })
    .int('Gunakan angka bulat.')
    .min(0, 'Tidak boleh negatif.'),
  redeemRate: nonNeg('Nilai tukar poin'),
  pointsMultiplier: z
    .number({ error: 'Multiplier wajib diisi.' })
    .min(1, 'Minimal 1.'),
  referralBonusPoints: z
    .number({ error: 'Bonus referral wajib diisi.' })
    .int('Gunakan angka bulat.')
    .min(0, 'Tidak boleh negatif.'),
  stampThreshold: z
    .number({ error: 'Target stamp wajib diisi.' })
    .int('Gunakan angka bulat.')
    .min(0, 'Tidak boleh negatif.'),
  stampMode: z.enum(['order', 'item']),
  pointsExpireDays: z
    .number({ error: 'Masa berlaku poin wajib diisi.' })
    .int('Gunakan angka bulat.')
    .min(0, 'Tidak boleh negatif.'),
  silverMinSpend: nonNeg('Ambang Silver'),
  goldMinSpend: nonNeg('Ambang Gold'),
  platinumMinSpend: nonNeg('Ambang Platinum'),
});

export type LoyaltyValues = z.infer<typeof loyaltySchema>;

export function toLoyaltyPatch(values: LoyaltyValues): Record<string, unknown> {
  return {
    loyalty: {
      pointsPerRp: values.pointsPerRp,
      redeemRate: values.redeemRate,
      pointsMultiplier: values.pointsMultiplier,
      referralBonusPoints: values.referralBonusPoints,
      stampThreshold: values.stampThreshold,
      stampMode: values.stampMode,
      pointsExpireDays: values.pointsExpireDays,
      tiers: {
        silverMinSpend: values.silverMinSpend,
        goldMinSpend: values.goldMinSpend,
        platinumMinSpend: values.platinumMinSpend,
      },
    },
  };
}

export function LoyaltyForm({
  settings,
  pending,
  errorMessage,
  onSubmit,
}: {
  settings: OutletSettings;
  pending: boolean;
  errorMessage?: string | null;
  onSubmit: (values: LoyaltyValues) => void;
}) {
  const l = settings.loyalty;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoyaltyValues>({
    resolver: zodResolver(loyaltySchema),
    defaultValues: {
      pointsPerRp: l.pointsPerRp,
      redeemRate: l.redeemRate,
      pointsMultiplier: l.pointsMultiplier,
      referralBonusPoints: l.referralBonusPoints,
      stampThreshold: l.stampThreshold,
      stampMode: l.stampMode === 'item' ? 'item' : 'order',
      pointsExpireDays: l.pointsExpireDays,
      silverMinSpend: l.tiers.silverMinSpend,
      goldMinSpend: l.tiers.goldMinSpend,
      platinumMinSpend: l.tiers.platinumMinSpend,
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-1"
      onSubmit={handleSubmit((values) => onSubmit(values))}
    >
      <p className="mb-2 text-xs text-lp-on-surface-variant">
        Poin didapat = ⌊belanja ÷ Rupiah per poin⌋. Isi 0 untuk menonaktifkan poin.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="l-ppr" className={labelCls}>
            Rupiah per 1 poin (0 = nonaktif)
          </label>
          <input
            id="l-ppr"
            {...register('pointsPerRp', { valueAsNumber: true })}
            type="number"
            min={0}
            step={1000}
            aria-invalid={!!errors.pointsPerRp}
            className={inputCls}
          />
          <FieldError message={errors.pointsPerRp?.message} />
        </div>
        <div>
          <label htmlFor="l-redeem" className={labelCls}>
            Nilai tukar (Rp per poin)
          </label>
          <input
            id="l-redeem"
            {...register('redeemRate', { valueAsNumber: true })}
            type="number"
            min={0}
            step={100}
            aria-invalid={!!errors.redeemRate}
            className={inputCls}
          />
          <FieldError message={errors.redeemRate?.message} />
        </div>
        <div>
          <label htmlFor="l-mult" className={labelCls}>
            Multiplier bonus (mis. 2 saat event)
          </label>
          <input
            id="l-mult"
            {...register('pointsMultiplier', { valueAsNumber: true })}
            type="number"
            min={1}
            step={0.5}
            aria-invalid={!!errors.pointsMultiplier}
            className={inputCls}
          />
          <FieldError message={errors.pointsMultiplier?.message} />
        </div>
        <div>
          <label htmlFor="l-ref" className={labelCls}>
            Bonus poin referral (0 = off)
          </label>
          <input
            id="l-ref"
            {...register('referralBonusPoints', { valueAsNumber: true })}
            type="number"
            min={0}
            step={10}
            aria-invalid={!!errors.referralBonusPoints}
            className={inputCls}
          />
          <FieldError message={errors.referralBonusPoints?.message} />
        </div>
        <div>
          <label htmlFor="l-stamp" className={labelCls}>
            Stamp untuk 1 reward (0 = off)
          </label>
          <input
            id="l-stamp"
            {...register('stampThreshold', { valueAsNumber: true })}
            type="number"
            min={0}
            step={1}
            aria-invalid={!!errors.stampThreshold}
            className={inputCls}
          />
          <FieldError message={errors.stampThreshold?.message} />
        </div>
        <div>
          <label htmlFor="l-stampmode" className={labelCls}>
            Mode stamp
          </label>
          <select
            id="l-stampmode"
            {...register('stampMode')}
            className={inputCls}
          >
            <option value="order">Per order</option>
            <option value="item">Per item produk</option>
          </select>
          <FieldError message={errors.stampMode?.message} />
        </div>
        <div>
          <label htmlFor="l-exp" className={labelCls}>
            Masa berlaku poin (hari, 0 = selamanya)
          </label>
          <input
            id="l-exp"
            {...register('pointsExpireDays', { valueAsNumber: true })}
            type="number"
            min={0}
            step={30}
            aria-invalid={!!errors.pointsExpireDays}
            className={inputCls}
          />
          <FieldError message={errors.pointsExpireDays?.message} />
        </div>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-lp-on-surface">
        Ambang Tier (belanja 90 hari)
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="l-silver" className={labelCls}>
            Silver (Rp)
          </label>
          <input
            id="l-silver"
            {...register('silverMinSpend', { valueAsNumber: true })}
            type="number"
            min={0}
            step={100000}
            aria-invalid={!!errors.silverMinSpend}
            className={inputCls}
          />
          <FieldError message={errors.silverMinSpend?.message} />
        </div>
        <div>
          <label htmlFor="l-gold" className={labelCls}>
            Gold (Rp)
          </label>
          <input
            id="l-gold"
            {...register('goldMinSpend', { valueAsNumber: true })}
            type="number"
            min={0}
            step={100000}
            aria-invalid={!!errors.goldMinSpend}
            className={inputCls}
          />
          <FieldError message={errors.goldMinSpend?.message} />
        </div>
        <div>
          <label htmlFor="l-plat" className={labelCls}>
            Platinum (Rp)
          </label>
          <input
            id="l-plat"
            {...register('platinumMinSpend', { valueAsNumber: true })}
            type="number"
            min={0}
            step={100000}
            aria-invalid={!!errors.platinumMinSpend}
            className={inputCls}
          />
          <FieldError message={errors.platinumMinSpend?.message} />
        </div>
      </div>

      <p className="mt-1 text-[11px] text-lp-tertiary">
        Produk khusus stamp (mode &quot;per item&quot;) dikelola terpisah dan
        dipertahankan.
      </p>

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
          {pending ? 'Menyimpan…' : 'Simpan Loyalty'}
        </button>
      </div>
    </form>
  );
}
