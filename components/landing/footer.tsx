import Image from 'next/image';
import { LOGO_URL, WA_SALES_URL } from './assets';
import { Icon } from '../icon';

const PRODUCT_LINKS = [
  'Kasir POS Tablet',
  'Backoffice Cloud',
  'Resep & HPP BOM',
  'Multi-Outlet Hub',
  'Kitchen Display (KDS)',
  'Self-Order QR Meja',
];

const SOLUTION_LINKS = [
  'Kedai Kopi & Artisan Cafe',
  'Restoran Cepat Saji',
  'Bakery & Cake Shop',
  'Cloud Kitchen & Takeaway',
  'Warung Modern & Pujasera',
  'Franchise & Multi-Cabang',
];

const COMPLIANCE = [
  { icon: 'verified', label: 'QRIS Standar BI' },
  { icon: 'security', label: 'Kominfo PSE' },
  { icon: 'receipt_long', label: 'Pajak PB1' },
  { icon: 'lock', label: 'ISO 27001' },
];

export function Footer() {
  return (
    <footer className="border-t border-lp-surface-container bg-white pb-12 pt-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 border-b border-lp-surface-container pb-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Image alt="Tumbuh POS Logo" src={LOGO_URL} width={160} height={32} className="h-8 w-auto object-contain" />
            <p className="max-w-sm text-xs leading-relaxed text-lp-on-surface-variant sm:text-sm">
              Platform ekosistem Point of Sale &amp; Backoffice terintegrasi untuk bisnis
              F&amp;B Indonesia. Membantu kendalikan HPP resep presisi, cegah kebocoran
              bahan, dan percepat closing shift kasir.
            </p>
            <div className="space-y-1 pt-2 text-xs text-lp-on-surface-variant">
              <span className="block font-bold text-lp-on-surface">PT Tumbuh Digital Niaga</span>
              <p>One Pacific Place Lt. 15, SCBD Sudirman, Jakarta Selatan 12190</p>
              <p className="pt-1">
                <a
                  href={WA_SALES_URL}
                  className="inline-flex items-center gap-1.5 font-semibold text-lp-primary hover:underline"
                >
                  <Icon name="support_agent" className="text-[16px]" />
                  <span>Helpdesk: +62 811-923-8877</span>
                </a>
              </p>
            </div>
          </div>
          <nav aria-label="Produk F&B" className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-lp-on-surface">Produk F&amp;B</h4>
            <ul className="space-y-2 text-xs text-lp-on-surface-variant">
              {PRODUCT_LINKS.map((label) => (
                <li key={label}>
                  <a href="#fitur-kuliner" className="transition-colors hover:text-lp-primary">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Solusi bisnis" className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-lp-on-surface">Solusi Bisnis</h4>
            <ul className="space-y-2 text-xs text-lp-on-surface-variant">
              {SOLUTION_LINKS.map((label) => (
                <li key={label}>
                  <a href="#" className="transition-colors hover:text-lp-primary">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-lp-on-surface">
              Kepatuhan &amp; Keamanan
            </h4>
            <p className="text-xs text-lp-on-surface-variant">
              Sistem bersertifikasi kepatuhan transaksi nasional &amp; enkripsi cloud.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {COMPLIANCE.map((badge) => (
                <span
                  key={badge.label}
                  className="flex items-center gap-1 rounded-md border border-lp-surface-container bg-lp-surface-low px-2.5 py-1 text-[11px] font-semibold text-lp-on-surface"
                >
                  <Icon name={badge.icon} className="text-[14px] text-lp-primary" />
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-lp-tertiary md:flex-row">
          <p>© 2025 PT Tumbuh Digital Niaga. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-lp-on-surface">Kebijakan Privasi</a>
            <a href="#" className="transition-colors hover:text-lp-on-surface">Syarat &amp; Ketentuan</a>
            <a href="#" className="transition-colors hover:text-lp-on-surface">Keamanan Data</a>
            <a href={WA_SALES_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-lp-on-surface">
              Kontak Kami
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
