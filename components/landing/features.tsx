import { Icon } from '../icon';

const POS_MINI = [
  { icon: 'call_split', label: 'Split Bill & Gabung Meja' },
  { icon: 'wifi_off', label: 'Offline-Ready Sync' },
  { icon: 'print', label: 'Kitchen & Bar Printer' },
  { icon: 'qr_code_scanner', label: 'QRIS Dinamis BI' },
];

const CHECKS = [
  'Otorisasi PIN manajer khusus void, refund, dan diskon member.',
  'Kalkulasi Pajak Restoran (PB1 10%) & Service Charge otomatis di struk.',
  'Ekspor laporan keuangan siap audit format Excel & PDF satu klik.',
];

const OUTLET_CHECKS = [
  'Perbandingan omzet live, menu terlaris, dan performa per outlet.',
  'Transfer stok bahan baku antar cabang (Inter-branch transfer & PO Gudang).',
  'Kelola presensi kasir, jam lembur shift, dan komisi target staff.',
];

function FeatureShell({
  icon,
  iconClass,
  title,
  body,
  children,
}: {
  icon: string;
  iconClass: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-lp-surface-container bg-lp-surface-low p-8 transition-all hover:border-lp-primary/40">
      <div>
        <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ${iconClass}`}>
          <Icon name={icon} className="text-[26px]" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-lp-on-surface">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-lp-on-surface-variant">{body}</p>
        {children}
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="fitur-kuliner" className="scroll-mt-24 border-t border-lp-surface-container bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-lp-primary">
              Fitur Unggulan Spesifik F&amp;B
            </span>
            <h2 className="mt-2 text-2xl font-bold text-lp-on-surface sm:text-3xl lg:text-4xl">
              Dirancang Khusus Alur Operasional Restoran &amp; Barista
            </h2>
          </div>
          <p className="max-w-md text-sm text-lp-on-surface-variant">
            Menghubungkan kasir, waiter, dapur (kitchen display), hingga gudang pusat
            dalam satu alur kerja mulus tanpa miskomunikasi.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FeatureShell
            icon="point_of_sale"
            iconClass="bg-lp-primary text-white"
            title="Kasir POS Cepat & Tangguh (Offline Mode)"
            body="Transaksi kasir tetap berjalan lancar tanpa kendala meski koneksi internet terputus. Data otomatis tersinkron ke cloud saat online kembali."
          >
            <div className="grid grid-cols-2 gap-3 pt-2">
              {POS_MINI.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-xl border border-lp-surface-container bg-white p-3"
                >
                  <Icon name={item.icon} className="text-[18px] text-lp-primary" />
                  <span className="text-xs font-semibold text-lp-on-surface">{item.label}</span>
                </div>
              ))}
            </div>
          </FeatureShell>

          <FeatureShell
            icon="receipt_long"
            iconClass="bg-lp-secondary text-white"
            title="Inventori & Resep (BOM) HPP Otomatis"
            body="Kunci standar resep baku dan food cost. Masukkan takaran biji kopi, susu, bumbu saus hingga kemasan takeaway untuk kontrol margin maksimal."
          >
            <div className="space-y-2 rounded-xl border border-lp-surface-container bg-white p-4">
              <div className="flex justify-between text-xs font-medium text-lp-tertiary">
                <span>Menu: Es Kopi Susu Aren (16oz)</span>
                <span className="font-lp-mono font-bold text-lp-primary">HPP: Rp 6.850</span>
              </div>
              <div
                className="flex h-2 w-full overflow-hidden rounded-full bg-lp-surface-container"
                role="img"
                aria-label="Komposisi HPP: susu 45 persen, espresso 30 persen, gula aren 15 persen, kemasan 10 persen"
              >
                <div className="h-full w-[45%] bg-lp-primary" />
                <div className="h-full w-[30%] bg-lp-secondary" />
                <div className="h-full w-[15%] bg-lp-secondary-container" />
                <div className="h-full w-[10%] bg-lp-tertiary" />
              </div>
              <div className="flex justify-between pt-1 text-xs text-lp-on-surface-variant">
                <span>
                  Harga Jual: <strong className="font-lp-mono text-lp-on-surface">Rp 22.000</strong>
                </span>
                <span className="font-bold text-lp-primary">Gross Margin: 68.8%</span>
              </div>
            </div>
          </FeatureShell>

          <FeatureShell
            icon="account_balance_wallet"
            iconClass="bg-lp-primary-container text-white"
            title="Rekonsiliasi Kas Shift & Pajak PB1"
            body="Laporan penutupan kasir shift harian dengan pencocokan instan tanpa selisih nominal, dilengkapi pemisahan pajak resto daerah secara otomatis."
          >
            <ul className="space-y-2.5 text-xs text-lp-on-surface">
              {CHECKS.map((check, i) => (
                <li key={check} className="flex items-center gap-2">
                  <Icon
                    name={i === 0 ? 'verified_user' : i === 1 ? 'calculate' : 'file_download'}
                    className="text-[18px] text-lp-primary"
                  />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </FeatureShell>

          <FeatureShell
            icon="hub"
            iconClass="bg-lp-on-surface text-white"
            title="Multi-Outlet & Manajemen Karyawan Terpusat"
            body="Buka cabang baru tanpa ribet. Pantau performa puluhan gerai dari satu dashboard backoffice cloud kapan saja dari smartphone Anda."
          >
            <ul className="space-y-2.5 text-xs text-lp-on-surface">
              {OUTLET_CHECKS.map((check, i) => (
                <li key={check} className="flex items-center gap-2">
                  <Icon
                    name={i === 0 ? 'storefront' : i === 1 ? 'inventory_2' : 'badge'}
                    className="text-[18px] text-lp-primary"
                  />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </FeatureShell>
        </div>
      </div>
    </section>
  );
}
