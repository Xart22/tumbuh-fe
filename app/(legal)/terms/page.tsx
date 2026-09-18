import Link from 'next/link';
import type { Metadata } from 'next';
import { plusJakarta } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan · Tumbuh POS',
  description: 'Syarat dan ketentuan penggunaan platform Tumbuh POS.',
};

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: '1. Definisi Layanan',
    body: [
      'Tumbuh POS ("Kami") adalah platform Point of Sale dan backoffice berbasis cloud untuk bisnis food & beverage, dioperasikan oleh PT Tumbuh Digital Niaga. "Pengguna" adalah pemilik usaha, manager, dan staf yang memakai layanan melalui aplikasi kasir, backoffice, maupun halaman pendaftaran.',
    ],
  },
  {
    title: '2. Pendaftaran & Akun',
    body: [
      'Pendaftaran membutuhkan nama usaha, nama penanggung jawab, email bisnis yang valid, dan kata sandi. Email harus diverifikasi melalui kode OTP sebelum akun dapat dipakai masuk.',
      'Satu email dapat memiliki beberapa workspace; setiap workspace adalah entitas usaha terpisah dengan datanya sendiri. Pengguna wajib menjaga kerahasiaan kata sandi dan bertanggung jawab atas seluruh aktivitas di akunnya.',
    ],
  },
  {
    title: '3. Masa Uji Coba 14 Hari',
    body: [
      'Setiap workspace baru otomatis mendapat masa uji coba gratis 14 hari dengan fitur penuh paket Starter. Uji coba tidak membutuhkan kartu kredit.',
      'Setelah masa uji coba berakhir tanpa langganan aktif, akses transaksi dapat dibatasi hingga langganan diaktifkan. Data usaha tetap tersimpan dan dapat diakses kembali setelah berlangganan.',
    ],
  },
  {
    title: '4. Langganan & Pembayaran',
    body: [
      'Paket berbayar ditagih per outlet per bulan atau per tahun sesuai harga yang tercantum di halaman harga. Harga dapat berubah dengan pemberitahuan wajar; perubahan tidak berlaku surut untuk periode yang sudah dibayar.',
      'Kenaikan batas outlet (plan limit) mengikuti paket aktif. Pengembalian dana mengikuti kebijakan yang berlaku pada saat pembelian.',
    ],
  },
  {
    title: '5. Kewajiban Pengguna',
    body: [
      'Pengguna dilarang: memakai layanan untuk kegiatan melawan hukum; mencoba membobol, memindai kerentanan, atau mengganggu infrastruktur; membuat akun massal otomatis (bot); memberikan kredensial ke pihak yang tidak berwenang; serta memasukkan data yang melanggar hak pihak ketiga.',
      'Data menu, harga, pajak, dan laporan yang dimasukkan adalah tanggung jawab Pengguna. Kami menyediakan alat bantu perhitungan, bukan jasa akuntansi atau perpajakan.',
    ],
  },
  {
    title: '6. Ketersediaan & Batasan Tanggung Jawab',
    body: [
      'Kami menargetkan uptime tinggi dan menyediakan mode offline kasir untuk transaksi tunai, namun tidak menjamin layanan bebas gangguan 100% (force majeure, gangguan provider, pemeliharaan terjadwal).',
      'Sejauh diizinkan hukum, tanggung jawab Kami terbatas pada nilai langganan yang dibayarkan untuk periode berjalan dan tidak mencakup kerugian tidak langsung seperti kehilangan keuntungan.',
    ],
  },
  {
    title: '7. Privasi Data',
    body: [
      'Pengumpulan dan pemakaian data pribadi diatur dalam Kebijakan Privasi yang merupakan bagian tak terpisahkan dari dokumen ini.',
    ],
  },
  {
    title: '8. Penghentian',
    body: [
      'Pengguna dapat berhenti berlangganan kapan saja; akses berakhir pada akhir periode berjalan. Kami dapat menangguhkan akun yang melanggar ketentuan, menunggak pembayaran, atau terindikasi penyalahgunaan, dengan pemberitahuan wajar kecuali keadaan mendesak.',
      'Data dapat diekspor sebelum penghentian. Setelah itu data dihapus sesuai jadwal retensi pada Kebijakan Privasi.',
    ],
  },
  {
    title: '9. Perubahan Ketentuan',
    body: [
      'Ketentuan ini dapat diperbarui mengikuti perkembangan layanan dan regulasi. Perubahan material diumumkan melalui email atau dashboard minimal 14 hari sebelum berlaku. Pemakaian berlanjut dianggap menyetujui versi terbaru.',
    ],
  },
  {
    title: '10. Hukum & Kontak',
    body: [
      'Dokumen ini diatur oleh hukum Republik Indonesia. Sengketa diselesaikan musyawarah dahulu, lalu melalui pengadilan yang berwenang di Jakarta Selatan.',
      'Kontak: PT Tumbuh Digital Niaga, One Pacific Place Lt. 15, SCBD Sudirman, Jakarta Selatan 12190 — WhatsApp +62 811-923-8877.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className={`min-h-screen bg-lp-background font-lp-sans text-lp-on-surface ${plusJakarta.variable}`}>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm font-semibold text-lp-primary hover:underline">
          ← Kembali ke beranda
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Syarat &amp; Ketentuan</h1>
        <p className="mt-2 text-sm text-lp-tertiary">Terakhir diperbarui: September 2026</p>
        <div className="mt-8 flex flex-col gap-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-lp-on-surface-variant">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
