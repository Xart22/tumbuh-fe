'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { DropdownSearch } from '@/components/ui/dropdown-search';
import type { Employee } from '@/lib/types';
import { Overlay } from '@/components/overlay';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleSchema = z
  .object({
    employeeId: z.string().min(1, 'Karyawan wajib dipilih.'),
    scheduleDate: z.string().min(1, 'Tanggal wajib diisi.'),
    startTime: z.string().regex(TIME_RE, 'Format HH:MM.'),
    endTime: z.string().regex(TIME_RE, 'Format HH:MM.'),
    notes: z.string().trim().max(200, 'Catatan maksimal 200 karakter.').optional(),
  })
  .refine((values) => values.startTime < values.endTime, {
    message: 'Jam mulai harus sebelum jam selesai.',
    path: ['endTime'],
  });

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;

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

export function ScheduleFormModal({
  employees,
  defaultDate,
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  employees: Employee[];
  defaultDate: string;
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: ScheduleFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      employeeId: employees[0]?.id ?? '',
      scheduleDate: defaultDate,
      startTime: '09:00',
      endTime: '17:00',
      notes: '',
    },
  });

  const employeeId = useWatch({ control, name: 'employeeId' }) ?? '';
  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: emp.name,
    badge: emp.role,
    subLabel: emp.phone ? `Tel: ${emp.phone}` : undefined,
  }));

  return (
    <Overlay
      title="Jadwal Shift"
      subtitle="Satu karyawan satu jadwal per tanggal."
      onClose={onClose}
    >
      <form
        noValidate
        className="space-y-1"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <div>
          <label htmlFor="sc-emp" className={labelCls}>
            Karyawan
          </label>
          <DropdownSearch
            id="sc-emp"
            value={employeeId}
            onChange={(val) =>
              setValue('employeeId', val, { shouldValidate: true })
            }
            placeholder="Pilih karyawan…"
            searchPlaceholder="Cari karyawan / role…"
            options={employeeOptions}
          />
          <FieldError message={errors.employeeId?.message} />
        </div>

        <div>
          <label htmlFor="sc-date" className={labelCls}>
            Tanggal
          </label>
          <input
            id="sc-date"
            {...register('scheduleDate')}
            type="date"
            aria-invalid={!!errors.scheduleDate}
            className={inputCls}
          />
          <FieldError message={errors.scheduleDate?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sc-start" className={labelCls}>
              Mulai
            </label>
            <input
              id="sc-start"
              {...register('startTime')}
              type="time"
              aria-invalid={!!errors.startTime}
              className={inputCls}
            />
            <FieldError message={errors.startTime?.message} />
          </div>
          <div>
            <label htmlFor="sc-end" className={labelCls}>
              Selesai
            </label>
            <input
              id="sc-end"
              {...register('endTime')}
              type="time"
              aria-invalid={!!errors.endTime}
              className={inputCls}
            />
            <FieldError message={errors.endTime?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="sc-notes" className={labelCls}>
            Catatan (opsional)
          </label>
          <input
            id="sc-notes"
            {...register('notes')}
            placeholder="Shift pagi, bar"
            className={inputCls}
          />
          <FieldError message={errors.notes?.message} />
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
            <Icon name="event_available" className="text-[18px]" />
            {pending ? 'Menyimpan…' : 'Simpan Jadwal'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
