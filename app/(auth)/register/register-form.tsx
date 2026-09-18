'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '@/components/icon';
import { plusJakarta } from '@/lib/fonts';
import { registerMerchant, type RegisterMerchantResult } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { StepAccount } from './step-account';
import { StepBusiness } from './step-business';
import {
  REGISTER_DEFAULTS,
  STEP1_FIELDS,
  registerSchema,
  type RegisterValues,
} from './types';

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9-4.97 0-9 4.03-9 9 0 4.02 2.65 7.42 6.3 8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 14c2.5-3 5-4 5-4s-1 4-3.5 5.5c-1.5.9-3 1.5-4.5 1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 14V7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-left">
        <span className="text-2xl font-extrabold leading-none tracking-tight text-slate-900">
          Tumbuh<span className="text-emerald-600">POS</span>
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Sistem Kasir &amp; Operasional F&amp;B
        </p>
      </div>
    </div>
  );
}

function StepBadge({ done, active, children }: { done?: boolean; active?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
        active
          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-4 ring-emerald-100'
          : done
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
            : 'border-2 border-slate-300 bg-slate-100 text-slate-600'
      }`}
    >
      {children}
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const setTenantSlug = useAuthStore((s) => s.setTenantSlug);

  const methods = useForm<RegisterValues>({
    mode: 'onTouched',
    resolver: zodResolver(registerSchema),
    defaultValues: REGISTER_DEFAULTS,
  });
  const {
    trigger,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = methods;

  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [step1Done, setStep1Done] = useState(false);
  const [result, setResult] = useState<RegisterMerchantResult | null>(null);
  // One key per form session: network retries replay the stored tenant
  // instead of provisioning a duplicate.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function goToStep(step: 1 | 2) {
    // Step-1 fields are unreachable while hidden, so returning to step 1
    // to edit always lapses the "Tersimpan" mark.
    if (step === 1) setStep1Done(false);
    if (step === 2) {
      const valid = await trigger(STEP1_FIELDS, { shouldFocus: true });
      if (!valid) {
        setActiveStep(1);
        scrollTop();
        return;
      }
      setStep1Done(true);
    }
    setActiveStep(step);
    scrollTop();
  }

  async function proceedToStep2() {
    const valid = await trigger(STEP1_FIELDS, { shouldFocus: true });
    if (!valid) return;
    setStep1Done(true);
    setActiveStep(2);
    scrollTop();
  }

  const completeOnboarding = handleSubmit(async (values) => {
    try {
      const res = await registerMerchant(
        {
          businessName: values.brandName.trim(),
          ownerName: values.ownerName.trim(),
          email: values.email.trim(),
          password: values.password,
          ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
          businessType: values.businessType,
          ...(values.outletName.trim() ? { outletName: values.outletName.trim() } : {}),
          ...(values.city.trim() ? { city: values.city.trim() } : {}),
          ...(values.address.trim() ? { address: values.address.trim() } : {}),
          modulePos: values.modulePos,
          moduleInventory: values.moduleInventory,
          moduleShifts: values.moduleShifts,
        },
        { idempotencyKey },
      );
      setResult(res);
      scrollTop();
    } catch (e) {
      setError('root.server', {
        message: e instanceof Error ? e.message : 'Pendaftaran gagal.',
      });
    }
  });

  function goToLogin() {
    if (result) setTenantSlug(result.slug);
    router.replace('/login');
  }

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-lp-background px-4 py-8 font-lp-sans text-slate-800 antialiased scheme-light sm:px-6 lg:px-8 ${plusJakarta.variable}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 right-10 h-96 w-96 rounded-full bg-lp-primary/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-64 h-80 w-80 rounded-full bg-lp-secondary-container/15 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
        <header className="mb-7 flex flex-col items-center text-center">
          <Link href="/" aria-label="Kembali ke beranda" className="mb-3 rounded-xl transition hover:opacity-90">
            <BrandLogo />
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            14 Hari Uji Coba Gratis
          </div>
        </header>

        {result ? (
          <main className="w-full">
            <section className="relative overflow-hidden rounded-3xl border-2 border-emerald-600 bg-white p-6 text-center shadow-xl sm:p-10">
              <div className="absolute left-0 right-0 top-0 h-1.5 bg-emerald-600" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon name="check_circle" className="text-4xl" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Pendaftaran Berhasil
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Workspace <span className="font-mono font-bold text-emerald-700">{result.slug}</span>{' '}
                aktif dengan paket {result.plan} (trial sampai{' '}
                {new Date(result.trialEndsAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                ). Outlet pertama <span className="font-mono font-bold text-emerald-700">{result.outlet.name}</span> siap
                dipakai.
              </p>
              <div className="mx-auto mt-5 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-600">
                <p className="truncate">
                  <span className="font-semibold text-slate-800">Owner:</span> {result.ownerEmail}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-slate-800">Workspace:</span>{' '}
                  <span className="font-mono">{result.slug}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={goToLogin}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
              >
                <span>Masuk ke Backoffice</span>
                <Icon name="arrow_forward" className="text-base" />
              </button>
            </section>
          </main>
        ) : (
          <FormProvider {...methods}>
            <form onSubmit={completeOnboarding} noValidate className="w-full">
              <div className="mb-6 w-full">
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="group flex items-center gap-3 text-left focus:outline-none"
                    aria-current={activeStep === 1 ? 'step' : undefined}
                  >
                    <StepBadge done={step1Done} active={activeStep === 1}>
                      {step1Done ? <Icon name="check" className="text-lg" /> : '1'}
                    </StepBadge>
                    <span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                          Langkah 1
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                            step1Done || activeStep === 1
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 font-medium text-slate-500'
                          }`}
                        >
                          {step1Done ? 'Tersimpan' : activeStep === 1 ? 'Aktif' : 'Menunggu'}
                        </span>
                      </span>
                      <span className="block text-xs font-bold text-slate-900 transition group-hover:text-emerald-700 sm:text-sm">
                        Akun Pengelola
                      </span>
                    </span>
                  </button>
                  <div className="h-1 w-10 flex-none overflow-hidden rounded-full bg-slate-200 sm:w-24" aria-hidden="true">
                    <div
                      className={`h-full transition-all duration-300 ${activeStep === 2 ? 'w-full bg-emerald-600' : 'w-1/3 bg-slate-300'}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="group flex items-center gap-3 text-left focus:outline-none"
                    aria-current={activeStep === 2 ? 'step' : undefined}
                  >
                    <StepBadge active={activeStep === 2}>2</StepBadge>
                    <span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                          Langkah 2
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                            activeStep === 2
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 font-medium text-slate-500'
                          }`}
                        >
                          {activeStep === 2 ? 'Aktif' : 'Menunggu'}
                        </span>
                      </span>
                      <span className="block text-xs font-bold text-slate-900 transition group-hover:text-emerald-700 sm:text-sm">
                        Profil Usaha &amp; Outlet
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <main className="w-full">
                {activeStep === 1 ? (
                  <section aria-label="Langkah 1: Akun Pengelola" className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
                    <div className="absolute left-0 right-0 top-0 h-1.5 bg-emerald-600" />
                    <div>
                      <div className="mb-6 flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
                        <div>
                          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            LANGKAH 1 DARI 2
                          </div>
                          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Buat Akun Pengelola
                          </h2>
                          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            Akses Super Admin untuk kelola multi-outlet &amp; laporan finansial.
                          </p>
                        </div>
                      </div>
                      <StepAccount onNext={proceedToStep2} />
                    </div>
                  </section>
                ) : (
                  <section aria-label="Langkah 2: Profil Usaha dan Outlet" className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-emerald-600 bg-white p-6 shadow-xl shadow-emerald-900/5 sm:p-8">
                    <div className="absolute left-0 right-0 top-0 h-1.5 bg-emerald-600" />
                    <div>
                      <div className="mb-6 flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
                        <div>
                          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                            LANGKAH 2 DARI 2
                          </div>
                          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Atur Profil Usaha F&amp;B
                          </h2>
                          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            Konfigurasi struk kasir, jenis menu, dan outlet pertama Anda.
                          </p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          Outlet Siap Pakai
                        </span>
                      </div>
                      <StepBusiness onBack={() => goToStep(1)} submitting={isSubmitting} />
                      {errors.root?.server && (
                        <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                          {errors.root.server.message}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Icon name="receipt_long" className="text-sm text-emerald-600" /> Template
                        struk kasir terpasang otomatis
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        100% Bebas Biaya Setup
                      </span>
                    </div>
                  </section>
                )}
              </main>
            </form>
          </FormProvider>
        )}

        <footer className="mt-8 max-w-md pb-6 text-center text-xs leading-relaxed text-slate-500">
          Butuh bantuan saat onboarding? Hubungi Spesialis Onboarding F&amp;B kami via{' '}
          <a
            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
            href="https://wa.me/62811886284"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>WhatsApp 0811-TUMBUH</span>
            <Icon name="open_in_new" className="text-xs" />
          </a>
          <span className="mt-3 block">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-bold text-emerald-700 hover:underline">
              Masuk ke Backoffice
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
