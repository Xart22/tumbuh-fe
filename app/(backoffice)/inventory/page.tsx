import type { Metadata } from 'next';
import { jetbrainsMono, plusJakarta } from '@/lib/fonts';
import { OwnerShell } from '../dashboard/owner-shell';
import { InventoryView } from './inventory-view';

export const metadata: Metadata = { title: 'Inventori & Stok · Tumbuh POS' };

export default function InventoryPage() {
  return (
    <div className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <OwnerShell>
        <InventoryView />
      </OwnerShell>
    </div>
  );
}
