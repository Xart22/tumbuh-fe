/** Routes that exist today; `SOON` entries are reference nav still unbuilt. */
export const NAV: Array<{ href: string; label: string; icon: string }> = [
  { href: '/dashboard', label: 'Dashboard Utama', icon: 'grid_view' },
  { href: '/reports', label: 'Laporan & Analytics', icon: 'query_stats' },
  { href: '/pos', label: 'Kasir POS', icon: 'point_of_sale' },
];

export const SOON: Array<{ label: string; icon: string }> = [
  { label: 'Manajemen Menu', icon: 'restaurant_menu' },
  { label: 'Pesanan & Meja', icon: 'table_restaurant' },
  { label: 'Inventori & Stok', icon: 'inventory_2' },
  { label: 'Karyawan & Kasir', icon: 'badge' },
  { label: 'Pengaturan Outlet', icon: 'storefront' },
];
