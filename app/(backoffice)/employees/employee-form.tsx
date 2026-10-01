'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_ROLE_LABELS,
  PAY_TYPES,
  PAY_TYPE_LABELS,
  type Employee,
} from '@/lib/types';
import { Overlay } from '@/components/overlay';

const optionalMoney = z.preprocess(
  (value) =>
    value === '' ||
    value === null ||
    value === undefined ||
    (typeof value === 'number' && Number.isNaN(value))
      ? undefined
      : Number(value),
  z.number({ error: 'Nilai tidak valid.' }).min(0, 'Tidak boleh negatif.').optional(),
);

const optionalPercent = z.preprocess(
  (value) =>
    value === '' ||
    value === null ||
    value === undefined ||
    (typeof value === 'number' && Number.isNaN(value))
      ? undefined
      : Number(value),
  z
    .number({ error: 'Nilai tidak valid.' })
    .min(0, 'Tidak boleh negatif.')
    .max(100, 'Maksimal 100%.')
    .optional(),
);

export const employeeSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.'),
  jobTitle: z.string().trim().max(100, 'Jabatan maksimal 100 karakter.').optional(),
  phone: z.string().trim().max(20, 'Nomor HP maksimal 20 karakter.').optional(),
  role: z.enum(EMPLOYEE_ROLES),
  pin: z.string(),
  payType: z.enum(PAY_TYPES),
  baseSalary: optionalMoney,
  shiftRate: optionalMoney,
  commissionRate: optionalPercent,
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

/** BE stores only the hash; a new employee needs a PIN, edits leave it blank. */
export function pinError(pin: string, required: boolean): string | null {
  if (required && pin.trim() === '') return 'PIN wajib diisi.';
  if (pin.trim() !== '' && pin.trim().length < 4) return 'PIN minimal 4 digit.';
  return null;
}

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

export function EmployeeFormModal({
  employee,
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  employee: Employee | null;
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
}) {
  const editing = employee !== null;
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name ?? '',
      jobTitle: employee?.jobTitle ?? '',
      phone: employee?.phone ?? '',
      role: (employee?.role as EmployeeFormValues['role']) ?? 'cashier',
      pin: '',
      payType: employee?.payType ?? 'monthly',
      baseSalary: employee?.baseSalary ?? undefined,
      shiftRate: employee?.shiftRate ?? undefined,
      commissionRate: employee?.commissionRate ?? undefined,
    },
  });

  const payType = useWatch({ control, name: 'payType' });

  return (
    <Overlay
      title={editing ? 'Edit Karyawan' : 'Tambah Karyawan'}
      subtitle={editing ? employee?.name : 'Kasir, supervisor, manajer, atau chef.'}
      onClose={onClose}
    >
      <form
        noValidate
        className="space-y-1"
        onSubmit={handleSubmit((values) => {
          const pinProb = pinError(values.pin, !editing);
          if (pinProb) {
            setError('pin', { message: pinProb });
            return;
          }
          onSubmit(values);
        })}
      >
        <div>
          <label htmlFor="e-name" className={labelCls}>
            Nama
          </label>
          <input
            id="e-name"
            {...register('name')}
            autoFocus
            aria-invalid={!!errors.name}
            className={inputCls}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <label htmlFor="e-jobtitle" className={labelCls}>
            Jabatan <span className="normal-case">(opsional)</span>
          </label>
          <input
            id="e-jobtitle"
            {...register('jobTitle')}
            placeholder="Barista, Satpam, …"
            aria-invalid={!!errors.jobTitle}
            className={inputCls}
          />
          <FieldError message={errors.jobTitle?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="e-phone" className={labelCls}>
              Nomor HP
            </label>
            <input
              id="e-phone"
              {...register('phone')}
              placeholder="0812…"
              aria-invalid={!!errors.phone}
              className={inputCls}
            />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <label htmlFor="e-role" className={labelCls}>
              Peran
            </label>
            <select
              id="e-role"
              {...register('role')}
              className={inputCls}
            >
              {EMPLOYEE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {EMPLOYEE_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <FieldError message={errors.role?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="e-paytype" className={labelCls}>
              Skema Gaji
            </label>
            <select
              id="e-paytype"
              {...register('payType')}
              className={inputCls}
            >
              {PAY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PAY_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <FieldError message={errors.payType?.message} />
          </div>
          {payType === 'per_shift' ? (
            <div>
              <label htmlFor="e-shift-rate" className={labelCls}>
                Tarif / Shift
              </label>
              <input
                id="e-shift-rate"
                type="number"
                min={0}
                step={1000}
                placeholder="50000"
                {...register('shiftRate')}
                aria-invalid={!!errors.shiftRate}
                className={inputCls}
              />
              <FieldError message={errors.shiftRate?.message} />
            </div>
          ) : (
            <div>
              <label htmlFor="e-base-salary" className={labelCls}>
                Gaji Pokok / Bulan
              </label>
              <input
                id="e-base-salary"
                type="number"
                min={0}
                step={1000}
                placeholder="3000000"
                {...register('baseSalary')}
                aria-invalid={!!errors.baseSalary}
                className={inputCls}
              />
              <FieldError message={errors.baseSalary?.message} />
              {payType === 'hourly' && (
                <p className="-mt-2 text-[11px] text-lp-tertiary">
                  Dibayar per jam: gaji ÷ 173 × jam kerja.
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="e-commission" className={labelCls}>
            Komisi dari Omzet (%)
          </label>
          <input
            id="e-commission"
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="0"
            {...register('commissionRate')}
            aria-invalid={!!errors.commissionRate}
            className={inputCls}
          />
          <FieldError message={errors.commissionRate?.message} />
        </div>

        <div>
          <label htmlFor="e-pin" className={labelCls}>
            PIN Kasir {editing && <span className="normal-case">(kosongkan bila tidak diubah)</span>}
          </label>
          <input
            id="e-pin"
            {...register('pin')}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={!!errors.pin}
            className={inputCls}
          />
          <FieldError message={errors.pin?.message} />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-1 rounded-lg border border-lp-error-container bg-lp-error-container px-3 py-2 text-xs font-medium text-lp-on-error-container"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-lp-primary px-5 py-2.5 text-sm font-bold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="check" className="text-[18px]" />
            {pending ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Tambah'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
