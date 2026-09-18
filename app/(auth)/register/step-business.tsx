'use client';

import { useFormContext } from 'react-hook-form';
import { Icon } from '@/components/icon';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { SelectField, SelectOption, TextAreaField, TextField } from './fields';
import { CITIES, type BusinessType, type RegisterValues } from './types';

type Props = {
  onBack: () => void;
  submitting: boolean;
};

const BUSINESS_TYPES: Array<{
  value: BusinessType;
  icon: string;
  title: string;
  desc: string;
}> = [
  { value: 'cafe', icon: 'local_cafe', title: 'Coffee Shop & Kafe', desc: 'Dine-in, takeaway, modifier varian kopi' },
  { value: 'restaurant', icon: 'restaurant', title: 'Restoran & Eatery', desc: 'Split bill meja & waiter order tablet' },
  { value: 'qsr', icon: 'fastfood', title: 'Warung & Fast Casual', desc: 'Antrean cepat & QRIS kilat langsung' },
  { value: 'bakery', icon: 'bakery_dining', title: 'Bakery & Pastry', desc: 'Pre-order pesanan & etalase kue' },
];

const MODULES = [
  { key: 'modulePos', title: 'Kasir POS Meja', desc: 'Katalog menu' },
  { key: 'moduleInventory', title: 'Inventori & HPP', desc: 'Stok otomatis' },
  { key: 'moduleShifts', title: 'Multi-Kasir Shift', desc: 'Laporan closing' },
] as const;

export function StepBusiness({ onBack, submitting }: Props) {
  const { control, register, watch } = useFormContext<RegisterValues>();
  const [ownerName, email, phone] = watch(['ownerName', 'email', 'phone']);

  return (
    <div className="space-y-4">
      <TextField
        name="brandName"
        label="Nama Brand / Usaha Kuliner"
        required
        aside={<span className="text-[10px] font-medium text-slate-400">Dicetak di struk kasir</span>}
        icon="storefront"
        placeholder="Contoh: Kala Senja Coffee & Bakery"
        autoComplete="organization"
      />

      <div>
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700" id="biz-type-label">
          Pilih Jenis Usaha F&amp;B <span className="text-rose-500">*</span>
        </span>
        <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-labelledby="biz-type-label">
          {BUSINESS_TYPES.map((option) => (
            <label
              key={option.value}
              className="relative flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:border-slate-300 hover:bg-slate-50 has-checked:border-2 has-checked:border-emerald-600 has-checked:bg-emerald-50/70"
            >
              <div className="flex items-start justify-between">
                <Icon name={option.icon} className="text-[22px] text-slate-500" />
                <input
                  type="radio"
                  value={option.value}
                  {...register('businessType')}
                  className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <div className="mt-2">
                <p className="text-xs font-bold text-slate-800">{option.title}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <TextField
          name="outletName"
          label="Nama Outlet Pertama"
          required
          placeholder="Contoh: Outlet Utama - Senopati"
        />
        <SelectField name="city" label="Kota / Kabupaten" required>
          {CITIES.map((city) => (
            <SelectOption key={city} value={city}>
              {city}
            </SelectOption>
          ))}
        </SelectField>
      </div>

      <TextAreaField
        name="address"
        label="Alamat Lengkap Outlet Pertama"
        required
        rows={2}
        placeholder="Jl. Senopati No. 42, Kebayoran Baru..."
      />

      <div>
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
          Pilihan Modul Awal (Dapat diubah sewaktu-waktu)
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {MODULES.map((mod) => (
            <FormField
              key={mod.key}
              control={control}
              name={mod.key}
              render={({ field }) => (
                <FormItem>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition hover:border-emerald-300">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <span className="text-left">
                      <span className="block text-xs font-bold leading-tight text-slate-900">
                        {mod.title}
                      </span>
                      <span className="block text-[10px] text-slate-500">{mod.desc}</span>
                    </span>
                  </label>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
            <Icon name="check" className="text-sm" />
          </div>
          <div className="truncate text-left">
            <p className="truncate text-xs font-bold text-slate-900">{ownerName || '—'}</p>
            <p className="truncate text-[10px] text-slate-500">
              {email || '—'} • {phone || '—'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          <span>Ubah</span>
          <Icon name="edit" className="text-xs" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:text-sm"
        >
          <Icon name="arrow_back" className="text-base" />
          <span>Kembali ke Langkah 1</span>
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          <span>{submitting ? 'Mendaftarkan…' : 'Selesai & Masuk ke Dashboard (Aktifkan Gratis)'}</span>
          <Icon name="check_circle" className="text-base" />
        </button>
      </div>
    </div>
  );
}
