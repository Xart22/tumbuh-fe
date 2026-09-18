import { AuthGate } from '@/components/auth-gate';
import { ReportsDashboard } from './reports-dashboard';

export const metadata = { title: 'Laporan · Tumbuh POS' };

export default function ReportsPage() {
  return (
    <AuthGate>
      <ReportsDashboard />
    </AuthGate>
  );
}
