'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Icon } from '@/components/icon';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { TextField } from './fields';
import type { RegisterValues } from './types';

function strengthScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;
  return score;
}

const STRENGTH_LABEL = ['Lemah', 'Cukup', 'Kuat', 'Sangat Kuat', 'Sangat Kuat'];

function VisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={visible ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
      onClick={onToggle}
      className="flex items-center text-slate-400 hover:text-slate-600"
    >
      <Icon name={visible ? 'visibility_off' : 'visibility'} className="text-lg" />
    </button>
  );
}

export function StepAccount({ onNext }: { onNext: () => void }) {
  const { control, watch } = useFormContext<RegisterValues>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const password = watch('password') ?? '';
  const score = strengthScore(password);
  const hasMinLength = password.length >= 8;
  const hasLetterNumber = /[A-Za-z]/.test(password) && /[0-9]/.test(password);

  return (
    <div className="space-y-4">
      <TextField
        name="ownerName"
        label="Nama Lengkap Pemilik / Pengelola"
        required
        icon="person"
        placeholder="Contoh: Dimas Pratama"
        autoComplete="name"
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <TextField
          name="email"
          label="Email Bisnis"
          required
          hint="Untuk login backoffice & invoice."
          icon="mail"
          type="email"
          placeholder="dimas@kopitumbuh.id"
          autoComplete="email"
        />
        <TextField
          name="phone"
          label="Nomor WhatsApp"
          required
          hint="Untuk verifikasi OTP & laporan closing."
          icon="phone_iphone"
          type="tel"
          placeholder="+62 812-xxxx-xxxx"
          autoComplete="tel"
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 pt-1 sm:grid-cols-2">
        <TextField
          name="password"
          label="Kata Sandi"
          required
          icon="lock"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min. 8 karakter"
          autoComplete="new-password"
          suffix={
            <VisibilityToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          }
        />
        <TextField
          name="confirmPassword"
          label="Konfirmasi Sandi"
          required
          icon="lock_reset"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Ulangi kata sandi"
          autoComplete="new-password"
          suffix={
            <VisibilityToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
          }
        />
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600">Kekuatan Kata Sandi:</span>
          <span
            className={`flex items-center gap-1 font-bold ${score >= 2 ? 'text-emerald-700' : 'text-slate-500'}`}
          >
            <Icon name="verified_user" className="text-sm" />
            {password ? STRENGTH_LABEL[score] : 'Belum diisi'}
          </span>
        </div>
        <div className="mb-2 grid h-1.5 grid-cols-4 gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`rounded-full ${i < score ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
          <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700' : ''}`}>
            <Icon name="check" className="text-xs" /> Min. 8 karakter
          </div>
          <div className={`flex items-center gap-1 ${hasLetterNumber ? 'text-emerald-700' : ''}`}>
            <Icon name="check" className="text-xs" /> Huruf &amp; angka
          </div>
        </div>
      </div>

      <FormField
        control={control}
        name="agreed"
        render={({ field, fieldState }) => (
          <FormItem>
            <div
              className={`rounded-xl border p-3.5 transition ${
                fieldState.error
                  ? 'border-rose-300 bg-rose-50/60'
                  : field.value
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Setuju Syarat dan Ketentuan serta Kebijakan Privasi"
                    className="mt-0.5 h-5 w-5 rounded-md border-slate-300 bg-white data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-xs leading-relaxed font-normal text-slate-600">
                  <span>
            Saya menyetujui{' '}
            <Link href="/terms" className="font-semibold text-emerald-700 underline hover:text-emerald-800">
              Syarat &amp; Ketentuan
            </Link>{' '}
            serta{' '}
            <Link href="/privacy" className="font-semibold text-emerald-700 underline hover:text-emerald-800">
              Kebijakan Privasi
            </Link>{' '}
            Tumbuh POS.
                  </span>
                </FormLabel>
              </div>
              <div className="min-h-4 pl-8">
                <FormMessage className="mt-1 text-xs font-medium text-rose-600" />
              </div>
            </div>
          </FormItem>
        )}
      />

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
        <span className="text-xs text-slate-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-bold text-emerald-700 hover:underline">
            Masuk
          </Link>
        </span>
        <button
          type="button"
          onClick={onNext}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:bg-emerald-800 sm:w-auto sm:text-sm"
        >
          <span>Lanjut ke Langkah 2: Profil Usaha</span>
          <Icon name="arrow_forward" className="text-base transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
