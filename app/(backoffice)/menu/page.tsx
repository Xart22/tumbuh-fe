import type { Metadata } from 'next';
import { jetbrainsMono, plusJakarta } from '@/lib/fonts';
import { OwnerShell } from '../dashboard/owner-shell';
import { MenuView } from './menu-view';

export const metadata: Metadata = { title: 'Manajemen Menu · Tumbuh POS' };

export default function MenuPage() {
  return (
    <div className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <OwnerShell>
        <MenuView />
      </OwnerShell>
    </div>
  );
}
