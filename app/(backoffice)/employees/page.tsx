import type { Metadata } from 'next';
import { OwnerShell } from '../dashboard/owner-shell';
import { EmployeesView } from './employees-view';

export const metadata: Metadata = { title: 'Karyawan & Shift · Tumbuh POS' };

export default function EmployeesPage() {
  return (
    <OwnerShell>
      <EmployeesView />
    </OwnerShell>
  );
}
