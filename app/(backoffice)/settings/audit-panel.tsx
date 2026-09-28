'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@/lib/api';
import { todayISO } from '@/lib/format';

const inputCls =
  'h-10 rounded-lg border border-lp-outline-variant bg-lp-surface-container-lowest px-3 text-sm font-medium text-lp-on-surface outline-none focus:border-lp-primary';

export function AuditPanel() {
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(todayISO());
  const [limit, setLimit] = useState(50);

  const q = useQuery({
    queryKey: ['audit-logs', entity, action, dateFrom, dateTo, limit],
    queryFn: () =>
      listAuditLogs({
        entity: entity || undefined,
        action: action || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit,
      }),
  });
  const rows = q.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-lp-on-surface-variant">
          Entity
          <input
            value={entity}
            onChange={(event) => setEntity(event.target.value)}
            placeholder="orders"
            aria-label="Filter entity"
            className={`ml-2 ${inputCls}`}
          />
        </label>
        <label className="text-xs font-semibold text-lp-on-surface-variant">
          Action
          <input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="VOID"
            aria-label="Filter action"
            className={`ml-2 ${inputCls}`}
          />
        </label>
        <label className="text-xs font-semibold text-lp-on-surface-variant">
          Dari
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className={`ml-2 ${inputCls}`}
          />
        </label>
        <label className="text-xs font-semibold text-lp-on-surface-variant">
          Sampai
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className={`ml-2 ${inputCls}`}
          />
        </label>
        <label className="text-xs font-semibold text-lp-on-surface-variant">
          Limit
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className={`ml-2 ${inputCls}`}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>
      </div>

      {q.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : q.isError ? (
        <p className="text-sm text-lp-error">
          {q.error instanceof Error
            ? q.error.message
            : 'Gagal memuat audit log.'}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Tidak ada aktivitas pada filter ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                <th className="pb-2">Waktu</th>
                <th className="pb-2">Aktor</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Entity</th>
                <th className="pb-2">Ref</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-lp-surface-container">
                  <td className="py-2 font-lp-mono text-xs text-lp-on-surface-variant">
                    {new Date(row.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2 text-lp-on-surface">
                    {row.actorName ?? row.actorEmail ?? row.actorRole ?? '—'}
                  </td>
                  <td className="py-2">
                    <span className="rounded bg-lp-surface-container-high px-2 py-0.5 font-lp-mono text-[11px] font-semibold text-lp-on-surface">
                      {row.action}
                    </span>
                  </td>
                  <td className="py-2 text-lp-on-surface-variant">
                    {row.entity}
                  </td>
                  <td className="py-2 font-lp-mono text-[11px] text-lp-tertiary">
                    {row.entityId ? row.entityId.slice(0, 8) : '—'}
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
