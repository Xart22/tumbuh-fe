import { Icon } from '../icon';

const FAQS = [
  {
    q: 'Apakah kasir Tumbuh POS tetap bisa digunakan saat internet mati?',
    a: 'Ya, tentu saja. Tumbuh POS dilengkapi teknologi Offline-First Sync Engine. Kasir Anda tetap bisa membuka meja, mencetak struk order ke printer kasir/dapur, dan memproses transaksi tunai tanpa hambatan. Ketika internet terhubung kembali, semua data terunggah otomatis ke cloud Backoffice.',
  },
  {
    q: 'Bagaimana jika tablet kasir rusak atau hilang? Apakah data penjualan hilang?',
    a: 'Seluruh riwayat transaksi, resep, dan inventori Anda tersimpan aman di server cloud dengan standar enkripsi ISO 27001. Cukup unduh aplikasi di perangkat baru, masukkan login Anda, dan data langsung pulih seketika dalam waktu kurang dari 1 menit.',
  },
  {
    q: 'Apakah tim Tumbuh bisa membantu migrasi data menu dari POS lama kami?',
    a: 'Tentu. Tim Onboarding Specialist kami siap mendampingi proses impor data daftar menu, varian harga, hingga resep gramatur bahan baku dari Excel atau software POS lama Anda secara gratis tanpa biaya ekstra.',
  },
  {
    q: 'Apakah printer thermal bluetooth dan cash drawer lama saya kompatibel?',
    a: 'Tumbuh POS mendukung 95% perangkat periferal kasir standar di Indonesia, termasuk printer thermal 58mm & 80mm (Bluetooth, USB, LAN dari merek Epson, Sunmi, Kassen, Panda, Iware) serta cash drawer RJ-11.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-lp-surface-container bg-white py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-16 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-lp-primary">
            Tanya Jawab
          </span>
          <h2 className="mb-3 mt-2 text-2xl font-bold text-lp-on-surface sm:text-3xl">
            Pertanyaan yang Sering Diajukan Pemilik Bisnis
          </h2>
          <p className="text-sm text-lp-on-surface-variant">
            Jawaban cepat untuk keraguan teknis dan operasional harian Anda.
          </p>
        </div>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group cursor-pointer rounded-xl border border-lp-surface-container bg-lp-surface-low p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between gap-4 text-sm font-bold text-lp-on-surface">
                <span>{faq.q}</span>
                <Icon
                  name="expand_more"
                  className="shrink-0 text-lp-primary transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 border-t border-lp-surface-container pt-3 text-xs leading-relaxed text-lp-on-surface-variant sm:text-sm">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
