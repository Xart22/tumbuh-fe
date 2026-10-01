import type { Metadata } from 'next';
import { EmployeesView } from './employees-view';

export const metadata: Metadata = { title: 'Karyawan & Shift · Tumbuh POS' };

export default function EmployeesPage() {
  return <EmployeesView />;
}
