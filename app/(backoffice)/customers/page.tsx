import type { Metadata } from 'next';
import { OwnerShell } from '../dashboard/owner-shell';
import { CustomersView } from './customers-view';

export const metadata: Metadata = { title: 'Pelanggan & CRM · Tumbuh POS' };

export default function CustomersPage() {
  return (
    <OwnerShell>
      <CustomersView />
    </OwnerShell>
  );
}
