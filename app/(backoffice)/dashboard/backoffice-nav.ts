/** Routes that exist today; `SOON` entries are reference nav still unbuilt. */
export const NAV: Array<{ href: string; label: string; icon: string }> = [
  { href: '/dashboard', label: 'Dashboard Utama', icon: 'grid_view' },
  { href: '/menu', label: 'Manajemen Menu', icon: 'restaurant_menu' },
  { href: '/inventory', label: 'Inventori & Stok', icon: 'inventory_2' },
  { href: '/employees', label: 'Karyawan & Shift', icon: 'badge' },
  { href: '/customers', label: 'Pelanggan & CRM', icon: 'loyalty' },
  { href: '/reports', label: 'Laporan & Analytics', icon: 'query_stats' },
  { href: '/finance', label: 'Keuangan', icon: 'account_balance_wallet' },
  { href: '/pos', label: 'Kasir POS', icon: 'point_of_sale' },
];

export const SOON: Array<{ label: string; icon: string }> = [
  { label: 'Pesanan & Meja', icon: 'table_restaurant' },
  { label: 'Pengaturan Outlet', icon: 'storefront' },
];
