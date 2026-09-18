import { Icon } from '../icon';

const PAINS = [
  {
    title: 'Stok manual sering selisih',
    body: 'Catatan stok gudang dan fisik di akhir shift tidak pernah klop, baru ketahuan bahan habis saat antrean ramai.',
  },
  {
    title: 'HPP meleset saat harga pasar naik',
    body: 'Harga susu segar dan kopi merangkak naik, harga menu tetap sama karena perhitungan HPP spreadsheet terlalu rumit.',
  },
  {
    title: 'Rekap kasir lembur berjam-jam',
    body: 'Kasir dan manajer menghitung kertas bon berantakan saat tutup toko, mencari selisih EDC dan kas kecil hingga tengah malam.',
  },
  {
    title: 'Fraud & void transaksi tanpa proteksi',
    body: 'Pembatalan struk dan diskon kasir tidak terlacak jelas tanpa otorisasi bertingkat, rawan manipulasi oknum.',
  },
];

const GAINS = [
  {
    title: 'BOM potong otomatis per gramatur',
    body: 'Tiap 1 cup kopi terjual, susu 150ml, espresso 18gr, cup dan sedotan terpotong otomatis di sistem gudang secara live.',
  },
  {
    title: 'Alert stok kritis & kenaikan harga vendor',
    body: 'Notifikasi otomatis saat stok mendekati batas minimum dan sistem langsung merevisi kalkulasi margin menu Anda.',
  },
  {
    title: 'Rekap shift 3 menit selisih Rp 0',
    body: 'Rekonsiliasi cash drawer, QRIS dinamis, dan mesin kartu EDC otomatis tersinkronisasi rapi saat serah terima shift.',
  },
  {
    title: 'Proteksi PIN manajer multi-level',
    body: 'Semua aktivitas void menu, refund, dan diskon promosi mewajibkan approval PIN khusus manajer dengan log audit real-time.',
  },
];

export function Comparison() {
  return (
    <section id="solusi-masalah" className="scroll-mt-24 bg-lp-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-lp-secondary">
            Komparasi Operasional
          </span>
          <h2 className="mb-4 mt-2 text-2xl font-bold text-lp-on-surface sm:text-3xl lg:text-4xl">
            Mengapa Resto &amp; Kafe Sering Boncos Tanpa Disadari?
          </h2>
          <p className="text-base text-lp-on-surface-variant">
            Selisih takaran gramatur, keterlambatan penyesuaian harga jual, dan rekap
            shift manual dapat memotong hingga 15% keuntungan bersih Anda setiap bulan.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-lp-error">
                  <Icon name="close" className="text-[22px]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-lp-on-surface">Cara Lama (Bikin Boncos)</h3>
                  <p className="text-xs text-lp-tertiary">Sistem kasir konvensional &amp; pembukuan manual</p>
                </div>
              </div>
              <ul className="space-y-5">
                {PAINS.map((pain) => (
                  <li key={pain.title} className="flex items-start gap-3">
                    <Icon name="cancel" className="mt-0.5 shrink-0 text-[20px] text-lp-error" />
                    <div>
                      <strong className="block text-sm font-semibold text-lp-on-surface">{pain.title}</strong>
                      <p className="mt-0.5 text-xs leading-relaxed text-lp-on-surface-variant">{pain.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs font-medium leading-relaxed text-lp-error">
              <Icon name="warning" className="mt-0.5 shrink-0 text-[18px]" />
              <span>
                Rata-rata outlet F&amp;B kehilangan{' '}
                <span className="font-bold">Rp 3.5jt - Rp 9jt per bulan</span>{' '}
                akibat kebocoran gramatur dan human error pencatatan.
              </span>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-lp-primary bg-emerald-50/40 p-8 shadow-md">
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-lp-primary/10" />
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lp-primary text-white shadow-sm">
                  <Icon name="check" className="text-[22px]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-lp-on-surface">Dengan Tumbuh POS</h3>
                  <p className="text-xs font-semibold text-lp-primary">Terintegrasi otomatis, presisi &amp; hemat waktu</p>
                </div>
              </div>
              <ul className="space-y-5">
                {GAINS.map((gain) => (
                  <li key={gain.title} className="flex items-start gap-3">
                    <Icon name="check_circle" className="mt-0.5 shrink-0 text-[20px] text-lp-primary" />
                    <div>
                      <strong className="block text-sm font-semibold text-lp-on-surface">{gain.title}</strong>
                      <p className="mt-0.5 text-xs leading-relaxed text-lp-on-surface-variant">{gain.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3.5 text-xs font-semibold leading-relaxed text-lp-primary shadow-sm">
              <Icon name="verified" className="text-[18px]" />
              <span>Kenaikan efisiensi margin bersih rata-rata 4.2% dalam 30 hari pemakaian.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
