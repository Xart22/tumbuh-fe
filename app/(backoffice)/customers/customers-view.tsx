'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { Overlay } from '@/components/overlay';
import {
  createCustomer,
  createVoucher,
  getCustomer,
  getCustomerAnalytics,
  getCustomerBirthdays,
  getCustomerSegments,
  getCustomerStampCard,
  listCustomers,
  listVouchers,
  redeemCustomerPoints,
  redeemStampReward,
  updateVoucher,
} from '@/lib/api';
import { formatIDR, formatNumber } from '@/lib/format';
import { type CustomerSegmentRow } from '@/lib/types';
import {
  CustomerFormModal,
  toCustomerInput,
  type CustomerFormValues,
} from './customer-form';
import {
  toVoucherInput,
  VoucherFormModal,
  type VoucherFormValues,
} from './voucher-form';

type Tab = 'pelanggan' | 'segmen' | 'ulang-tahun' | 'voucher';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'pelanggan', label: 'Pelanggan' },
  { id: 'segmen', label: 'Segmen' },
  { id: 'ulang-tahun', label: 'Ulang Tahun' },
  { id: 'voucher', label: 'Voucher' },
];

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

const TIER_TONE: Record<string, string> = {
  bronze: 'bg-lp-surface-container-high text-lp-on-surface-variant',
  silver: 'bg-lp-surface-container-high text-lp-on-surface',
  gold: 'bg-lp-secondary-container/40 text-lp-on-secondary-container',
  platinum: 'bg-lp-primary-fixed/50 text-lp-on-primary-fixed',
};

export function CustomersView() {
  const [tab, setTab] = useState<Tab>('pelanggan');

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-lp-on-surface">
            Pelanggan & CRM
          </h1>
          <p className="text-sm text-lp-on-surface-variant">
            Database pelanggan, segmen, ulang tahun, dan voucher.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Bagian CRM">
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

      {tab === 'pelanggan' && <CustomerPanel />}
      {tab === 'segmen' && <SegmentPanel />}
      {tab === 'ulang-tahun' && <BirthdayPanel />}
      {tab === 'voucher' && <VoucherPanel />}
    </section>
  );
}

function tierChip(tier: string) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        TIER_TONE[tier] ?? TIER_TONE.bronze
      }`}
    >
      {TIER_LABEL[tier] ?? tier}
    </span>
  );
}

function CustomerPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => listCustomers({ search: search || undefined, page, limit: 20 }),
  });
  const data = listQ.data;

  const createM = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      createCustomer(toCustomerInput(values)),
    onSuccess: () => {
      setShowForm(false);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menambah pelanggan.'),
  });

  return (
    <div className={PANEL}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-lp-on-surface-variant"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Cari nama atau nomor HP…"
            aria-label="Cari pelanggan"
            className="h-10 w-full rounded-lg bg-lp-surface-container-low pl-10 pr-3 text-sm text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowForm(true);
          }}
          className="flex h-10 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary transition hover:bg-lp-primary-container"
        >
          <Icon name="person_add" className="text-[16px]" />
          Tambah Pelanggan
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {listQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : listQ.isError ? (
        <p className="text-sm text-lp-error">
          {listQ.error instanceof Error
            ? listQ.error.message
            : 'Gagal memuat pelanggan.'}
        </p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Belum ada pelanggan.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Nama</th>
                  <th className="pb-2">Nomor HP</th>
                  <th className="pb-2 text-center">Tier</th>
                  <th className="pb-2 text-right">Poin</th>
                  <th className="pb-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer border-t border-lp-surface-container hover:bg-lp-surface-low/70"
                    onClick={() => setDetailId(customer.id)}
                  >
                    <td className="py-2.5 font-semibold text-lp-on-surface">
                      {customer.name}
                    </td>
                    <td className="py-2.5 font-lp-mono text-lp-on-surface-variant">
                      {customer.phone ?? '—'}
                    </td>
                    <td className="py-2.5 text-center">
                      {tierChip(customer.tier)}
                    </td>
                    <td className="py-2.5 text-right font-lp-mono text-lp-on-surface">
                      {formatNumber(customer.totalPoints)}
                    </td>
                    <td className="py-2.5 text-right text-xs font-semibold text-lp-primary">
                      Detail
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-lp-on-surface-variant">
              <span>
                {formatNumber(data.total)} pelanggan · halaman {data.page}/
                {data.totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-lp-outline-variant px-2.5 py-1 font-semibold disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-lp-outline-variant px-2.5 py-1 font-semibold disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <CustomerFormModal
          pending={createM.isPending}
          errorMessage={error}
          onClose={() => setShowForm(false)}
          onSubmit={(values) => createM.mutate(values)}
        />
      )}

      {detailId && (
        <CustomerDetailModal id={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

function CustomerDetailModal({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const detailQ = useQuery({
    queryKey: ['customers', id],
    queryFn: () => getCustomer(id),
  });
  const analyticsQ = useQuery({
    queryKey: ['customers', id, 'analytics'],
    queryFn: () => getCustomerAnalytics(id, 90),
  });
  const stampQ = useQuery({
    queryKey: ['customers', id, 'stamp-card'],
    queryFn: () => getCustomerStampCard(id),
  });
  const [redeem, setRedeem] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['customers'] });

  const redeemM = useMutation({
    mutationFn: () => redeemCustomerPoints(id, Number(redeem)),
    onSuccess: () => {
      setRedeem('');
      setError(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menukar poin.'),
  });

  const stampM = useMutation({
    mutationFn: () => redeemStampReward(id),
    onSuccess: () => void invalidate(),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menukar stempel.'),
  });

  const detail = detailQ.data;
  const analytics = analyticsQ.data;
  const stamp = stampQ.data;

  return (
    <Overlay
      title={detail?.name ?? 'Detail Pelanggan'}
      subtitle={detail?.phone ?? undefined}
      onClose={onClose}
    >
      {detailQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : detailQ.isError || !detail ? (
        <p className="text-sm text-lp-error">
          {detailQ.error instanceof Error
            ? detailQ.error.message
            : 'Gagal memuat pelanggan.'}
        </p>
      ) : (
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <div className="flex items-center gap-2">
            {tierChip(detail.tier)}
            <span className="font-lp-mono text-sm text-lp-on-surface">
              {formatNumber(detail.totalPoints)} poin
            </span>
          </div>

          {detail.notes && (
            <p className="rounded-lg bg-lp-surface-low px-3 py-2 text-xs text-lp-on-surface-variant">
              {detail.notes}
            </p>
          )}

          {analytics && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="Kunjungan" value={formatNumber(analytics.visitCount)} />
              <Stat
                label="Total belanja"
                value={formatIDR(analytics.totalSpending)}
              />
              <Stat
                label="Rata-rata"
                value={formatIDR(analytics.averageOrderValue)}
              />
              <Stat
                label="Terakhir"
                value={
                  analytics.lastVisitAt
                    ? new Date(analytics.lastVisitAt).toLocaleDateString('id-ID')
                    : '—'
                }
              />
            </div>
          )}

          {analytics && analytics.favoriteProducts.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
                Produk favorit
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {analytics.favoriteProducts.map((product) => (
                  <li
                    key={product.productId}
                    className="flex justify-between text-lp-on-surface"
                  >
                    <span>{product.productName}</span>
                    <span className="font-lp-mono text-lp-on-surface-variant">
                      {formatNumber(product.qty)}×
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stamp && stamp.threshold > 0 && (
            <div className="rounded-lg bg-lp-surface-low p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-lp-on-surface-variant">Kartu stempel</span>
                <span className="font-lp-mono font-semibold text-lp-on-surface">
                  {stamp.stamps}/{stamp.threshold}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-lp-tertiary">
                  Hadiah tersedia: {stamp.rewardsEarned}
                </span>
                <button
                  type="button"
                  disabled={stamp.rewardsEarned <= 0 || stampM.isPending}
                  onClick={() => stampM.mutate()}
                  className="rounded-lg bg-lp-secondary-container px-3 py-1.5 text-xs font-bold text-lp-on-secondary-container disabled:opacity-50"
                >
                  Tukar hadiah
                </button>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="redeem-points"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-lp-tertiary"
            >
              Tukar poin
            </label>
            <div className="flex gap-2">
              <input
                id="redeem-points"
                type="number"
                min={1}
                step={1}
                value={redeem}
                onChange={(event) => setRedeem(event.target.value)}
                placeholder="Jumlah poin"
                className="h-10 flex-1 rounded-lg border border-lp-outline-variant px-3 text-sm outline-none focus:border-lp-primary"
              />
              <button
                type="button"
                disabled={redeemM.isPending || Number(redeem) <= 0}
                onClick={() => redeemM.mutate()}
                className="rounded-lg bg-lp-primary px-4 text-xs font-bold text-lp-on-primary disabled:opacity-60"
              >
                {redeemM.isPending ? '…' : 'Tukar'}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-lp-error">
              {error}
            </p>
          )}

          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-lp-tertiary">
              Riwayat kunjungan
            </p>
            {detail.visits.length === 0 ? (
              <p className="text-sm text-lp-on-surface-variant">
                Belum ada kunjungan.
              </p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {detail.visits.map((visit) => (
                  <li
                    key={visit.id}
                    className="flex items-center justify-between text-lp-on-surface-variant"
                  >
                    <span>
                      {new Date(visit.visitedAt).toLocaleDateString('id-ID')}
                    </span>
                    <span className="font-lp-mono text-xs">
                      +{formatNumber(visit.pointsEarned)}
                      {visit.pointsRedeemed > 0
                        ? ` / -${formatNumber(visit.pointsRedeemed)}`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Overlay>
  );
}

function SegmentPanel() {
  const [days, setDays] = useState(90);
  const q = useQuery({
    queryKey: ['customers', 'segments', days],
    queryFn: () => getCustomerSegments(days),
  });

  if (q.isPending) {
    return (
      <div className={PANEL}>
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className={PANEL}>
        <p className="text-sm text-lp-error">
          {q.error instanceof Error ? q.error.message : 'Gagal memuat segmen.'}
        </p>
      </div>
    );
  }

  const { counts, segments } = q.data;
  const groups: Array<{ key: keyof typeof segments; label: string }> = [
    { key: 'vip', label: 'VIP' },
    { key: 'regular', label: 'Reguler' },
    { key: 'new', label: 'Baru' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className={PANEL}>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-lp-on-surface">
              Segmen Pelanggan
            </h2>
            <p className="text-xs text-lp-on-surface-variant">
              VIP ≥5 kunjungan atau ≥Rp 5jt · Reguler ≥2 kunjungan.
            </p>
          </div>
          <label className="text-xs font-semibold text-lp-on-surface-variant">
            Periode
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="ml-2 rounded-lg border border-lp-outline-variant px-2 py-1 text-sm"
            >
              <option value={30}>30 hari</option>
              <option value={90}>90 hari</option>
              <option value={180}>180 hari</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="VIP" value={formatNumber(counts.vip)} />
          <Stat label="Reguler" value={formatNumber(counts.regular)} />
          <Stat label="Baru" value={formatNumber(counts.new)} />
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key} className={PANEL}>
          <h3 className="mb-2 text-sm font-semibold text-lp-on-surface">
            {group.label} ({segments[group.key].length})
          </h3>
          {segments[group.key].length === 0 ? (
            <p className="text-sm text-lp-on-surface-variant">Belum ada data.</p>
          ) : (
            <SegmentTable rows={segments[group.key]} />
          )}
        </div>
      ))}
    </div>
  );
}

function SegmentTable({ rows }: { rows: CustomerSegmentRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
            <th className="pb-2">Nama</th>
            <th className="pb-2 text-right">Kunjungan</th>
            <th className="pb-2 text-right">Belanja</th>
            <th className="pb-2 text-right">Poin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.customerId} className="border-t border-lp-surface-container">
              <td className="py-2 text-lp-on-surface">{row.name}</td>
              <td className="py-2 text-right font-lp-mono text-lp-on-surface-variant">
                {formatNumber(row.visitCount)}
              </td>
              <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                {formatIDR(row.spending)}
              </td>
              <td className="py-2 text-right font-lp-mono text-lp-on-surface-variant">
                {formatNumber(row.totalPoints)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BirthdayPanel() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const q = useQuery({
    queryKey: ['customers', 'birthdays', month],
    queryFn: () => getCustomerBirthdays(month),
  });
  const rows = q.data ?? [];

  const MONTHS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  return (
    <div className={PANEL}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-lp-on-surface">
          Ulang Tahun Pelanggan
        </h2>
        <select
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
          aria-label="Bulan"
          className="rounded-lg border border-lp-outline-variant px-3 py-1.5 text-sm"
        >
          {MONTHS.map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {q.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : q.isError ? (
        <p className="text-sm text-lp-error">
          {q.error instanceof Error ? q.error.message : 'Gagal memuat.'}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Tidak ada pelanggan yang berulang tahun bulan ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                <th className="pb-2">Nama</th>
                <th className="pb-2">Nomor HP</th>
                <th className="pb-2">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.customerId}
                  className="border-t border-lp-surface-container"
                >
                  <td className="py-2 font-semibold text-lp-on-surface">
                    {row.name}
                  </td>
                  <td className="py-2 font-lp-mono text-lp-on-surface-variant">
                    {row.phone ?? '—'}
                  </td>
                  <td className="py-2 text-lp-on-surface-variant">
                    {new Date(`${row.birthDate}T00:00:00`).toLocaleDateString(
                      'id-ID',
                      { day: 'numeric', month: 'long' },
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VoucherPanel() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ['vouchers', code],
    queryFn: () => listVouchers({ code: code || undefined, limit: 50 }),
  });
  const data = listQ.data;

  const createM = useMutation({
    mutationFn: (values: VoucherFormValues) =>
      createVoucher(toVoucherInput(values)),
    onSuccess: () => {
      setShowForm(false);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menambah voucher.'),
  });

  const toggleM = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateVoucher(id, { isActive }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal memperbarui voucher.'),
  });
  return (
    <div className={PANEL}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Cari kode voucher…"
          aria-label="Cari voucher"
          className="h-10 min-w-56 flex-1 rounded-lg bg-lp-surface-container-low px-3 text-sm text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container"
        />
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowForm(true);
          }}
          className="flex h-10 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary transition hover:bg-lp-primary-container"
        >
          <Icon name="add" className="text-[16px]" />
          Tambah Voucher
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {listQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : listQ.isError ? (
        <p className="text-sm text-lp-error">
          {listQ.error instanceof Error
            ? listQ.error.message
            : 'Gagal memuat voucher.'}
        </p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">Belum ada voucher.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                <th className="pb-2">Kode</th>
                <th className="pb-2">Nama</th>
                <th className="pb-2 text-right">Nilai</th>
                <th className="pb-2 text-right">Min. Order</th>
                <th className="pb-2 text-right">Terpakai</th>
                <th className="pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((voucher) => (
                <tr
                  key={voucher.id}
                  className="border-t border-lp-surface-container"
                >
                  <td className="py-2.5 font-lp-mono font-semibold text-lp-on-surface">
                    {voucher.code}
                  </td>
                  <td className="py-2.5 text-lp-on-surface-variant">
                    {voucher.name}
                  </td>
                  <td className="py-2.5 text-right font-lp-mono text-lp-on-surface">
                    {voucher.type === 'percent'
                      ? `${voucher.value}%`
                      : formatIDR(voucher.value)}
                  </td>
                  <td className="py-2.5 text-right font-lp-mono text-lp-on-surface-variant">
                    {voucher.minOrder > 0 ? formatIDR(voucher.minOrder) : '—'}
                  </td>
                  <td className="py-2.5 text-right font-lp-mono text-lp-on-surface-variant">
                    {formatNumber(voucher.usedCount)}
                    {voucher.maxUses !== null ? `/${voucher.maxUses}` : ''}
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      type="button"
                      disabled={toggleM.isPending}
                      onClick={() =>
                        toggleM.mutate({ id: voucher.id, isActive: false })
                      }
                      className="text-[11px] font-semibold text-lp-error hover:underline disabled:opacity-50"
                    >
                      Nonaktifkan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <VoucherFormModal
          pending={createM.isPending}
          errorMessage={error}
          onClose={() => setShowForm(false)}
          onSubmit={(values) => createM.mutate(values)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-lp-surface-low p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
        {label}
      </p>
      <p className="font-lp-mono text-lg font-bold text-lp-on-surface">
        {value}
      </p>
    </div>
  );
}
