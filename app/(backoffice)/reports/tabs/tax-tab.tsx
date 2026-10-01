'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taxSummary } from '@/lib/api';
import { formatIDR, formatNumber, monthISO } from '@/lib/format';
import { Section, MetricCard, DataTable } from '../reports-primitives';

export function TaxTab() {
  const [month, setMonth] = useState(monthISO());
  const q = useQuery({
    queryKey: ['reports', 'tax-summary', month],
    queryFn: () => taxSummary(month),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-lp-tertiary">Pilih Bulan Pembukuan:</span>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-10 rounded-lg border border-lp-surface-container bg-lp-surface-low px-3 text-xs font-semibold text-lp-on-surface focus:outline-none focus:ring-2 focus:ring-lp-primary"
        />
      </div>

      <div className="rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-lp-on-surface">
          Rekap Pajak Restoran &amp; PPN ({month})
        </h2>
        <Section
          q={q}
          render={(data) => (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Order lunas" value={formatNumber(data.paidOrderCount)} />
                <MetricCard label="Omzet bruto" value={formatIDR(data.grossRevenue)} />
                <MetricCard label="Pajak Dipungut (PB1/PPN)" value={formatIDR(data.vatCollected)} />
                <MetricCard label={`PPh final ${data.pphFinalRate}%`} value={formatIDR(data.pphFinal)} />
              </div>
              {data.taxInvoices.length > 0 && (
                <div className="mt-2">
                  <DataTable
                    head={['No. Faktur Pajak', 'Nominal Pajak', 'Status']}
                    align={['left', 'right', 'left']}
                    rows={data.taxInvoices.map((inv) => [
                      inv.invoiceNumber,
                      formatIDR(inv.taxAmount),
                      inv.status,
                    ])}
                  />
                </div>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}
