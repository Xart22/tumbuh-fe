'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatIDR } from '@/lib/format';
import { Icon } from '@/components/icon';
import { AlertDialog, ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, Button, Input, Spinner } from '@/components/pos-ui';
import {
  closeShift,
  currentShift,
  listEmployees,
  openShift,
} from '@/lib/api';
import type { CurrentShift, Employee, ShiftRecap } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';

type Denominations = {
  k100: number;
  k50: number;
  k20: number;
  k10: number;
  k5: number;
  k2: number;
  coins: number;
};

const EMPTY_DENOMINATIONS: Denominations = {
  k100: 0,
  k50: 0,
  k20: 0,
  k10: 0,
  k5: 0,
  k2: 0,
  coins: 0,
};

function calculateCountedCash(d: Denominations): number {
  return (
    d.k100 * 100000 +
    d.k50 * 50000 +
    d.k20 * 20000 +
    d.k10 * 10000 +
    d.k5 * 5000 +
    d.k2 * 2000 +
    d.coins
  );
}

function elapsedLabel(openedAt: string): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000),
  );
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} Jam ${m} Menit` : `${m} Menit`;
}

async function fetchShiftData(): Promise<{
  current: CurrentShift;
  employees: Employee[];
}> {
  const [current, emps] = await Promise.all([
    currentShift(),
    listEmployees().catch(() => [] as Employee[]),
  ]);
  return { current, employees: emps.filter((e) => e.isActive) };
}

export default function ShiftReconciliationPage() {
  const authUser = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<CurrentShift | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [openEmployeeId, setOpenEmployeeId] = useState('');
  const [openShiftName, setOpenShiftName] = useState('');
  const [openingCash, setOpeningCash] = useState('');
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const [denominations, setDenominations] =
    useState<Denominations>(EMPTY_DENOMINATIONS);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { current, employees: emps } = await fetchShiftData();
      setData(current);
      setEmployees(emps);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Gagal memuat data shift.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchShiftData()
      .then(({ current, employees: emps }) => {
        if (cancelled) return;
        setData(current);
        setEmployees(emps);
        setLoadError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Gagal memuat data shift.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shift = data && data.currentShift ? data.currentShift : null;
  const recap: ShiftRecap | null = data && data.currentShift ? data.recap : null;

  const effectiveEmployeeId =
    openEmployeeId ||
    (authUser && employees.some((e) => e.id === authUser.id) ? authUser.id : '');

  const countedCash = useMemo(
    () => calculateCountedCash(denominations),
    [denominations],
  );
  const expectedCash = recap?.expectedCash ?? 0;
  const hasCount = countedCash > 0;
  const variance = countedCash - expectedCash;

  function setDenomination(key: keyof Denominations, val: number) {
    setDenominations((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  }

  async function handleOpen() {
    setOpenError(null);
    if (!effectiveEmployeeId) {
      setOpenError('Pilih karyawan yang membuka shift.');
      return;
    }
    setOpening(true);
    try {
      await openShift({
        employeeId: effectiveEmployeeId,
        shiftName: openShiftName.trim() || undefined,
        openingCash: Number(openingCash.replace(/\D/g, '') || 0),
      });
      setOpenShiftName('');
      setOpeningCash('');
      await load();
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : 'Gagal membuka shift.');
    } finally {
      setOpening(false);
    }
  }

  async function doClose() {
    if (!shift) return;
    setClosing(true);
    setCloseError(null);
    try {
      const result = await closeShift(shift.id, countedCash);
      const diff = result.recap.difference;
      setNotice(
        diff === 0
          ? 'Shift ditutup. Kas fisik seimbang dengan sistem.'
          : `Shift ditutup. Selisih kas ${diff < 0 ? 'kurang' : 'lebih'} ${formatIDR(Math.abs(diff))}.`,
      );
      setDenominations(EMPTY_DENOMINATIONS);
      await load();
    } catch (err) {
      setCloseError(
        err instanceof Error ? err.message : 'Gagal menutup shift.',
      );
    } finally {
      setClosing(false);
    }
  }

  function handleClose() {
    if (!hasCount) return;
    if (variance !== 0) setConfirmCloseOpen(true);
    else void doClose();
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-lp-background p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-lp-outline-variant/25 bg-lp-surface-container-lowest p-4 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-lp-outline-variant/30 bg-lp-surface-low px-3 py-2 text-xs font-semibold text-lp-on-surface hover:bg-lp-surface-container transition-colors"
          >
            <Icon name="arrow_back" className="text-sm" />
            <span>Kembali ke Kasir [Esc]</span>
          </Link>
          <div className="h-4 w-px bg-lp-outline-variant/30 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-lp-on-surface">
                Sesi &amp; Rekonsiliasi Kas Shift
              </h1>
              {shift ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-lp-primary border border-emerald-200">
                  Sesi Aktif · {elapsedLabel(shift.openedAt)} berjalan
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                  Belum Ada Shift Aktif
                </span>
              )}
            </div>
            {shift && (
              <p className="text-xs text-lp-on-surface-variant mt-0.5">
                {shift.shiftName || 'Shift'} · Kasir:{' '}
                <span className="font-semibold text-lp-on-surface">
                  {shift.employeeName || '-'}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {loadError && <Alert kind="error">{loadError}</Alert>}

      {data?.stale && (
        <Alert kind="info">
          Shift ini dibuka pada hari sebelumnya dan belum ditutup. Tutup shift
          ini sebelum memulai transaksi hari ini.
        </Alert>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <Spinner label="Memuat data shift…" />
        </div>
      ) : !shift ? (
        /* ── No open shift: open form ─────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-4 sm:p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-lp-on-surface">Buka Shift Baru</h2>
              <p className="text-xs text-lp-on-surface-variant">
                Kasir harus membuka shift sebelum bisa melakukan transaksi.
              </p>
            </div>

            {openError && <Alert kind="error">{openError}</Alert>}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-lp-on-surface-variant">
                  Karyawan yang bertugas
                </label>
                <select
                  value={effectiveEmployeeId}
                  onChange={(e) => setOpenEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-lp-outline-variant/40 bg-lp-surface-container-lowest px-3 py-2.5 text-sm text-lp-on-surface outline-none focus:border-lp-primary focus:ring-1 focus:ring-lp-primary"
                >
                  <option value="">Pilih karyawan…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} · {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-lp-on-surface-variant">
                  Nama shift (opsional)
                </label>
                <Input
                  value={openShiftName}
                  onChange={(e) => setOpenShiftName(e.target.value)}
                  placeholder="Contoh: Shift Pagi"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-lp-on-surface-variant">
                  Modal awal kas di laci
                </label>
                <Input
                  inputMode="numeric"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="Contoh: 300000"
                  className="font-lp-mono"
                />
              </div>

              <Button
                className="w-full h-11 text-sm font-bold"
                onClick={() => void handleOpen()}
                disabled={opening}
              >
                <Icon name="lock_open" className="text-base" />
                <span>{opening ? 'Membuka shift…' : 'Buka Shift'}</span>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-low p-4 text-xs text-lp-on-surface-variant space-y-2">
              <div className="flex items-center gap-2 text-lp-on-surface font-bold">
                <Icon name="info" className="text-base text-lp-primary" />
                <span>Kenapa harus buka shift?</span>
              </div>
              <p>
                Setiap transaksi ditautkan ke shift aktif, sehingga laporan kas,
                selisih uang di laci, dan setoran bisa direkonsiliasi per shift.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Open shift: recap + reconciliation ───────────────────── */
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-3.5 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant">Omzet Shift</p>
              <p className="mt-1 text-xl font-extrabold font-lp-mono text-lp-primary">{formatIDR(recap?.grossSales ?? 0)}</p>
              <p className="text-[11px] text-lp-on-surface-variant mt-0.5">{recap?.orderCount ?? 0} order</p>
            </div>
            <div className="rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-3.5 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant">Total Pembayaran</p>
              <p className="mt-1 text-xl font-extrabold font-lp-mono text-lp-on-surface">{formatIDR(recap?.totalPayments ?? 0)}</p>
              <p className="text-[11px] text-lp-on-surface-variant mt-0.5">semua metode</p>
            </div>
            <div className="rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-3.5 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant">Tunai Masuk</p>
              <p className="mt-1 text-xl font-extrabold font-lp-mono text-lp-on-surface">{formatIDR(recap?.cashSales ?? 0)}</p>
              <p className="text-[11px] text-lp-on-surface-variant mt-0.5">kembalian {formatIDR(recap?.cashChange ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-3.5 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant">Kas Keluar</p>
              <p className="mt-1 text-base font-bold font-lp-mono text-lp-on-surface">+{formatIDR(shift.openingCash)}</p>
              <p className="text-[11px] text-red-600 font-medium">−{formatIDR(recap?.totalExpenses ?? 0)} pengeluaran</p>
            </div>
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3.5 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Target Kas Fisik</p>
              <p className="mt-1 text-xl font-extrabold font-lp-mono text-emerald-800">{formatIDR(expectedCash)}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Modal + Tunai − Keluar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Denomination calculator */}
            <div className="lg:col-span-7 rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-lp-outline-variant/20 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-lp-on-surface">
                    Penghitungan Uang Fisik Laci (Denominasi)
                  </h2>
                  <p className="text-xs text-lp-on-surface-variant">
                    Masukkan lembar dan koin fisik di cash drawer saat penutupan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDenominations(EMPTY_DENOMINATIONS)}
                  className="text-xs font-semibold text-lp-error hover:underline"
                >
                  Reset Hitungan
                </button>
              </div>

              <div className="space-y-2.5">
                <DenominationRow label="Rp 100.000" multiplier={100000} count={denominations.k100} onChange={(c) => setDenomination('k100', c)} />
                <DenominationRow label="Rp 50.000" multiplier={50000} count={denominations.k50} onChange={(c) => setDenomination('k50', c)} />
                <DenominationRow label="Rp 20.000" multiplier={20000} count={denominations.k20} onChange={(c) => setDenomination('k20', c)} />
                <DenominationRow label="Rp 10.000" multiplier={10000} count={denominations.k10} onChange={(c) => setDenomination('k10', c)} />
                <DenominationRow label="Rp 5.000" multiplier={5000} count={denominations.k5} onChange={(c) => setDenomination('k5', c)} />
                <DenominationRow label="Rp 2.000" multiplier={2000} count={denominations.k2} onChange={(c) => setDenomination('k2', c)} />

                <div className="flex items-center justify-between rounded-xl border border-lp-outline-variant/30 bg-lp-surface-low px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-lp-on-surface">Uang Logam / Koin (Total Rp)</p>
                    <p className="text-[10px] text-lp-on-surface-variant">Pecahan Rp 1.000, 500, 200, 100</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-lp-on-surface-variant font-lp-mono">Rp</span>
                    <input
                      type="number"
                      value={denominations.coins || ''}
                      onChange={(e) => setDenomination('coins', Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 text-right rounded-lg border border-lp-outline-variant/40 bg-lp-surface-container-lowest px-2 py-1 text-xs font-bold font-lp-mono text-lp-on-surface outline-none focus:border-lp-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-lp-primary/40 bg-emerald-50/50 p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Total Uang Fisik Terhitung</p>
                  <p className="text-[11px] text-emerald-700">Akumulasi lembar dan koin fisik kasir</p>
                </div>
                <p className="text-2xl font-extrabold font-lp-mono text-lp-primary">{formatIDR(countedCash)}</p>
              </div>
            </div>

            {/* Reconciliation + close */}
            <div className="lg:col-span-5 space-y-4">
              <div
                className={`rounded-2xl border p-4 shadow-2xs ${
                  !hasCount
                    ? 'border-lp-outline-variant/30 bg-lp-surface-low text-lp-on-surface-variant'
                    : variance === 0
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      : variance < 0
                        ? 'border-red-300 bg-red-50 text-red-950'
                        : 'border-blue-300 bg-blue-50 text-blue-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">Status Rekonsiliasi Kas</span>
                  <Icon
                    name={!hasCount ? 'info' : variance === 0 ? 'check_circle' : variance < 0 ? 'warning' : 'info'}
                    className="text-xl"
                  />
                </div>
                <p className="mt-2 text-xl font-extrabold font-lp-mono">
                  {!hasCount
                    ? 'BELUM ADA HITUNGAN'
                    : variance === 0
                      ? 'SELISIH KAS: Rp 0 (SEIMBANG)'
                      : variance < 0
                        ? `SELISIH KURANG: −${formatIDR(Math.abs(variance))}`
                        : `SELISIH LEBIH: +${formatIDR(variance)}`}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-current/20 pt-2 font-medium">
                  <div>
                    <p className="text-[11px] opacity-75">Target Diharapkan:</p>
                    <p className="font-bold font-lp-mono">{formatIDR(expectedCash)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] opacity-75">Fisik Dihitung:</p>
                    <p className="font-bold font-lp-mono">{formatIDR(countedCash)}</p>
                  </div>
                </div>
              </div>

              {closeError && <Alert kind="error">{closeError}</Alert>}

              <Button
                className="w-full h-12 text-sm font-bold shadow-sm flex items-center justify-center gap-2"
                onClick={handleClose}
                disabled={closing || !hasCount}
              >
                <Icon name="lock" className="text-base" />
                <span>{closing ? 'Memproses penutupan…' : 'Tutup Shift Kasir'}</span>
              </Button>
              {!hasCount && (
                <p className="text-[11px] text-lp-on-surface-variant text-center">
                  Hitung uang fisik dulu untuk menutup shift.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmCloseOpen}
        title="Konfirmasi Selisih Kas Shift"
        description={`Terdapat selisih kas sebesar ${formatIDR(Math.abs(variance))} (${variance < 0 ? 'Kurang' : 'Lebih'}). Tetap lanjutkan penutupan shift?`}
        confirmText="Ya, Tutup Shift"
        cancelText="Batal & Hitung Ulang"
        variant="warning"
        icon="warning"
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={() => {
          setConfirmCloseOpen(false);
          void doClose();
        }}
      />

      <AlertDialog
        open={notice !== null}
        title="Shift Ditutup"
        description={notice ?? ''}
        variant="success"
        onClose={() => setNotice(null)}
      />
    </div>
  );
}

function DenominationRow({
  label,
  multiplier,
  count,
  onChange,
}: {
  label: string;
  multiplier: number;
  count: number;
  onChange: (c: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-lp-outline-variant/25 bg-lp-surface-low/70 px-3.5 py-2 transition-colors hover:bg-lp-surface-container/40">
      <span className="text-xs font-bold text-lp-on-surface min-w-[90px]">{label}</span>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-lp-outline-variant/40 bg-lp-surface-container-lowest shadow-2xs">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center text-xs font-bold text-lp-on-surface hover:bg-lp-surface-container transition-colors rounded-l-lg"
            onClick={() => onChange(count - 1)}
          >
            −
          </button>
          <input
            type="number"
            value={count || ''}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            placeholder="0"
            className="w-12 text-center text-xs font-bold font-lp-mono text-lp-on-surface outline-none"
          />
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center text-xs font-bold text-lp-on-surface hover:bg-lp-surface-container transition-colors rounded-r-lg"
            onClick={() => onChange(count + 1)}
          >
            +
          </button>
        </div>
        <span className="text-[11px] text-lp-on-surface-variant font-medium min-w-[45px]">lembar</span>
      </div>

      <span className="text-xs font-bold font-lp-mono text-lp-on-surface min-w-[100px] text-right">
        {formatIDR(count * multiplier)}
      </span>
    </div>
  );
}
