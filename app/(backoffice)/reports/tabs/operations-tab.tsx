'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { byOrderType, byTable, cashierSales, employeeSales, hourlySales, payroll } from '@/lib/api';
import { formatIDR, formatNumber, monthISO } from '@/lib/format';
import {
  PAY_TYPE_LABELS,
  type ByOrderTypeReport,
  type HourlySalesRow,
} from '@/lib/types';
import { Section, DataTable } from '../reports-primitives';
import type { Range } from '../report-utils';
import { ORDER_TYPE_LABELS } from '../report-utils';

function CashierTab({ applied }: { applied: Range }) {
  const byCashierQ = useQuery({
    queryKey: ['reports', 'by-cashier', applied.dateFrom, applied.dateTo],
    queryFn: () => cashierSales(applied.dateFrom, applied.dateTo),
  });
  const employeeQ = useQuery({
    queryKey: ['reports', 'employee-sales', applied.dateFrom, applied.dateTo],
    queryFn: () => employeeSales(applied.dateFrom, applied.dateTo),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-lp-on-surface">
          Penjualan per Kasir
        </h2>
        <Section
          q={byCashierQ}
          render={(rows) =>
            rows.length === 0 ? (
              <p className="text-sm text-lp-tertiary">Belum ada data penjualan kasir pada rentang ini.</p>
            ) : (
              <DataTable
                head={['Kasir', 'Transaksi', 'Omzet']}
                align={['left', 'right', 'right']}
                rows={rows.map((row) => [
                  row.cashier,
                  formatNumber(row.orderCount),
                  formatIDR(row.revenue),
                ])}
              />
            )
          }
        />
      </div>

      <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-lp-on-surface">
          Kinerja Detail Karyawan
        </h2>
        <Section
          q={employeeQ}
          render={(data) =>
            data.employees.length === 0 ? (
              <p className="text-sm text-lp-tertiary">Belum ada data kinerja karyawan.</p>
            ) : (
              <DataTable
                head={['Nama', 'Transaksi', 'Lunas', 'Bruto', 'Diskon', 'Netto']}
                align={['left', 'right', 'right', 'right', 'right', 'right']}
                rows={data.employees.map((row) => [
                  row.cashierName,
                  formatNumber(row.orderCount),
                  formatNumber(row.paidOrders),
                  formatIDR(row.grossSales),
                  formatIDR(row.discountAmount),
                  formatIDR(row.netSales),
                ])}
              />
            )
          }
        />
      </div>
    </div>
  );
}

function OpsTab({ applied }: { applied: Range }) {
  const hourlyQ = useQuery({
    queryKey: ['reports', 'hourly-ops', applied.dateTo],
    queryFn: () => hourlySales(applied.dateTo),
  });
  const typeQ = useQuery({
    queryKey: ['reports', 'by-order-type', applied.dateFrom, applied.dateTo],
    queryFn: () => byOrderType(applied.dateFrom, applied.dateTo),
  });
  const tableQ = useQuery({
    queryKey: ['reports', 'by-table', applied.dateFrom, applied.dateTo],
    queryFn: () => byTable(applied.dateFrom, applied.dateTo),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-lp-on-surface">Distribusi Penjualan per Jam ({applied.dateTo})</h2>
        <Section
          q={hourlyQ}
          render={(buckets: HourlySalesRow[]) =>
            buckets.length === 0 ? (
              <p className="text-sm text-lp-tertiary">Belum ada data penjualan per jam pada tanggal ini.</p>
            ) : (
              <DataTable
                head={['Jam', 'Jumlah Pesanan', 'Total Penjualan']}
                align={['left', 'right', 'right']}
                rows={buckets.map((b) => [
                  `${String(b.hour).padStart(2, '0')}:00 - ${String(b.hour + 1).padStart(2, '0')}:00`,
                  `${formatNumber(b.orders ?? 0)} Transaksi`,
                  formatIDR(b.revenue ?? 0),
                ])}
              />
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-lp-on-surface">Distribusi Tipe Pesanan</h2>
          <Section
            q={typeQ}
            render={(data: ByOrderTypeReport) =>
              data.items.length === 0 ? (
                <p className="text-sm text-lp-tertiary">Belum ada data tipe pesanan.</p>
              ) : (
                <DataTable
                  head={['Tipe Pesanan', 'Transaksi', 'Omzet', 'Porsi']}
                  align={['left', 'right', 'right', 'right']}
                  rows={data.items.map((row) => [
                    row.orderType ? (ORDER_TYPE_LABELS[row.orderType] ?? row.orderType) : 'Dine-In',
                    formatNumber(row.orderCount),
                    formatIDR(row.revenue),
                    `${row.sharePct.toFixed(1)}%`,
                  ])}
                />
              )
            }
          />
        </div>

        <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-lp-on-surface">Penjualan per Meja &amp; Area</h2>
          <Section
            q={tableQ}
            render={(data) =>
              data.items.length === 0 ? (
                <p className="text-sm text-lp-tertiary">Belum ada data transaksi meja.</p>
              ) : (
                <DataTable
                  head={['Meja', 'Transaksi', 'Omzet', 'Rata-rata']}
                  align={['left', 'right', 'right', 'right']}
                  rows={data.items.map((row) => [
                    row.tableName,
                    formatNumber(row.orderCount),
                    formatIDR(row.revenue),
                    formatIDR(row.averageSpend),
                  ])}
                />
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

function PayrollTab() {
  const [month, setMonth] = useState(monthISO());
  const q = useQuery({
    queryKey: ['reports', 'payroll', month],
    queryFn: () => payroll(month),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-lp-tertiary">Pilih Bulan Payroll:</span>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-10 rounded-lg border border-lp-surface-container bg-lp-surface-low px-3 text-xs font-semibold text-lp-on-surface focus:outline-none focus:ring-2 focus:ring-lp-primary"
        />
      </div>

      <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-lp-on-surface">Rekap Penggajian Karyawan ({month})</h2>
        <Section
          q={q}
          render={(rows) =>
            rows.length === 0 ? (
              <p className="text-sm text-lp-tertiary">Belum ada data payroll untuk bulan ini.</p>
            ) : (
              <DataTable
                head={['Nama Karyawan', 'Skema Gaji', 'Shift', 'Jam Kerja', 'Gaji Pokok', 'Komisi', 'Total Gaji']}
                align={['left', 'left', 'right', 'right', 'right', 'right', 'right']}
                rows={rows.map((row) => [
                  row.employeeName,
                  row.payType === 'per_shift'
                    ? `${PAY_TYPE_LABELS[row.payType]} (${formatIDR(row.shiftRate)}/shift)`
                    : PAY_TYPE_LABELS[row.payType],
                  formatNumber(row.shiftCount),
                  formatNumber(row.hours),
                  formatIDR(row.timePay),
                  formatIDR(row.commission),
                  formatIDR(row.grossPay),
                ])}
              />
            )
          }
        />
      </div>
    </div>
  );
}

export function OperationsTab({ applied }: { applied: Range }) {
  return (
    <div className="flex flex-col gap-6">
      <CashierTab applied={applied} />
      <OpsTab applied={applied} />
      <PayrollTab />
    </div>
  );
}