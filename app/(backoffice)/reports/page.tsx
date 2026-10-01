import type { Metadata } from 'next';
import { ReportsDashboard } from './reports-dashboard';

export const metadata: Metadata = {
  title: 'Laporan & Analytics · Tumbuh POS',
};

export default function ReportsPage() {
  return <ReportsDashboard />;
}
