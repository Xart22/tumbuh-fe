'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import {
  getOutlet,
  updateOutletLocation,
  updateOutletProfile,
  updateOutletSettings,
} from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { AuditPanel } from './audit-panel';
import { BrandingPanel } from './branding-panel';
import { PrinterPanel } from './printer-panel';
import {
  DeliveryForm,
  FoodCostTargetForm,
  LoyaltyForm,
  OperatingHoursForm,
  OpsForm,
  OutletProfileForm,
  TaxForm,
  toDeliveryPatch,
  toLoyaltyPatch,
  toOpsPatch,
  toProfilePayload,
  toTaxPatch,
  type DeliveryValues,
  type LoyaltyValues,
  type OpsValues,
  type OutletProfileValues,
  type TaxValues,
} from './settings-forms';

type Tab =
  | 'outlet'
  | 'pajak'
  | 'operasional'
  | 'pengiriman'
  | 'loyalty'
  | 'storefront'
  | 'printer'
  | 'audit';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'outlet', label: 'Profil Outlet' },
  { id: 'pajak', label: 'Pajak & Biaya' },
  { id: 'operasional', label: 'Operasional' },
  { id: 'pengiriman', label: 'Pengiriman' },
  { id: 'loyalty', label: 'Loyalty' },
  { id: 'storefront', label: 'Storefront' },
  { id: 'printer', label: 'Printer' },
  { id: 'audit', label: 'Log Aktivitas' },
];

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-5 shadow-sm';

export function SettingsView() {
  const outletId = useAuthStore((s) => s.outletId);
  const [tab, setTab] = useState<Tab>('outlet');

  if (!outletId) {
    return (
      <p className="text-sm text-lp-on-surface-variant">
        Menyiapkan outlet…
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-lp-on-surface">
            Pengaturan Outlet
          </h1>
          <p className="text-sm text-lp-on-surface-variant">
            Profil, pajak, operasional, printer, dan log aktivitas.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Bagian pengaturan">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === item.id
                  ? 'bg-lp-primary text-lp-on-primary'
                  : 'text-lp-on-surface-variant hover:bg-lp-surface-low hover:text-lp-on-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'outlet' && <OutletTab outletId={outletId} />}
      {tab === 'pajak' && <SettingsTab outletId={outletId} kind="tax" />}
      {tab === 'operasional' && (
        <SettingsTab outletId={outletId} kind="ops" />
      )}
      {tab === 'pengiriman' && (
        <SettingsTab outletId={outletId} kind="delivery" />
      )}
      {tab === 'loyalty' && <SettingsTab outletId={outletId} kind="loyalty" />}
      {tab === 'storefront' && (
        <div className={PANEL}>
          <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
            Branding Storefront
          </h2>
          <BrandingPanel />
        </div>
      )}
      {tab === 'printer' && (
        <div className={PANEL}>
          <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
            Printer
          </h2>
          <PrinterPanel />
        </div>
      )}
      {tab === 'audit' && (
        <div className={PANEL}>
          <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
            Log Aktivitas
          </h2>
          <AuditPanel />
        </div>
      )}
    </section>
  );
}

function useOutlet(outletId: string) {
  return useQuery({
    queryKey: ['outlet', outletId],
    queryFn: () => getOutlet(outletId),
  });
}

function OutletTab({ outletId }: { outletId: string }) {
  const queryClient = useQueryClient();
  const q = useOutlet(outletId);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locError, setLocError] = useState<string | null>(null);

  const profileM = useMutation({
    mutationFn: (values: OutletProfileValues) =>
      updateOutletProfile(outletId, toProfilePayload(values)),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ['outlet', outletId] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil.'),
  });

  const locationM = useMutation({
    mutationFn: (payload: { lat: number | null; lng: number | null }) =>
      updateOutletLocation(outletId, payload),
    onSuccess: () => {
      setLocError(null);
      void queryClient.invalidateQueries({ queryKey: ['outlet', outletId] });
    },
    onError: (err) =>
      setLocError(err instanceof Error ? err.message : 'Gagal menyimpan lokasi.'),
  });

  if (q.isPending) {
    return <p className="text-sm text-lp-on-surface-variant">Memuat…</p>;
  }
  if (q.isError || !q.data?.id) {
    return (
      <p className="text-sm text-lp-error">
        {q.error instanceof Error ? q.error.message : 'Gagal memuat outlet.'}
      </p>
    );
  }

  const outlet = q.data;

  function saveLocation() {
    const hasLat = lat.trim() !== '';
    const hasLng = lng.trim() !== '';
    if (!hasLat && !hasLng) {
      locationM.mutate({ lat: null, lng: null });
      return;
    }
    if (hasLat && hasLng) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        setLocError('Koordinat harus berupa angka.');
        return;
      }
      locationM.mutate({ lat: latNum, lng: lngNum });
      return;
    }
    setLocError('Isi keduanya, atau kosongkan keduanya untuk menonaktifkan.');
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className={`${PANEL} lg:col-span-2`}>
        <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
          Profil Outlet
        </h2>
        <OutletProfileForm
          outlet={outlet}
          pending={profileM.isPending}
          errorMessage={error}
          onSubmit={(values) => profileM.mutate(values)}
        />
        {saved && (
          <p className="mt-2 text-xs font-medium text-lp-primary">
            Profil tersimpan.
          </p>
        )}
      </div>

      <div className={PANEL}>
        <h2 className="mb-1 text-base font-semibold text-lp-on-surface">
          Lokasi Geofence
        </h2>
        <p className="mb-3 text-xs text-lp-on-surface-variant">
          Dipakai untuk validasi absensi. Kosongkan keduanya untuk menonaktifkan.
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-lg bg-lp-surface-low px-3 py-2 text-xs">
            <span className="text-lp-on-surface-variant">Tersimpan</span>
            <span className="font-lp-mono text-lp-on-surface">
              {outlet.gps
                ? `${outlet.gps.lat}, ${outlet.gps.lng}`
                : 'Nonaktif'}
            </span>
          </div>
          <input
            value={lat}
            onChange={(event) => setLat(event.target.value)}
            placeholder="Latitude"
            aria-label="Latitude"
            className="h-10 rounded-lg border border-lp-outline-variant px-3 text-sm outline-none focus:border-lp-primary"
          />
          <input
            value={lng}
            onChange={(event) => setLng(event.target.value)}
            placeholder="Longitude"
            aria-label="Longitude"
            className="h-10 rounded-lg border border-lp-outline-variant px-3 text-sm outline-none focus:border-lp-primary"
          />
          {locError && (
            <p role="alert" className="text-xs font-medium text-lp-error">
              {locError}
            </p>
          )}
          <button
            type="button"
            disabled={locationM.isPending}
            onClick={saveLocation}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-lp-primary text-sm font-bold text-lp-on-primary disabled:opacity-60"
          >
            <Icon name="my_location" className="text-[18px]" />
            {locationM.isPending ? 'Menyimpan…' : 'Simpan Lokasi'}
          </button>
        </div>
      </div>
      </div>

      <div className={PANEL}>
        <h2 className="mb-1 text-base font-semibold text-lp-on-surface">
          Jam Operasional
        </h2>
        <p className="mb-3 text-xs text-lp-on-surface-variant">
          Jam buka outlet per hari (dipakai storefront &amp; status buka).
        </p>
        <OperatingHoursForm outlet={outlet} />
      </div>
    </>
  );
}

function SettingsTab({
  outletId,
  kind,
}: {
  outletId: string;
  kind: 'tax' | 'ops' | 'delivery' | 'loyalty';
}) {
  const queryClient = useQueryClient();
  const q = useOutlet(outletId);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const patchM = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      updateOutletSettings(outletId, patch),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ['outlet', outletId] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.'),
  });

  if (q.isPending) {
    return <p className="text-sm text-lp-on-surface-variant">Memuat…</p>;
  }
  if (q.isError || !q.data?.settings) {
    return (
      <p className="text-sm text-lp-error">
        {q.error instanceof Error ? q.error.message : 'Gagal memuat outlet.'}
      </p>
    );
  }

  const settings = q.data.settings;

  return (
    <div className={PANEL}>
      <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
        {kind === 'tax'
          ? 'Pajak & Biaya'
          : kind === 'delivery'
            ? 'Pengiriman'
            : kind === 'loyalty'
              ? 'Loyalty & CRM'
              : 'Operasional'}
      </h2>
      {kind === 'tax' ? (
        <>
          <TaxForm
            settings={settings}
            pending={patchM.isPending}
            errorMessage={error}
            onSubmit={(values: TaxValues) => patchM.mutate(toTaxPatch(values))}
          />
          <FoodCostTargetForm
            outletId={outletId}
            current={settings.targets.foodCostPct}
          />
        </>
      ) : kind === 'delivery' ? (
        <DeliveryForm
          settings={settings}
          pending={patchM.isPending}
          errorMessage={error}
          onSubmit={(values: DeliveryValues) => patchM.mutate(toDeliveryPatch(values))}
        />
      ) : kind === 'loyalty' ? (
        <LoyaltyForm
          settings={settings}
          pending={patchM.isPending}
          errorMessage={error}
          onSubmit={(values: LoyaltyValues) => patchM.mutate(toLoyaltyPatch(values))}
        />
      ) : (
        <OpsForm
          settings={settings}
          pending={patchM.isPending}
          errorMessage={error}
          onSubmit={(values: OpsValues) => patchM.mutate(toOpsPatch(values))}
        />
      )}
      {saved && (
        <p className="mt-2 text-xs font-medium text-lp-primary">
          Pengaturan tersimpan.
        </p>
      )}
    </div>
  );
}
