import type { TenantModuleKey } from '@/lib/types';

/**
 * Routes that exist today; `SOON` entries are reference nav still unbuilt.
 * `roles` scopes an entry — undefined = every backoffice role.
 * `module` gates an entry behind an optional tenant module; core areas leave
 * it undefined and are always shown.
 */
export const NAV: Array<{
  href: string;
  label: string;
  icon: string;
  roles?: readonly string[];
  module?: TenantModuleKey;
}> = [
  { href: '/dashboard', label: 'Dashboard Utama', icon: 'grid_view', roles: ['owner', 'manager'] },
  { href: '/menu', label: 'Manajemen Menu', icon: 'restaurant_menu', roles: ['owner', 'manager', 'supervisor'] },
  { href: '/tables', label: 'Denah Meja & Area', icon: 'table_restaurant', roles: ['owner', 'manager'] },
  { href: '/inventory', label: 'Inventori & Stok', icon: 'inventory_2', roles: ['owner', 'manager', 'supervisor'], module: 'inventory' },
  { href: '/employees', label: 'Karyawan & Shift', icon: 'badge', roles: ['owner', 'manager'], module: 'shifts' },
  { href: '/customers', label: 'Pelanggan & CRM', icon: 'loyalty', roles: ['owner', 'manager'], module: 'loyalty' },
  { href: '/reports', label: 'Laporan & Analytics', icon: 'query_stats', roles: ['owner', 'manager'] },
  { href: '/finance', label: 'Keuangan', icon: 'account_balance_wallet', roles: ['owner', 'manager'], module: 'accounting' },
  { href: '/settings', label: 'Pengaturan Outlet', icon: 'settings', roles: ['owner', 'manager'] },
  { href: '/outlets', label: 'Multi-Outlet', icon: 'hub', roles: ['owner', 'manager'], module: 'multi_outlet' },
  { href: '/pos', label: 'Kasir POS', icon: 'point_of_sale', roles: ['owner', 'manager', 'supervisor'] },
];

export const SOON: Array<{ label: string; icon: string }> = [];
