'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { Overlay } from '@/components/overlay';
import {
  createPrinter,
  deletePrinter,
  listPrinters,
  testPrinter,
} from '@/lib/api';
import {
  PRINTER_CONNECTIONS,
  PRINTER_TYPES,
  type Printer,
} from '@/lib/types';

export const printerSchema = z.object({
  name: z.string().trim().min(1, 'Nama printer wajib diisi.'),
  type: z.enum(PRINTER_TYPES),
  connection: z.enum(PRINTER_CONNECTIONS),
  address: z.string().trim().max(255, 'Alamat maksimal 255 karakter.').optional(),
  paperWidth: z
    .number({ error: 'Lebar kertas wajib diisi.' })
    .int()
    .min(1, 'Minimal 1.')
    .max(200, 'Maksimal 200.'),
  station: z.string().trim().max(50, 'Stasiun maksimal 50 karakter.').optional(),
});

export type PrinterFormValues = z.infer<typeof printerSchema>;

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

const TYPE_LABEL: Record<string, string> = {
  thermal: 'Thermal (struk)',
  kitchen: 'Kitchen (tiket)',
};

const CONNECTION_LABEL: Record<string, string> = {
  usb: 'USB',
  lan: 'LAN',
  bluetooth: 'Bluetooth',
};

export function PrinterPanel() {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ['printers'], queryFn: listPrinters });
  const printers = q.data?.printers ?? [];
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tested, setTested] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['printers'] });

  const createM = useMutation({
    mutationFn: (values: PrinterFormValues) =>
      createPrinter({
        name: values.name.trim(),
        type: values.type,
        connection: values.connection,
        address: values.address?.trim() || undefined,
        paperWidth: values.paperWidth,
        station: values.station?.trim() || undefined,
      }),
    onSuccess: () => {
      setShowForm(false);
      setError(null);
      void invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menambah printer.'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deletePrinter(id),
    onSuccess: () => void invalidate(),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menghapus printer.'),
  });

  const testM = useMutation({
    mutationFn: (id: string) => testPrinter(id),
    onSuccess: (result) => {
      setError(null);
      setTested(result.message);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal test print.'),
  });

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {error}
        </p>
      )}
      {tested && (
        <p className="text-xs font-medium text-lp-primary">{tested}</p>
      )}

      {q.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : printers.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">Belum ada printer.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                <th className="pb-2">Nama</th>
                <th className="pb-2">Tipe</th>
                <th className="pb-2">Koneksi</th>
                <th className="pb-2">Alamat</th>
                <th className="pb-2 text-center">Lebar</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {printers.map((printer) => (
                <PrinterRow
                  key={printer.id}
                  printer={printer}
                  onDelete={() => deleteM.mutate(printer.id)}
                  onTest={() => testM.mutate(printer.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setError(null);
          setShowForm(true);
        }}
        className="flex h-10 w-fit items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary"
      >
        <Icon name="add" className="text-[16px]" />
        Tambah Printer
      </button>

      {showForm && (
        <Overlay title="Tambah Printer" onClose={() => setShowForm(false)}>
          <PrinterForm
            pending={createM.isPending}
            errorMessage={error}
            onClose={() => setShowForm(false)}
            onSubmit={(values) => createM.mutate(values)}
          />
        </Overlay>
      )}
    </div>
  );
}

function PrinterRow({
  printer,
  onDelete,
  onTest,
}: {
  printer: Printer;
  onDelete: () => void;
  onTest: () => void;
}) {
  return (
    <tr className="border-t border-lp-surface-container">
      <td className="py-2.5 font-semibold text-lp-on-surface">{printer.name}</td>
      <td className="py-2.5 text-lp-on-surface-variant">
        {TYPE_LABEL[printer.type] ?? printer.type}
      </td>
      <td className="py-2.5 text-lp-on-surface-variant">
        {CONNECTION_LABEL[printer.connection] ?? printer.connection}
      </td>
      <td className="py-2.5 font-lp-mono text-lp-on-surface-variant">
        {printer.address ?? '—'}
      </td>
      <td className="py-2.5 text-center font-lp-mono text-lp-on-surface-variant">
        {printer.paperWidth}mm
      </td>
      <td className="py-2.5">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onTest}
            className="rounded-lg bg-lp-surface-container-high px-2.5 py-1 text-xs font-semibold text-lp-on-surface"
          >
            Test
          </button>
          <button
            type="button"
            aria-label="Hapus printer"
            onClick={() => {
              if (window.confirm(`Hapus printer ${printer.name}?`)) onDelete();
            }}
            className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container"
          >
            <Icon name="delete" className="text-[18px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function PrinterForm({
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: PrinterFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrinterFormValues>({
    resolver: zodResolver(printerSchema),
    defaultValues: {
      name: '',
      type: 'thermal',
      connection: 'usb',
      address: '',
      paperWidth: 58,
      station: '',
    },
  });

  return (
    <form
      noValidate
      className="space-y-1"
      onSubmit={handleSubmit((values) => onSubmit(values))}
    >
      <div>
        <label htmlFor="pr-name" className={labelCls}>
          Nama
        </label>
        <input
          id="pr-name"
          {...register('name')}
          autoFocus
          aria-invalid={!!errors.name}
          className={inputCls}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pr-type" className={labelCls}>
            Tipe
          </label>
          <select id="pr-type" {...register('type')} className={inputCls}>
            <option value="thermal">Thermal (struk)</option>
            <option value="kitchen">Kitchen (tiket)</option>
          </select>
          <FieldError message={errors.type?.message} />
        </div>
        <div>
          <label htmlFor="pr-conn" className={labelCls}>
            Koneksi
          </label>
          <select
            id="pr-conn"
            {...register('connection')}
            className={inputCls}
          >
            <option value="usb">USB</option>
            <option value="lan">LAN</option>
            <option value="bluetooth">Bluetooth</option>
          </select>
          <FieldError message={errors.connection?.message} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pr-addr" className={labelCls}>
            Alamat / IP
          </label>
          <input
            id="pr-addr"
            {...register('address')}
            placeholder="192.168.1.50"
            className={inputCls}
          />
          <FieldError message={errors.address?.message} />
        </div>
        <div>
          <label htmlFor="pr-idth" className={labelCls}>
            Lebar kertas (mm)
          </label>
          <input
            id="pr-idth"
            {...register('paperWidth', { valueAsNumber: true })}
            type="number"
            min={1}
            step={1}
            aria-invalid={!!errors.paperWidth}
            className={inputCls}
          />
          <FieldError message={errors.paperWidth?.message} />
        </div>
      </div>

      <div>
        <label htmlFor="pr-station" className={labelCls}>
          Stasiun (opsional)
        </label>
        <input
          id="pr-station"
          {...register('station')}
          placeholder="bar / kitchen"
          className={inputCls}
        />
        <FieldError message={errors.station?.message} />
      </div>

      {errorMessage && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {errorMessage}
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
          type="submit"
          disabled={pending}
          className="rounded-lg bg-lp-primary px-5 py-2.5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
        >
          {pending ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}
