import type { Metadata } from 'next';
import { OwnerShell } from '../dashboard/owner-shell';
import { FinanceView } from './finance-view';

export const metadata: Metadata = { title: 'Keuangan · Tumbuh POS' };

export default function FinancePage() {
  return (
    <OwnerShell>
      <FinanceView />
    </OwnerShell>
  );
}
