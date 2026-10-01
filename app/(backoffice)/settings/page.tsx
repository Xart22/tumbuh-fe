import type { Metadata } from 'next';
import { SettingsView } from './settings-view';

export const metadata: Metadata = { title: 'Pengaturan Outlet · Tumbuh POS' };

export default function SettingsPage() {
  return <SettingsView />;
}
