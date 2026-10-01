import type { Metadata } from 'next';
import { OutletsView } from './outlets-view';

export const metadata: Metadata = { title: 'Multi-Outlet · Tumbuh POS' };

export default function OutletsPage() {
  return <OutletsView />;
}
