import type { Metadata } from 'next';
import { CustomersView } from './customers-view';

export const metadata: Metadata = { title: 'Pelanggan & CRM · Tumbuh POS' };

export default function CustomersPage() {
  return <CustomersView />;
}
