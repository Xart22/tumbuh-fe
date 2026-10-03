/**
 * Routes that exist today; `SOON` entries are reference nav still unbuilt.
 * `roles` scopes an entry — undefined = every backoffice role.
 */
export const NAV: Array<{
  href: string;
  label: string;
  icon: string;
  roles?: readonly string[];
}> = [
  { href: '/dashboard', label: 'Dashboard Utama', icon: 'grid_view', roles: ['owner', 'manager'] },
  { href: '/menu', label: 'Manajemen Menu', icon: 'restaurant_menu', roles: ['owner', 'manager', 'supervisor'] },
  { href: '/tables', label: 'Denah Meja & Area', icon: 'table_restaurant', roles: ['owner', 'manager'] },
  { href: '/inventory', label: 'Inventori & Stok', icon: 'inventory_2', roles: ['owner', 'manager', 'supervisor'] },
  { href: '/employees', label: 'Karyawan & Shift', icon: 'badge', roles: ['owner', 'manager'] },
  { href: '/customers', label: 'Pelanggan & CRM', icon: 'loyalty', roles: ['owner', 'manager'] },
  { href: '/reports', label: 'Laporan & Analytics', icon: 'query_stats', roles: ['owner', 'manager'] },
  { href: '/finance', label: 'Keuangan', icon: 'account_balance_wallet', roles: ['owner', 'manager'] },
  { href: '/settings', label: 'Pengaturan Outlet', icon: 'settings', roles: ['owner', 'manager'] },
  { href: '/outlets', label: 'Multi-Outlet', icon: 'hub', roles: ['owner', 'manager'] },
  { href: '/pos', label: 'Kasir POS', icon: 'point_of_sale', roles: ['owner', 'manager', 'supervisor'] },
];

export const SOON: Array<{ label: string; icon: string }> = [];
