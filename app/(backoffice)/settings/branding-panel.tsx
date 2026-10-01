'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import {
  getTenantBranding,
  updateTenantBranding,
  type TenantBranding,
} from '@/lib/api';

const labelCls =
  'mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary';
const inputCls =
  'w-full rounded-lg border border-lp-outline-variant bg-lp-surface-container-lowest px-3 py-2.5 text-sm font-medium text-lp-on-surface outline-none transition focus:border-lp-primary';

/** White-label storefront branding for the current tenant. */
export function BrandingPanel() {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ['tenant', 'branding'],
    queryFn: getTenantBranding,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<TenantBranding | null>(null);

  const branding = q.data?.branding ?? {};
  const values: TenantBranding = draft ?? {
    logoUrl: branding.logoUrl ?? '',
    primaryColor: branding.primaryColor ?? '',
    tagline: branding.tagline ?? '',
    customDomain: branding.customDomain ?? '',
  };

  const saveM = useMutation({
    mutationFn: (payload: TenantBranding) => updateTenantBranding(payload),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ['tenant', 'branding'] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan branding.'),
  });

  if (q.isPending) {
    return <p className="text-sm text-lp-on-surface-variant">Memuat…</p>;
  }
  if (q.isError) {
    return (
      <p className="text-sm text-lp-error">
        {q.error instanceof Error ? q.error.message : 'Gagal memuat branding.'}
      </p>
    );
  }

  const color = values.primaryColor?.trim() ?? '';
  const colorValid = color === '' || /^#[0-9a-fA-F]{6}$/.test(color);

  function set<K extends keyof TenantBranding>(key: K, value: string) {
    setDraft({ ...values, [key]: value });
    setSaved(false);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <form
        noValidate
        className="flex flex-col gap-1 lg:col-span-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!colorValid) {
            setError('Warna harus format hex #RRGGBB.');
            return;
          }
          saveM.mutate({
            logoUrl: values.logoUrl?.trim() || null,
            primaryColor: color || null,
            tagline: values.tagline?.trim() || null,
            customDomain: values.customDomain?.trim() || null,
          });
        }}
      >
        <p className="mb-2 text-xs text-lp-on-surface-variant">
          Dipakai di storefront publik. Kosongkan untuk menghapus.
        </p>

        <div>
          <label htmlFor="b-logo" className={labelCls}>
            URL Logo
          </label>
          <input
            id="b-logo"
            value={values.logoUrl ?? ''}
            onChange={(event) => set('logoUrl', event.target.value)}
            placeholder="https://…/logo.png"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="b-color" className={labelCls}>
              Warna utama (#RRGGBB)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="b-color"
                value={color}
                onChange={(event) => set('primaryColor', event.target.value)}
                placeholder="#059669"
                aria-invalid={!colorValid}
                className={`${inputCls} font-lp-mono`}
              />
              <input
                type="color"
                aria-label="Pilih warna utama"
                value={colorValid && color ? color : '#059669'}
                onChange={(event) => set('primaryColor', event.target.value)}
                className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-lp-outline-variant bg-lp-surface-container-lowest"
              />
            </div>
          </div>
          <div>
            <label htmlFor="b-domain" className={labelCls}>
              Custom domain
            </label>
            <input
              id="b-domain"
              value={values.customDomain ?? ''}
              onChange={(event) => set('customDomain', event.target.value)}
              placeholder="order.namakafe.com"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="b-tagline" className={labelCls}>
            Tagline
          </label>
          <input
            id="b-tagline"
            value={values.tagline ?? ''}
            onChange={(event) => set('tagline', event.target.value)}
            placeholder="Kopi enak, harga bersahabat"
            className={inputCls}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-lp-error">
            {error}
          </p>
        )}
        {saved && (
          <p className="text-xs font-medium text-lp-primary">Branding tersimpan.</p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saveM.isPending || !colorValid}
            className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
          >
            <Icon name="save" className="text-[18px]" />
            {saveM.isPending ? 'Menyimpan…' : 'Simpan Branding'}
          </button>
        </div>
      </form>

      <aside className="rounded-xl border border-lp-surface-container/70 bg-lp-surface-low p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
          Pratinjau
        </span>
        <div
          className="mt-2 flex flex-col gap-2 rounded-xl p-4 text-white shadow-sm"
          style={{ backgroundColor: colorValid && color ? color : '#059669' }}
        >
          {values.logoUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={values.logoUrl}
              alt="Logo storefront"
              className="h-8 w-8 rounded object-contain"
            />
          ) : (
            <Icon name="storefront" className="text-[28px]" />
          )}
          <span className="text-base font-bold">{q.data?.name}</span>
          <span className="text-xs opacity-90">
            {values.tagline?.trim() || 'Tagline toko Anda'}
          </span>
        </div>
      </aside>
    </div>
  );
}
