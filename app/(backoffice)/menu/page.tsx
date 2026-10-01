import type { Metadata } from 'next';
import { MenuView } from './menu-view';

export const metadata: Metadata = { title: 'Manajemen Menu · Tumbuh POS' };

export default function MenuPage() {
  return <MenuView />;
}
