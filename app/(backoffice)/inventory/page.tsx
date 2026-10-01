import type { Metadata } from 'next';
import { InventoryView } from './inventory-view';

export const metadata: Metadata = { title: 'Inventori & Stok · Tumbuh POS' };

export default function InventoryPage() {
  return <InventoryView />;
}
