'use client';

import { useState } from 'react';
import { Icon } from './icon';
import { Button, Input } from './pos-ui';
import type { OrderType } from '@/lib/types';

const PLACEHOLDERS: Record<OrderType, string> = {
  dine_in: 'Nomor meja, mis. Meja 05',
  take_away: 'Nama pesanan / tamu, mis. Kak Siska',
  delivery: 'Nama pelanggan / ojol, mis. GrabFood',
};

/** Modal to label a parked (held) order before sending it to the server. */
export function ParkOrderModal({
  orderType,
  submitting,
  onCancel,
  onConfirm,
}: {
  orderType: OrderType;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: (label: string) => void;
}) {
  const [label, setLabel] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest shadow-2xl">
        <div className="flex items-center gap-2 border-b border-lp-outline-variant/20 px-4 py-3">
          <Icon name="bookmark" className="text-base text-lp-primary" />
          <h2 className="text-sm font-bold text-lp-on-surface">Parkir Pesanan</h2>
        </div>

        <form
          className="p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(label.trim());
          }}
        >
          <div>
            <label
              htmlFor="park-label"
              className="mb-1 block text-xs font-semibold text-lp-on-surface-variant"
            >
              {orderType === 'dine_in' ? 'Nomor meja' : 'Nama pelanggan'}
            </label>
            <Input
              id="park-label"
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={PLACEHOLDERS[orderType]}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onCancel}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              <Icon name="bookmark_add" className="text-sm" />
              <span>{submitting ? 'Menyimpan…' : 'Parkir'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
