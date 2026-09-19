'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { announcements } from '@/lib/api';

function severityColor(severity?: string): string {
  if (severity === 'critical' || severity === 'error') return 'bg-lp-error';
  if (severity === 'warning') return 'bg-lp-secondary-container';
  return 'bg-lp-primary';
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: items = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: announcements,
  });

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifikasi"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-lp-on-surface-variant transition-colors hover:bg-lp-surface-container hover:text-lp-on-surface"
      >
        <Icon name="notifications" className="text-[22px]" />
        {items.length > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-lp-error" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-lp-surface-container bg-lp-surface-container-lowest shadow-md">
          <div className="flex items-center justify-between border-b border-lp-surface-container px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-on-surface-variant">
              Pengumuman
            </span>
            <span className="text-[11px] text-lp-tertiary">{items.length}</span>
          </div>
          <div className="flex max-h-80 flex-col overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-4 text-xs text-lp-on-surface-variant">
                Belum ada pengumuman.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 border-b border-lp-surface-container px-3 py-2 last:border-b-0"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-lp-on-surface">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${severityColor(item.severity)}`}
                    />
                    {item.title}
                  </span>
                  <span className="text-[11px] leading-relaxed text-lp-on-surface-variant">
                    {item.body}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
