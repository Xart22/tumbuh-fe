import Link from 'next/link';
import type { Metadata } from 'next';
import { plusJakarta } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi · Tumbuh POS',
  description: 'Bagaimana Tumbuh POS mengumpulkan, memakai, dan melindungi data Anda.',
};

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: '1. Data yang Kami Kumpulkan',
    body: [
      'Data akun: nama pemilik/pengelola, email bisnis, nomor WhatsApp, dan kata sandi (tersimpan sebagai hash satu arah, tidak pernah sebagai teks polos).',
      'Data usaha: nama brand, jenis usaha, nama outlet, kota, alamat, telepon operasional, NPWP, dan jam operasional.',
      'Data operasional: transaksi kasir, menu dan resep, stok bahan baku, data pelanggan yang Anda masukkan (nama, telepon, email), presensi staf, dan log aktivitas.',
      'Data teknis: log akses, alamat IP, dan pengenal sesi untuk keamanan dan diagnostik.',
    ],
  },
  {
    title: '2. Tujuan Penggunaan',
    body: [
      'Mengoperasikan layanan (kasir, laporan, sinkronisasi antar outlet), memverifikasi kepemilikan email, mencegah penyalahgunaan dan bot, menagih langganan, mengirim notifikasi operasional (mis. stok kritis), serta menindaklanjuti bantuan yang Anda minta.',
      'Kami tidak menjual data pribadi Anda kepada pihak ketiga dan tidak memakai data transaksi untuk iklan.',
    ],
  },
  {
    title: '3. Berbagi Data',
    body: [
      'Data dibagikan hanya sejauh diperlukan untuk layanan: penyedia infrastruktur cloud, gerbang pembayaran/QRIS yang Anda aktifkan, dan penyedia email transaksional. Setiap pihak terikat kewajiban kerahasiaan.',
      'Pengungkapan kepada aparat penegak hukum hanya mengikuti prosedur hukum yang berlaku di Indonesia.',
    ],
  },
  {
    title: '4. Keamanan',
    body: [
      'Kata sandi di-hash (bcrypt), token sesi kedaluwarsa otomatis, akses antar-tenant diisolasi per skema database, dan endpoint sensitif dilindungi PIN manajer serta pembatasan laju. Tidak ada sistem yang 100% kebal; insiden keamanan material akan kami beritahukan sesuai ketentuan.',
    ],
  },
  {
    title: '5. Penyimpanan di Perangkat',
    body: [
      'Aplikasi menyimpan token sesi di penyimpanan lokal peramban agar Anda tetap masuk, serta cache operasional kasir untuk mode offline. Keluar (logout) menghapus token dari perangkat tersebut.',
    ],
  },
  {
    title: '6. Retensi',
    body: [
      'Data operasional tersimpan selama akun aktif. Setelah workspace dihapus/ditutup, data dihapus atau dianonimkan dalam waktu wajar kecuali wajib disimpan oleh peraturan (mis. catatan pajak). Backup berputar mengikuti jadwal infrastruktur.',
    ],
  },
  {
    title: '7. Hak Anda',
    body: [
      'Anda berhak meminta akses, koreksi, ekspor, dan penghapusan data pribadi Anda, serta menarik persetujuan untuk komunikasi non-esensial. Sampaikan melalui WhatsApp +62 811-923-8877; kami merespons maksimal 14 hari kerja.',
    ],
  },
  {
    title: '8. Perubahan & Kontak',
    body: [
      'Kebijakan ini dapat diperbarui; versi terbaru selalu tersedia di halaman ini dengan tanggal berlakunya.',
      'Pengendali data: PT Tumbuh Digital Niaga, One Pacific Place Lt. 15, SCBD Sudirman, Jakarta Selatan 12190.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className={`min-h-screen bg-lp-background font-lp-sans text-lp-on-surface ${plusJakarta.variable}`}>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm font-semibold text-lp-primary hover:underline">
          ← Kembali ke beranda
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Kebijakan Privasi</h1>
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
