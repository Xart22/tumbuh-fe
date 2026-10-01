'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  approveScheduleSwap,
  clockIn,
  clockOut,
  closeShift,
  copyScheduleWeek,
  createEmployee,
  createSchedule,
  currentShift,
  deleteEmployee,
  deleteSchedule,
  getEmployeeOutlets,
  listAttendances,
  listEmployees,
  listOutlets,
  listShifts,
  openShift,
  requestScheduleSwap,
  scheduleWeek,
  setEmployeeOutlets,
  updateEmployee,
} from '@/lib/api';
import { formatIDR, formatNumber, formatQty, todayISO } from '@/lib/format';
import {
  EMPLOYEE_ROLE_LABELS,
  PAY_TYPE_LABELS,
  type Employee,
  type EmployeeRole,
  type ShiftSchedule,
} from '@/lib/types';
import { EmployeeFormModal, type EmployeeFormValues } from './employee-form';
import { Overlay } from '@/components/overlay';
import { ScheduleFormModal, type ScheduleFormValues } from './schedule-form';

type Tab = 'karyawan' | 'shift' | 'jadwal' | 'absensi';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'karyawan', label: 'Karyawan' },
  { id: 'shift', label: 'Shift Kasir' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'absensi', label: 'Absensi' },
];

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';

function roleLabel(role: string): string {
  return EMPLOYEE_ROLE_LABELS[role as EmployeeRole] ?? role;
}

function payRateLabel(employee: Employee): string {
  if (employee.payType === 'per_shift') {
    return `${formatIDR(employee.shiftRate ?? 0)}/shift`;
  }
  if (employee.payType === 'hourly') {
    return `${formatIDR(employee.baseSalary ?? 0)}/bln ÷173`;
  }
  return `${formatIDR(employee.baseSalary ?? 0)}/bln`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfWeek(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return toISODate(date);
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function dateLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function timeLabel(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EmployeesView() {
  const [tab, setTab] = useState<Tab>('karyawan');

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-lp-on-surface">
            Karyawan & Shift
          </h1>
          <p className="text-sm text-lp-on-surface-variant">
            Kelola tim, shift kasir, jadwal, dan absensi.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Bagian karyawan">
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

      {tab === 'karyawan' && <EmployeePanel />}
      {tab === 'shift' && <ShiftPanel />}
      {tab === 'jadwal' && <SchedulePanel />}
      {tab === 'absensi' && <AttendancePanel />}
    </section>
  );
}

function useEmployees() {
  return useQuery({ queryKey: ['employees'], queryFn: listEmployees });
}

function EmployeePanel() {
  const queryClient = useQueryClient();
  const employeesQ = useEmployees();
  const employees = employeesQ.data ?? [];
  const [editing, setEditing] = useState<Employee | null | 'new'>(null);
  const [outletTarget, setOutletTarget] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['employees'] });

  const saveM = useMutation({
    mutationFn: (values: EmployeeFormValues) => {
      const baseSalary =
        values.payType === 'per_shift' ? null : values.baseSalary ?? null;
      const shiftRate =
        values.payType === 'per_shift' ? values.shiftRate ?? null : null;
      if (editing && editing !== 'new') {
        const patch: Record<string, unknown> = {
          name: values.name.trim(),
          phone: values.phone?.trim() || undefined,
          role: values.role,
          jobTitle: values.jobTitle?.trim() || null,
          payType: values.payType,
          baseSalary,
          shiftRate,
          commissionRate: values.commissionRate ?? null,
        };
        if (values.pin.trim()) patch.pin = values.pin.trim();
        return updateEmployee(editing.id, patch);
      }
      return createEmployee({
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        role: values.role,
        pin: values.pin.trim(),
        jobTitle: values.jobTitle?.trim() || undefined,
        payType: values.payType,
        baseSalary: baseSalary ?? undefined,
        shiftRate: shiftRate ?? undefined,
        commissionRate: values.commissionRate ?? undefined,
      });
    },
    onSuccess: () => {
      setEditing(null);
      setError(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan karyawan.'),
  });

  const toggleM = useMutation({
    mutationFn: (employee: Employee) =>
      updateEmployee(employee.id, { isActive: !employee.isActive }),
    onSuccess: () => void invalidate(),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => void invalidate(),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menghapus karyawan.'),
  });

  return (
    <div className={PANEL}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-lp-on-surface">
          Daftar Karyawan
        </h2>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setEditing('new');
          }}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary transition hover:bg-lp-primary-container"
        >
          <Icon name="person_add" className="text-[16px]" />
          Tambah Karyawan
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {employeesQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : employeesQ.isError ? (
        <p className="text-sm text-lp-error">
          {employeesQ.error instanceof Error
            ? employeesQ.error.message
            : 'Gagal memuat karyawan.'}
        </p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Belum ada karyawan. Tambahkan kasir pertama Anda.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                <th className="pb-2">Nama</th>
                <th className="pb-2">Peran</th>
                <th className="pb-2">Skema Gaji</th>
                <th className="pb-2">Nomor HP</th>
                <th className="pb-2 text-center">Status</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-t border-lp-surface-container"
                >
                  <td className="py-2.5 font-semibold text-lp-on-surface">
                    {employee.name}
                    {employee.jobTitle && (
                      <span className="block text-[11px] font-normal text-lp-tertiary">
                        {employee.jobTitle}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-lp-on-surface-variant">
                    {roleLabel(employee.role)}
                  </td>
                  <td className="py-2.5">
                    <span className="block font-semibold text-lp-on-surface">
                      {PAY_TYPE_LABELS[employee.payType]}
                    </span>
                    <span className="font-lp-mono text-[11px] text-lp-tertiary">
                      {payRateLabel(employee)}
                      {employee.commissionRate
                        ? ` · ${employee.commissionRate}%`
                        : ''}
                    </span>
                  </td>
                  <td className="py-2.5 font-lp-mono text-lp-on-surface-variant">
                    {employee.phone ?? '—'}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        employee.isActive
                          ? 'bg-lp-primary-fixed/40 text-lp-on-primary-fixed'
                          : 'bg-lp-surface-container-high text-lp-on-surface-variant'
                      }`}
                    >
                      {employee.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex justify-end gap-1">
                      <IconButton
                        label="Atur outlet"
                        icon="storefront"
                        onClick={() => setOutletTarget(employee)}
                      />
                      <IconButton
                        label="Edit"
                        icon="edit"
                        onClick={() => {
                          setError(null);
                          setEditing(employee);
                        }}
                      />
                      <IconButton
                        label={employee.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        icon={employee.isActive ? 'toggle_on' : 'toggle_off'}
                        onClick={() => toggleM.mutate(employee)}
                      />
                      <IconButton
                        label="Hapus"
                        icon="delete"
                        tone="danger"
                        onClick={() => setEmployeeToDelete(employee)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <EmployeeFormModal
          employee={editing === 'new' ? null : editing}
          pending={saveM.isPending}
          errorMessage={error}
          onClose={() => setEditing(null)}
          onSubmit={(values) => saveM.mutate(values)}
        />
      )}

      {outletTarget && (
        <OutletAssignModal
          employee={outletTarget}
          onClose={() => setOutletTarget(null)}
        />
      )}

      <ConfirmDialog
        open={employeeToDelete !== null}
        title={`Hapus Karyawan "${employeeToDelete?.name}"?`}
        description="Data profil, riwayat shift, dan akses kasir karyawan ini akan dihapus secara permanen."
        confirmText="Ya, Hapus Karyawan"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteM.isPending}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={() => {
          if (employeeToDelete) {
            deleteM.mutate(employeeToDelete.id, {
              onSettled: () => setEmployeeToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}

function OutletAssignModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const outletsQ = useQuery({ queryKey: ['outlets'], queryFn: listOutlets });
  const assignedQ = useQuery({
    queryKey: ['employees', employee.id, 'outlets'],
    queryFn: () => getEmployeeOutlets(employee.id),
  });
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const outlets = outletsQ.data ?? [];
  const assigned = assignedQ.data ?? [];
  const current =
    selected ??
    new Set(assigned.map((row) => row.outletId));

  const saveM = useMutation({
    mutationFn: () => setEmployeeOutlets(employee.id, [...current]),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees', employee.id, 'outlets'],
      });
      onClose();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan outlet.'),
  });

  function toggle(id: string) {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <Overlay
      title="Penugasan Outlet"
      subtitle={employee.name}
      onClose={onClose}
    >
      {assignedQ.isPending || outletsQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : outletsQ.isError ? (
        <p className="text-sm text-lp-error">
          {outletsQ.error instanceof Error
            ? outletsQ.error.message
            : 'Gagal memuat outlet.'}
        </p>
      ) : outlets.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Belum ada outlet lain.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {outlets.map((outlet) => (
            <label
              key={outlet.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-lp-surface-low"
            >
              <input
                type="checkbox"
                checked={current.has(outlet.id)}
                onChange={() => toggle(outlet.id)}
                className="h-4 w-4"
              />
              <span className="text-lp-on-surface">{outlet.name}</span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={saveM.isPending || outletsQ.isPending}
          onClick={() => saveM.mutate()}
          className="rounded-lg bg-lp-primary px-5 py-2.5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
        >
          {saveM.isPending ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </Overlay>
  );
}

function ShiftPanel() {
  const queryClient = useQueryClient();
  const employeesQ = useEmployees();
  const employees = (employeesQ.data ?? []).filter((e) => e.isActive);
  const shiftQ = useQuery({
    queryKey: ['shifts', 'current'],
    queryFn: currentShift,
  });
  const historyQ = useQuery({
    queryKey: ['shifts', 'history'],
    queryFn: () => listShifts({ limit: 20 }),
  });
  const [employeeId, setEmployeeId] = useState('');
  const [openingCash, setOpeningCash] = useState('0');
  const [shiftName, setShiftName] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
  };

  const openM = useMutation({
    mutationFn: () =>
      openShift({
        employeeId: employeeId || employees[0]?.id || '',
        shiftName: shiftName.trim() || undefined,
        openingCash: Number(openingCash || 0),
      }),
    onSuccess: () => {
      setError(null);
      setShiftName('');
      setOpeningCash('0');
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal membuka shift.'),
  });

  const closeM = useMutation({
    mutationFn: (shiftId: string) =>
      closeShift(shiftId, Number(closingCash || 0)),
    onSuccess: () => {
      setError(null);
      setClosingCash('');
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menutup shift.'),
  });

  const current = shiftQ.data;
  const openShiftData = current?.currentShift ?? null;
  const recap = current && 'recap' in current ? current.recap : null;
  const history = historyQ.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className={PANEL}>
        <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
          Shift Berjalan
        </h2>
        {shiftQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
        ) : openShiftData && recap ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-lp-surface-low p-3">
              <p className="text-sm font-semibold text-lp-on-surface">
                {openShiftData.employeeName ?? '—'}
                {openShiftData.shiftName ? ` · ${openShiftData.shiftName}` : ''}
              </p>
              <p className="text-[11px] text-lp-tertiary">
                Dibuka {timeLabel(openShiftData.openedAt)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Row label="Transaksi" value={formatNumber(recap.orderCount)} />
              <Row label="Omzet" value={formatIDR(recap.grossSales)} />
              <Row label="Tunai" value={formatIDR(recap.cashSales)} />
              <Row
                label="Kas seharusnya"
                value={formatIDR(recap.expectedCash)}
              />
            </div>
            <div>
              <label
                htmlFor="close-cash"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary"
              >
                Uang fisik di laci
              </label>
              <input
                id="close-cash"
                type="number"
                min={0}
                step={1000}
                value={closingCash}
                onChange={(event) => setClosingCash(event.target.value)}
                className="w-full rounded-lg border border-lp-outline-variant px-3 py-2.5 text-sm font-medium outline-none focus:border-lp-primary"
              />
            </div>
            {error && (
              <p role="alert" className="text-xs font-medium text-lp-error">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={closeM.isPending || closingCash === ''}
              onClick={() => closeM.mutate(openShiftData.id)}
              className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-lp-error px-4 text-sm font-bold text-lp-on-error disabled:opacity-60"
            >
              <Icon name="logout" className="text-[18px]" />
              {closeM.isPending ? 'Memproses…' : 'Tutup Shift'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-lp-on-surface-variant">
              Belum ada shift berjalan.
            </p>
            <div>
              <label
                htmlFor="open-emp"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary"
              >
                Kasir
              </label>
              <select
                id="open-emp"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className="w-full rounded-lg border border-lp-outline-variant px-3 py-2.5 text-sm font-medium outline-none focus:border-lp-primary"
              >
                {employees.length === 0 && (
                  <option value="">Belum ada karyawan aktif</option>
                )}
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="open-name"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary"
                >
                  Nama shift
                </label>
                <input
                  id="open-name"
                  value={shiftName}
                  onChange={(event) => setShiftName(event.target.value)}
                  placeholder="Pagi"
                  className="w-full rounded-lg border border-lp-outline-variant px-3 py-2.5 text-sm font-medium outline-none focus:border-lp-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="open-cash"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary"
                >
                  Modal kas
                </label>
                <input
                  id="open-cash"
                  type="number"
                  min={0}
                  step={1000}
                  value={openingCash}
                  onChange={(event) => setOpeningCash(event.target.value)}
                  className="w-full rounded-lg border border-lp-outline-variant px-3 py-2.5 text-sm font-medium outline-none focus:border-lp-primary"
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="text-xs font-medium text-lp-error">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={openM.isPending || employees.length === 0}
              onClick={() => openM.mutate()}
              className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-lp-primary px-4 text-sm font-bold text-lp-on-primary disabled:opacity-60"
            >
              <Icon name="login" className="text-[18px]" />
              {openM.isPending ? 'Memproses…' : 'Buka Shift'}
            </button>
          </div>
        )}
      </div>

      <div className={PANEL}>
        <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
          Riwayat Shift
        </h2>
        {historyQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">Belum ada shift.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Kasir</th>
                  <th className="pb-2">Buka</th>
                  <th className="pb-2">Tutup</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((shift) => (
                  <tr
                    key={shift.id}
                    className="border-t border-lp-surface-container"
                  >
                    <td className="py-2 text-lp-on-surface">
                      {shift.employeeName ?? '—'}
                    </td>
                    <td className="py-2 font-lp-mono text-lp-on-surface-variant">
                      {timeLabel(shift.openedAt)}
                    </td>
                    <td className="py-2 font-lp-mono text-lp-on-surface-variant">
                      {timeLabel(shift.closedAt)}
                    </td>
                    <td className="py-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          shift.status === 'open'
                            ? 'bg-lp-primary-fixed/40 text-lp-on-primary-fixed'
                            : 'bg-lp-surface-container-high text-lp-on-surface-variant'
                        }`}
                      >
                        {shift.status === 'open' ? 'Berjalan' : 'Selesai'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SchedulePanel() {
  const queryClient = useQueryClient();
  const employeesQ = useEmployees();
  const employees = (employeesQ.data ?? []).filter((e) => e.isActive);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayISO()));
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekQ = useQuery({
    queryKey: ['shift-schedules', weekStart],
    queryFn: () => scheduleWeek(weekStart),
  });
  const schedules = weekQ.data ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['shift-schedules'] });

  const createM = useMutation({
    mutationFn: (values: ScheduleFormValues) =>
      createSchedule({
        employeeId: values.employeeId,
        scheduleDate: values.scheduleDate,
        startTime: values.startTime,
        endTime: values.endTime,
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      setShowForm(false);
      setError(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal.'),
  });

  const copyM = useMutation({
    mutationFn: () => copyScheduleWeek(weekStart),
    onSuccess: () => void invalidate(),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyalin jadwal.'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => void invalidate(),
  });

  const swapM = useMutation({
    mutationFn: ({ id, target }: { id: string; target: string }) =>
      requestScheduleSwap(id, target),
    onSuccess: () => void invalidate(),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal mengajukan tukar.'),
  });

  const approveM = useMutation({
    mutationFn: (id: string) => approveScheduleSwap(id),
    onSuccess: () => void invalidate(),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyetujui tukar.'),
  });

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <div className={PANEL}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-lp-on-surface">
          Jadwal Mingguan
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="h-9 rounded-lg px-3 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
          >
            ← Sebelumnya
          </button>
          <span className="text-xs font-semibold text-lp-on-surface-variant">
            {dateLabel(weekStart)} – {dateLabel(addDays(weekStart, 6))}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="h-9 rounded-lg px-3 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
          >
            Berikutnya →
          </button>
          <button
            type="button"
            disabled={copyM.isPending}
            onClick={() => {
              setError(null);
              copyM.mutate();
            }}
            className="h-9 rounded-lg border border-lp-outline-variant px-3 text-xs font-semibold text-lp-on-surface hover:bg-lp-surface-low disabled:opacity-60"
          >
            {copyM.isPending ? 'Menyalin…' : 'Salin minggu lalu'}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setShowForm(true);
            }}
            disabled={employees.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary disabled:opacity-60"
          >
            <Icon name="add" className="text-[16px]" />
            Jadwal
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {weekQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {days.map((day) => {
            const rows = schedules.filter((s) => s.scheduleDate === day);
            return (
              <div
                key={day}
                className="rounded-lg border border-lp-surface-container p-2"
              >
                <p className="mb-2 text-xs font-bold text-lp-on-surface">
                  {dateLabel(day)}
                </p>
                {rows.length === 0 ? (
                  <p className="text-[11px] text-lp-tertiary">Kosong</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {rows.map((schedule) => (
                      <ScheduleCard
                        key={schedule.id}
                        schedule={schedule}
                        siblings={schedules}
                        onDelete={() => deleteM.mutate(schedule.id)}
                        onSwap={(target) =>
                          swapM.mutate({ id: schedule.id, target })
                        }
                        onApprove={() => approveM.mutate(schedule.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ScheduleFormModal
          employees={employees}
          defaultDate={weekStart}
          pending={createM.isPending}
          errorMessage={error}
          onClose={() => setShowForm(false)}
          onSubmit={(values) => createM.mutate(values)}
        />
      )}
    </div>
  );
}

function ScheduleCard({
  schedule,
  siblings,
  onDelete,
  onSwap,
  onApprove,
}: {
  schedule: ShiftSchedule;
  siblings: ShiftSchedule[];
  onDelete: () => void;
  onSwap: (targetId: string) => void;
  onApprove: () => void;
}) {
  const [target, setTarget] = useState('');
  const swapCandidates = siblings.filter(
    (other) => other.id !== schedule.id && other.scheduleDate === schedule.scheduleDate,
  );

  return (
    <div className="rounded-lg bg-lp-surface-low p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-lp-on-surface">
          {schedule.employeeName ?? '—'}
        </span>
        <button
          type="button"
          aria-label="Hapus jadwal"
          onClick={onDelete}
          className="rounded p-0.5 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container"
        >
          <Icon name="close" className="text-[14px]" />
        </button>
      </div>
      <p className="font-lp-mono text-[11px] text-lp-on-surface-variant">
        {schedule.startTime}–{schedule.endTime}
      </p>
      {schedule.status === 'swap_pending' && (
        <button
          type="button"
          onClick={onApprove}
          className="mt-1 w-full rounded bg-lp-secondary-container px-2 py-1 text-[10px] font-bold text-lp-on-secondary-container"
        >
          Setujui tukar
        </button>
      )}
      {schedule.status !== 'swap_pending' && swapCandidates.length > 0 && (
        <div className="mt-1 flex items-center gap-1">
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            aria-label="Tukar dengan"
            className="h-7 flex-1 rounded border border-lp-outline-variant bg-white px-1 text-[10px]"
          >
            <option value="">Tukar…</option>
            {swapCandidates.map((other) => (
              <option key={other.id} value={other.id}>
                {other.employeeName}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={target === ''}
            onClick={() => onSwap(target)}
            className="h-7 rounded bg-lp-surface-container-high px-2 text-[10px] font-semibold text-lp-on-surface disabled:opacity-50"
          >
            Ajukan
          </button>
        </div>
      )}
    </div>
  );
}

function AttendancePanel() {
  const queryClient = useQueryClient();
  const employeesQ = useEmployees();
  const employees = (employeesQ.data ?? []).filter((e) => e.isActive);
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [employeeId, setEmployeeId] = useState('');
  const [clockEmployeeId, setClockEmployeeId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const attendanceQ = useQuery({
    queryKey: ['attendances', dateFrom, dateTo, employeeId],
    queryFn: () =>
      listAttendances({
        dateFrom,
        dateTo,
        employeeId: employeeId || undefined,
      }),
  });
  const rows = attendanceQ.data ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['attendances'] });

  const clockInM = useMutation({
    mutationFn: () => clockIn({ employeeId: clockEmployeeId }),
    onSuccess: () => {
      setError(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal clock-in.'),
  });

  const clockOutM = useMutation({
    mutationFn: (id: string) => clockOut(id),
    onSuccess: () => {
      setError(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal clock-out.'),
  });

  return (
    <div className={PANEL}>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="att-from"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary"
          >
            Dari
          </label>
          <input
            id="att-from"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-lg border border-lp-outline-variant px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="att-to"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary"
          >
            Sampai
          </label>
          <input
            id="att-to"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="rounded-lg border border-lp-outline-variant px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="att-emp"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary"
          >
            Karyawan
          </label>
          <select
            id="att-emp"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            className="rounded-lg border border-lp-outline-variant px-3 py-2 text-sm"
          >
            <option value="">Semua</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            aria-label="Pilih karyawan clock-in"
            value={clockEmployeeId}
            onChange={(event) => setClockEmployeeId(event.target.value)}
            className="h-10 rounded-lg border border-lp-outline-variant px-3 text-sm"
          >
            <option value="">Pilih karyawan…</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={clockInM.isPending || clockEmployeeId === ''}
            onClick={() => clockInM.mutate()}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary disabled:opacity-60"
          >
            <Icon name="login" className="text-[16px]" />
            Clock-in
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {attendanceQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : attendanceQ.isError ? (
        <p className="text-sm text-lp-error">
          {attendanceQ.error instanceof Error
            ? attendanceQ.error.message
            : 'Gagal memuat absensi.'}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Belum ada data absensi.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                <th className="pb-2">Karyawan</th>
                <th className="pb-2">Masuk</th>
                <th className="pb-2">Keluar</th>
                <th className="pb-2 text-right">Jam kerja</th>
                <th className="pb-2 text-right">Jarak</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-lp-surface-container"
                >
                  <td className="py-2 font-semibold text-lp-on-surface">
                    {row.employeeName}
                  </td>
                  <td className="py-2 font-lp-mono text-lp-on-surface-variant">
                    {timeLabel(row.clockIn)}
                  </td>
                  <td className="py-2 font-lp-mono text-lp-on-surface-variant">
                    {timeLabel(row.clockOut)}
                  </td>
                  <td className="py-2 text-right font-lp-mono text-lp-on-surface">
                    {row.hoursWorked === null ? '—' : formatQty(row.hoursWorked)}
                  </td>
                  <td className="py-2 text-right font-lp-mono text-lp-on-surface-variant">
                    {row.distanceMeters === null
                      ? '—'
                      : `${formatNumber(row.distanceMeters)}m`}
                  </td>
                  <td className="py-2 text-right">
                    {row.clockOut === null && (
                      <button
                        type="button"
                        disabled={clockOutM.isPending}
                        onClick={() => clockOutM.mutate(row.employeeId)}
                        className="rounded-lg bg-lp-surface-container-high px-2.5 py-1 text-xs font-semibold text-lp-on-surface disabled:opacity-60"
                      >
                        Clock-out
                      </button>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-lp-on-surface-variant">{label}</span>
      <span className="font-lp-mono font-semibold text-lp-on-surface">
        {value}
      </span>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  tone = 'default',
}: {
  label: string;
  icon: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-lg p-1.5 text-lp-on-surface-variant transition ${
        tone === 'danger'
          ? 'hover:bg-lp-error-container hover:text-lp-on-error-container'
          : 'hover:bg-lp-surface-container hover:text-lp-on-surface'
      }`}
    >
      <Icon name={icon} className="text-[18px]" />
    </button>
  );
}
