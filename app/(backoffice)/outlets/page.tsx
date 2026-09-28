import type { Metadata } from 'next';
import { OwnerShell } from '../dashboard/owner-shell';
import { OutletsView } from './outlets-view';

export const metadata: Metadata = { title: 'Multi-Outlet · Tumbuh POS' };

export default function OutletsPage() {
  return (
    <OwnerShell>
      <OutletsView />
    </OwnerShell>
  );
}
