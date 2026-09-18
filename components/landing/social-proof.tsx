import { Icon } from '../icon';

const BRANDS = [
  { icon: 'local_cafe', name: 'Kopi Tumbuh', className: 'font-bold tracking-tight' },
  { icon: 'bakery_dining', name: 'Kala Senja Bakery', className: 'font-semibold tracking-tight' },
  { icon: 'storefront', name: 'Warung Senopati', className: 'font-bold tracking-tight' },
  { icon: 'local_fire_department', name: 'Sambal Bakar Juara', className: 'font-extrabold tracking-tight text-lp-error' },
  { icon: 'restaurant', name: 'Dapur Sedap Rasa', className: 'font-semibold tracking-tight' },
];

const STATS = [
  { value: '4.800+', label: 'Outlet Aktif', sub: 'Di 34 provinsi se-Indonesia', accent: 'text-lp-primary' },
  { value: 'Rp 1.2 T+', label: 'Transaksi Tahunan', sub: 'Diproses cepat & aman', accent: 'text-lp-on-surface' },
  { value: '99.98%', label: 'POS Cloud Uptime', sub: 'Anti ngelag di jam makan siang', accent: 'text-lp-primary' },
  { value: '32%', label: 'Efisiensi Waste Bahan', sub: 'Berkat resep & kontrol HPP', accent: 'text-lp-secondary' },
];

export function SocialProof() {
  return (
    <section className="border-y border-lp-surface-container bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <p className="mb-6 text-xs font-bold uppercase tracking-widest text-lp-tertiary">
            Dipercaya Oleh Ribuan Brand F&amp;B Favorit Indonesia
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-base text-lp-on-surface-variant opacity-80 lg:gap-x-14">
            {BRANDS.map((brand) => (
              <div key={brand.name} className={`flex items-center gap-2 ${brand.className}`}>
                <Icon name={brand.icon} className="text-[22px] text-lp-primary" />
                {brand.name}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-lp-surface-container bg-lp-surface-low p-6 text-center"
            >
              <p className={`mb-1 font-lp-mono text-2xl font-extrabold lg:text-3xl ${stat.accent}`}>
                {stat.value}
              </p>
              <p className="text-sm font-semibold text-lp-on-surface">{stat.label}</p>
              <p className="mt-0.5 text-xs text-lp-tertiary">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
