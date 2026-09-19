import { AppNav } from '@/components/app-nav';
import { ReportsDashboard } from './reports-dashboard';

export const metadata = { title: 'Laporan · Tumbuh POS' };

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <div className="flex-1">
        <ReportsDashboard />
      </div>
    </div>
  );
}
