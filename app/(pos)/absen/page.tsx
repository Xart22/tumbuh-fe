'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { Alert, Button, Spinner } from '@/components/pos-ui';
import {
  clockInMe,
  clockOutMe,
  getOutlet,
  listMyAttendances,
  uploadFile,
} from '@/lib/api';
import type { Attendance, AttendanceSettings } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';

type Geo = { lat: number; lng: number } | null;

const DEFAULT_REQ: AttendanceSettings = {
  maxRadiusM: 0,
  requireGps: false,
  requirePhoto: false,
};

/** Local calendar date as `YYYY-MM-DD` (never UTC — avoids the WIB off-by-one). */
function localDateISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Local calendar date of an ISO timestamp, for comparing against today. */
function localDateOf(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Today's open clock-in only. A forgotten clock-out from a previous day must
 * not masquerade as "still working" and hide the clock-in button.
 */
function todayOpenAttendance(rows: Attendance[]): Attendance | null {
  const today = localDateISO(0);
  return (
    rows.find((a) => a.clockOut === null && localDateOf(a.clockIn) === today) ??
    null
  );
}

function fmtTime(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Lateness / early-leave chip; null for a plain on-time day. */
function attendanceBadge(
  status: string,
): { label: string; className: string } | null {
  if (status === 'late') {
    return {
      label: 'Terlambat',
      className: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  }
  if (status === 'early_leave') {
    return {
      label: 'Pulang Cepat',
      className: 'bg-blue-100 text-blue-900 border-blue-300',
    };
  }
  return null;
}

function getPosition(): Promise<Geo> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Perangkat tidak mendukung lokasi (GPS).'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Gagal mengambil lokasi. Izinkan akses lokasi.')),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export default function AbsenPage() {
  const outletId = useAuthStore((s) => s.outletId);
  const user = useAuthStore((s) => s.user);

  const [req, setReq] = useState<AttendanceSettings>(DEFAULT_REQ);
  const [today, setToday] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [pendingGps, setPendingGps] = useState<Geo>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const load = useCallback(async () => {
    const rows = await listMyAttendances({
      dateFrom: localDateISO(-30),
      dateTo: localDateISO(0),
    });
    setHistory(rows);
    setToday(todayOpenAttendance(rows));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      outletId
        ? getOutlet(outletId)
            .then((o) => o.settings.attendance)
            .catch(() => null)
        : Promise.resolve(null),
      listMyAttendances({
        dateFrom: localDateISO(-30),
        dateTo: localDateISO(0),
      }),
    ])
      .then(([attendance, rows]) => {
        if (cancelled) return;
        if (attendance) setReq(attendance);
        setHistory(rows);
        setToday(todayOpenAttendance(rows));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat absensi.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  useEffect(() => {
    if (!showCamera) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      })
      .catch(() => setError('Tidak bisa mengakses kamera. Izinkan akses kamera.'));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [showCamera]);

  async function doClockIn(gps: Geo, photoUrl?: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await clockInMe({
        gpsLat: gps?.lat,
        gpsLng: gps?.lng,
        photoUrl,
      });
      setNotice('Absen masuk tercatat.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal absen masuk.');
    } finally {
      setBusy(false);
    }
  }

  async function handleClockIn() {
    setError(null);
    setNotice(null);
    let gps: Geo = null;
    try {
      gps = await getPosition();
    } catch (err) {
      // A configured geofence rejects a missing position even when the
      // "GPS wajib" toggle is off, so treat radius > 0 as required too.
      if (req.requireGps || req.maxRadiusM > 0) {
        setError(err instanceof Error ? err.message : 'Lokasi wajib diaktifkan.');
        return;
      }
    }
    if (req.requirePhoto) {
      setPendingGps(gps);
      setShowCamera(true);
      return;
    }
    await doClockIn(gps);
  }

  async function captureAndClockIn() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.8),
    );
    if (!blob) {
      setError('Gagal mengambil foto.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      const { publicUrl } = await uploadFile(file);
      await doClockIn(pendingGps, publicUrl);
      setShowCamera(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah selfie.');
    } finally {
      setBusy(false);
    }
  }

  async function handleClockOut() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await clockOutMe();
      setNotice('Absen keluar tercatat.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal absen keluar.');
    } finally {
      setBusy(false);
    }
  }

  const working = today !== null;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-lp-on-surface">
          Absensi Saya
        </h1>
        <p className="mt-1 text-xs text-lp-on-surface-variant">
          {user?.name ?? 'Pegawai'} · Absen masuk/keluar dengan lokasi
          {req.requirePhoto ? ' dan selfie' : ''}.
        </p>
      </div>

      {notice && <Alert kind="info">{notice}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      <div className="rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-5 shadow-xs">
        {loading ? (
          <Spinner label="Memuat status absensi…" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-lp-on-surface-variant">
                <Icon name="schedule" className="text-base text-lp-primary" />
                Status hari ini
              </span>
              <span className="flex items-center gap-1.5">
                {today?.status === 'late' && (
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                    Terlambat
                  </span>
                )}
                {working ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-lp-primary">
                    Sedang Bekerja
                  </span>
                ) : (
                  <span className="rounded-full border border-lp-outline-variant/40 bg-lp-surface-low px-2.5 py-0.5 text-[11px] font-bold text-lp-on-surface-variant">
                    Belum Absen Masuk
                  </span>
                )}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                  Masuk
                </p>
                <p className="font-lp-mono font-bold text-lp-on-surface">
                  {fmtTime(today?.clockIn ?? null)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                  Keluar
                </p>
                <p className="font-lp-mono font-bold text-lp-on-surface">
                  {fmtTime(today?.clockOut ?? null)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-lp-on-surface-variant">
              <span className="inline-flex items-center gap-1 rounded-full bg-lp-surface-low px-2 py-0.5 font-medium">
                <Icon name="my_location" className="text-sm" />
                {req.requireGps || req.maxRadiusM > 0
                  ? 'GPS wajib'
                  : 'GPS opsional'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-lp-surface-low px-2 py-0.5 font-medium">
                <Icon name="photo_camera" className="text-sm" />
                {req.requirePhoto ? 'Selfie wajib' : 'Selfie opsional'}
              </span>
              {req.maxRadiusM > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-lp-surface-low px-2 py-0.5 font-medium">
                  <Icon name="pin_drop" className="text-sm" />
                  Radius {req.maxRadiusM} m
                </span>
              )}
            </div>

            <div className="mt-5">
              {working ? (
                <Button
                  variant="danger"
                  className="h-12 w-full text-sm font-bold"
                  onClick={() => void handleClockOut()}
                  disabled={busy}
                >
                  <Icon name="logout" className="text-base" />
                  <span>{busy ? 'Memproses…' : 'Absen Keluar'}</span>
                </Button>
              ) : (
                <Button
                  className="h-12 w-full text-sm font-bold"
                  onClick={() => void handleClockIn()}
                  disabled={busy}
                >
                  <Icon name="login" className="text-base" />
                  <span>{busy ? 'Memproses…' : 'Absen Masuk'}</span>
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-5 shadow-xs">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-lp-on-surface">
          <Icon name="history" className="text-base text-lp-tertiary" />
          Riwayat 30 Hari
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">Belum ada data absensi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Tanggal</th>
                  <th className="pb-2">Masuk</th>
                  <th className="pb-2">Keluar</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Jam kerja</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => {
                  const noClockOut =
                    row.clockOut === null &&
                    localDateOf(row.clockIn) !== localDateISO(0);
                  const badge =
                    row.status === 'missing_clock_out' || noClockOut
                      ? {
                          label: 'Tidak absen pulang',
                          className: 'bg-red-100 text-red-800 border-red-300',
                        }
                      : attendanceBadge(row.status);
                  return (
                  <tr key={row.id} className="border-t border-lp-surface-container">
                    <td className="py-2 text-lp-on-surface">{fmtDate(row.clockIn)}</td>
                    <td className="py-2 font-lp-mono text-lp-on-surface">
                      {fmtTime(row.clockIn)}
                    </td>
                    <td className="py-2 font-lp-mono text-lp-on-surface">
                      {fmtTime(row.clockOut)}
                    </td>
                    <td className="py-2">
                      {badge ? (
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      ) : (
                        <span className="text-lp-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                      {row.hoursWorked == null ? '—' : `${row.hoursWorked} jam`}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-4 shadow-2xl">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-lp-on-surface">
              <Icon name="photo_camera" className="text-base text-lp-primary" />
              Ambil Selfie
            </h2>
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-square w-full rounded-xl bg-black object-cover"
            />
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setShowCamera(false)}
                disabled={busy}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="flex-1 font-bold"
                onClick={() => void captureAndClockIn()}
                disabled={busy}
              >
                <Icon name="check_circle" className="text-sm" />
                <span>{busy ? 'Mengirim…' : 'Ambil & Absen'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
