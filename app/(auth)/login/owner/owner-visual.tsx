import Image from 'next/image';
import { Icon } from '@/components/icon';

const VISUAL_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCixkl7KBFf4kEY50WKFZdjtlhAbAfH5ChnilTHnJiwLF1Nup_0saVruO1E9DWTckePGYJ3YpOq0NOVqr6BDGefbL39F1TMELgPRQx0aB19AqDC13GTXqhr34ZKgjJRgYPWbNmsSPY4Of5rN7eAXhVCLXJbg6HV-glntKfqWQFtXLgej1YG-S8GjyWv-S4fnuoJnnILIU7VDSXSPRZLIVtuCoPZTerPoeW_FqehsTgL2QCCGAjuFRkZqg';

/** Right-side F&B showcase: live outlet proof + social proof + stats. */
export function OwnerVisual() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-emerald-950 p-10 text-white lg:flex lg:w-1/2">
      <Image
        alt=""
        aria-hidden="true"
        src={VISUAL_URL}
        fill
        sizes="40vw"
        className="object-cover opacity-35 mix-blend-luminosity"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/70 to-emerald-900/40" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Dipercaya 4.800+ Outlet F&amp;B Indonesia
        </span>
        <span className="text-xs text-white/70">Terintegrasi QRIS &amp; PB1</span>
      </div>

      <div className="relative z-10 my-auto py-8">
        <div className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/30 text-emerald-300">
              <Icon name="trending_up" className="text-[20px]" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-300">Real-Time Sync Outlet Senopati</p>
              <h3 className="text-lg font-bold text-white">Omzet Naik +24% Saat Jam Makan Siang</h3>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            &ldquo;Dengan Tumbuh POS, rekap shift kasir hanya butuh 3 menit. Notifikasi
            stok kritis otomatis mencegah kehabisan fresh milk di tengah antrean
            panjang.&rdquo;
          </p>
          <div className="flex items-center justify-between border-t border-white/15 pt-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-emerald-950">
                DP
              </div>
              <div>
                <p className="font-bold leading-tight text-white">Dimas Pratama</p>
                <p className="text-[11px] text-emerald-300">Co-Founder, Kopi Tumbuh Artisan</p>
              </div>
            </div>
            <span className="text-[11px] text-white/60">3 Cabang • Jakarta</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
        {[
          { value: '99.98%', label: 'Uptime POS Offline-Ready', accent: false },
          { value: '0 Detik', label: 'Auto Rekon QRIS Dinamis', accent: true },
          { value: '24 / 7', label: 'Dukungan CS WhatsApp', accent: false },
        ].map((stat) => (
          <div key={stat.label}>
            <p className={`text-xl font-extrabold ${stat.accent ? 'text-emerald-400' : 'text-white'}`}>
              {stat.value}
            </p>
            <p className="text-[11px] text-slate-300">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
