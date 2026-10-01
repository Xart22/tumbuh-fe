---
name: Tumbuh POS & Backoffice
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#545c72'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c748b'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  data-currency:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.02em
  data-currency-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

# Tumbuh POS & Backoffice — Design System Specification

> Dokumen spesifikasi sistem desain resmi untuk ekosistem **Tumbuh POS & Backoffice** (Stitch Project: `2361311057318663865`).  
> Sumber tunggal (*Single Source of Truth*) untuk estetika visual, token warna, tipografi, elevasi, tata letak, dan pola interaksi seluruh komponen web & tablet.

---

## 1. Brand Identity & Style

Sistem desain ini merepresentasikan ekosistem operasional modern, presisi tinggi, dan berorientasi pada pertumbuhan bisnis (*Growth-Oriented Operational Ecosystem*) untuk pengusaha makanan dan minuman (F&B), pemilik kafe, bistro, restoran dine-in, bakery, hingga cloud kitchen multi-cabang di Indonesia.

Desain menggabungkan efisiensi tinggi utilitas **Corporate / Modern SaaS** dengan kehangatan organik (*Organic Vitality*):
- **Tone & Karakter:** Otoritas tenang (*Calm Authority*), vitalitas modern, dan disiplin struktur metrik keuangan.
- **Audiens:** Pemilik bisnis F&B Indonesia, direktur cloud kitchen, manajer shift kasir, dan barista yang mengelola antrian pesanan, mutasi stok bahan, dan margin laba kotor secara real-time.
- **Tujuan Pengalaman:** Ingesti data cepat tanpa kelelahan kognitif selama shift 12 jam, konfirmasi taktil yang tegas untuk layar sentuh terminal kasir (POS), dan hierarki data finansial yang akurat dan mudah diaudit.

### Ekosistem 5 Surface Utama

| Surface | Pengguna Utama | Bahasa Visual | Target Device |
|---|---|---|---|
| **S1: POS Kasir** | Kasir, Barista | Dark shell tactile, touch-first, quick checkout | Tablet 10"–12" landscape / Desktop |
| **S2: Backoffice Owner** | Owner, Manajer | Light `lp-*` palette, data-dense, analytics & CRUD | Desktop 1280px+ & Mobile responsif |
| **S3: Kitchen Display (KDS)** | Chef, Line Cook, Barista | High-contrast dark, bold badge, SLA timers | Tablet/Monitor Dapur |
| **S4: Self-Order QR** | Pelanggan Restoran | Light mobile-first, visual katalog, QRIS dinamis | Layar Smartphone (Web Mobile) |
| **S5: Auth & Onboarding** | Owner Baru / Kasir PIN | Clean marketing grade, form step terstruktur | Desktop & Mobile |

---

## 2. Color System (Design Tokens)

Palet warna menyeimbangkan warna hijau pertanian yang subur (*Emerald Green*, simbol pertumbuhan omzet & kesegaran) dengan aksen amber hangat (*Warm Amber*, aroma artisan sangrai kopi & roti) serta slate netral yang presisi.

### 2.1 Primary (Deep Emerald Growth)
- **Primary (`#059669` / `#006948`):** Aksi utama (CTA), sesi aktif, pembayaran terkonfirmasi, indikator tren laba positif.
- **Primary Container (`#00855d`):** State hover tombol utama, aksen container sekunder.
- **Primary Fixed (`#85f8c4`):** Chip status aktif, badge sorotan menu ("Terlaris"), aksen pill lembut.
- **Primary Fixed Dim (`#68dba9`):** Border aksen halus & badge sekunder.
- **On Primary (`#ffffff`):** Teks kontras di atas warna primary.
- **On Primary Container (`#f5fff7`):** Teks kontras di atas container hijau gelap.
- **On Primary Fixed (`#002114`):** Teks gelap di atas badge hijau muda (*high contrast*).

### 2.2 Secondary (Warm Amber Artisan)
- **Secondary (`#855300`):** Nada hangat artisan kopi & bakery; rasio biaya bahan (Food Cost), badge resep unggulan.
- **Secondary Container (`#fea619`):** Aksen interaktif oranye-kuning, penanda tiket prioritas, batas stok bahan menipis.
- **Secondary Fixed (`#ffddb8`):** Background badge peringatan lembut.
- **Secondary Fixed Dim (`#ffb95f`):** Border peringatan & highlight amber.
- **On Secondary Container (`#684000`):** Teks kontras gelap di atas amber.

### 2.3 Tertiary & Neutrals (Midnight Slate & Backgrounds)
- **Tertiary (`#545c72`):** Teks bantuan, metadata, ikon sekunder, nomor SKU.
- **Background (`#f8f9ff`):** Kanvas global terang, anti-silau di bawah pencahayaan kafe.
- **Surface (`#f8f9ff`):** Lapisan dasar komponen.
- **Surface Container Lowest (`#ffffff`):** Kartu putih utama (Card background), modal popover, form input.
- **Surface Container Low (`#eff4ff`):** Panel filter, striping tabel, latar stat tile tersembunyi.
- **Surface Container (`#e5eeff`):** Border halus antar-kartu (1px hairline), slider track.
- **Surface Container High (`#dce9ff`):** Elemen hover sekunder.
- **Surface Container Highest (`#d3e4fe`):** Divider tebal, input disabled, outline dekoratif.
- **On Surface (`#0b1c30`):** Warna teks utama (Deep Navy Slate), terbaca sangat tajam dan profesional.
- **On Surface Variant (`#3d4a42`):** Teks sekunder, label tabel, deskripsi bantuan.
- **Inverse Surface (`#213145`):** Footer gelap, elemen drawer hitam, toast notifikasi.
- **Inverse On Surface (`#eaf1ff`):** Teks putih-kebiruan di atas dark surface.

### 2.4 Status, Financial & Warning Signals (Operational Meaning)
Status warna adalah **sinyal operasional fungsional**, bukan sekadar dekorasi:

| Signal | Background Tint | Foreground / Text | Makna Operasional F&B POS |
|---|---|---|---|
| **Success** | `#ecfdf5` | `#059669` / `#006948` | Kas pas (selisih Rp 0), transaksi lunas, target margin tercapai (>65%), POS Online |
| **Warning** | `#fffbeb` / `#ffddb8` | `#855300` / `#92400e` | Stok bahan mendekati batas minimum, pesanan dapur mendekati SLA (8+ menit), tagihan parkir |
| **Critical / Void** | `#fef2f2` / `#ffdad6` | `#ba1a1a` / `#93000a` | Stok kosong (0), pembatalan/void pesanan dengan PIN Manager, selisih kas minus (boncos) |
| **Info / Sync** | `#eff6ff` / `#dae2fd` | `#0284c7` / `#1e40af` | Sinkronisasi multi-outlet cloud, update printer struk, notifikasi shift |

---

## 3. Typography System (Dual-Engine Protocol)

Sistem tipografi menggunakan protokol dua keluarga font:
1. **Plus Jakarta Sans** (`font-lp-sans`): Teks struktural, heading, label form, tombol navigasi, dan dialog. Memberikan kesan ramah, modern, dan sangat terbaca di layar sentuh kasir.
2. **JetBrains Mono** (`font-lp-mono`): Diterapkan mutlak untuk seluruh format mata uang **Rupiah (IDR)**, nominal kas, takaran gramatur resep (`gr`, `ml`, `kg`), persentase margin laba kotor, waktu/timer dapur, dan barcode/SKU produk (`font-feature-settings: 'tnum' 1`). Mencegah karakter bergoyang saat tabel me-render angka secara langsung.

### 3.1 Skala Tipografi Terstandarisasi

| Token | Family | Ukuran | Weight | Line Height | Tracking | Penggunaan |
|---|---|---|---|---|---|---|
| `display-lg` | Plus Jakarta Sans | 36px / 48px | 700 / 800 | 44px | -0.02em | Hero headline landing page |
| `display-lg-mobile` | Plus Jakarta Sans | 28px | 700 | 36px | -0.02em | Hero headline di perangkat mobile |
| `headline-lg` | Plus Jakarta Sans | 24px | 600 | 32px | -0.015em | Judul modul Backoffice, header drawer |
| `headline-md` | Plus Jakarta Sans | 20px | 600 | 28px | -0.01em | Judul submodul, nama menu di grid |
| `headline-sm` | Plus Jakarta Sans | 16px | 600 | 24px | -0.005em | Judul kartu metrik, header tabel |
| `body-lg` | Plus Jakarta Sans | 16px | 400 | 24px | 0 | Paragraf pengantar, deskripsi modal |
| `body-md` | Plus Jakarta Sans | 14px | 400 | 20px | 0 | Teks default antarmuka, input form |
| `body-sm` | Plus Jakarta Sans | 12px | 400 | 16px | 0 | Helper text, catatan kaki struk |
| `label-lg` | Plus Jakarta Sans | 14px | 600 | 20px | +0.01em | Label tombol aksi utama, tab aktif |
| `label-md` | Plus Jakarta Sans | 12px | 500 | 16px | +0.01em | Label form sekunder, pill filter |
| `label-sm` | Plus Jakarta Sans | 11px | 600 | 14px | +0.04em | Chip status, badge kategori kecil |
| `data-currency-lg` | JetBrains Mono | 24px / 32px | 700 | 30px | -0.03em | Total omzet dashboard, Grand Total struk |
| `data-currency` | JetBrains Mono | 16px | 600 | 20px | -0.02em | Harga satuan menu, subtotal item, HPP |
| `data-mono-sm` | JetBrains Mono | 12px | 500 | 16px | 0 | Gramatur bahan resep (`18.5 gr`), SKU |

*Konvensi Rupiah:* Simbol mata uang `Rp` dirender dengan bobot reguler/medium warna slate (`text-lp-tertiary`), diikuti angka nominal tebal warna navy (`text-lp-on-surface`) untuk mempercepat pemindaian visual kasir.

---

## 4. Layout & Spacing System

Grid responsif 12-kolom yang beradaptasi fleksibel antara tablet POS 10 inci, laptop manajer 14 inci, dan monitor analitik 27 inci:

- **Desktop Backoffice (≥ 1280px):** 12-kolom, gutters 24px (`space-lg`), navigasi samping tetap selebar 260px (`OwnerShell`), dan batas maksimum kanvas 1600px (`max-w-7xl` / `max-w-screen-2xl`).
- **Tablet Counter POS (768px – 1024px landscape):** Split-view workspace. Panel kiri berisi 8-kolom grid katalog produk dengan gutter 16px (`space-md`); panel kanan berupa panel keranjang struk tetap selebar 380px (`CartPanel`).
- **Mobile Handheld (< 768px):** Single-column stacked layout, margin 16px (`space-md`), bottom bar aksi tetap untuk manajer atau pemesanan mandiri pelanggan (Self-Order QR).
- **Ritme Spasi 8pt Dasar:**  
  `space-xs` = 4px (`0.25rem`), `space-sm` = 8px (`0.5rem`), `space-md` = 16px (`1rem`), `space-lg` = 24px (`1.5rem`), `space-xl` = 32px (`2rem`), `space-2xl` = 48px (`3rem`).
- **Target Sentuh Minimum:** Seluruh kontrol interaktif, tombol kasir, dan baris tabel memiliki tinggi minimum **44px** (`h-11`) untuk memastikan kemudahan sentuhan jari (*fat-finger proof*).

---

## 5. Elevation & Depth

Elevasi mengandalkan ketajaman garis batas *hairline border* (1px) yang dipadukan dengan bayangan lembut ambient, menghindari bayangan gelap pekat yang membuat layar terlihat kusam di dapur kafe:

1. **Level 0 (Flat Canvas):** `#f8f9ff` kanvas dasar tanpa border/shadow.
2. **Level 1 (Card Baseline):** Kartu putih `#ffffff`, border 1px `border-lp-outline-variant` atau `border-lp-surface-container`, shadow lembut: `0 1px 3px 0 rgba(15, 23, 42, 0.04)`.
3. **Level 2 (Dropdowns, Popovers & Floating Controls):** `#ffffff`, border 1px `border-slate-200`, shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
4. **Level 3 (Modals, Slide-over Bill Splitting, Dialog PIN):** `#ffffff`, shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.09)`. Backdrop scrim `#0b1c30` opacity 40% dengan `backdrop-blur-sm` (2px).
5. **Level 4 (Toasts & Floating Urgent Notifications):** Dark slate `#213145` dengan teks kontras tinggi `#ffffff`, shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.2)`.

---

## 6. Shapes & Geometri

- **Micro Shapes (`0.25rem` / 4px - `rounded`):** Tag kategori kecil, indikator status titik warna.
- **Base Components (`0.5rem` / 8px - `rounded-lg`):** Tombol aksi standar, input teks, kartu tile menu POS, dropdown select.
- **Container Elements (`0.75rem` - `1rem` / 12px - 16px - `rounded-xl` / `rounded-2xl`):** Kartu metrik KPI, kartu resep HPP, tabel container, modal dialog.
- **Hero & Banner Frames (`1.5rem` / 24px - `rounded-3xl`):** Container utama hero calculator, banner promosi paket.
- **Pills & Avatars (`9999px` - `rounded-full`):** Nomor meja, chip status online/offline kasir, filter pill tombol.

---

## 7. Pola Komponen Spesifik F&B

### 7.1 Buttons & CTA
- **Primary:** `bg-lp-primary text-white font-semibold rounded-lg h-11 px-5 hover:bg-lp-primary-container active:scale-[0.98] transition-all`.
- **Secondary / Outline:** `bg-white border border-lp-outline-variant text-lp-on-surface hover:bg-lp-surface-low rounded-lg h-11 px-4`.
- **Destructive / Void:** `bg-red-50 text-lp-error border border-red-200 hover:bg-red-100 rounded-lg h-11 px-4 font-semibold`.

### 7.2 Kartu KPI Finansial
- Header: Label metrik `label-sm uppercase tracking-wider text-lp-tertiary`.
- Body: Nilai angka utama dalam `font-lp-mono text-2xl font-bold text-lp-on-surface`.
- Footer: Aksen badge perubahan performa (hijau `+14.2%` untuk laba, amber jika food cost meningkat).
- State ketiadaan data: Menampilkan tanda strip `-` atau *"Belum ada data"*, tidak pernah mengarang delta `0%`.

### 7.3 Resep Bahan Baku & Bill of Materials (BOM)
- Kartu resep menu menampilkan daftar bahan baku gramatur (`gr`/`ml`).
- Menghitung **HPP Total Otomatis** dibandingkan **Harga Jual**.
- Badge visual persentase **Gross Profit Margin** (Target sehat F&B >65%).

### 7.4 Struk Transaksi & Keranjang Kasir (POS Ticket Drawer)
- Menampilkan rincian subtotal, biaya layanan (PB1 10%), pajak restoran (PPN 11%), dan Grand Total dengan `font-lp-mono font-bold`.
- Tombol pembayaran instan (Tunai, QRIS Dinamis, Kartu Debit/Kredit).

### 7.5 Kitchen Display System (KDS) Cards
- Menampilkan nomor meja, nama tamu, dan durasi tiket sejak dipesan (`08:42` detik).
- Indikator warna timer: Hijau (<10 mnt), Amber (10–15 mnt), Merah berkedip (>15 mnt / Overdue SLA).
- Checkbox coret item saat makanan siap disajikan ke meja.

---

## 8. Panduan Implementasi Kode (Frontend Architecture)

Repo Next.js ini mengimplementasikan dua arsitektur UI yang **tidak boleh dicampur**:

1. **Light Backoffice & Landing (`lp-*` Tailwind Tokens):**
   - Didefinisikan di `app/globals.css` dengan prefix `--color-lp-*`.
   - Menggunakan utility: `bg-lp-primary`, `text-lp-on-surface`, `bg-lp-surface-low`, `border-lp-outline-variant`, `font-lp-sans`, `font-lp-mono`.
   - Komponen shadcn di `components/ui/*` menggunakan tema light yang serasi.
2. **Dark POS Kasir & KDS (`components/pos-ui.tsx`):**
   - Menggunakan CSS variable shell gelap: `var(--surface)`, `var(--panel)`, `var(--line)`, `var(--ink)`, `var(--muted)`.
   - Menghindari silau layar di lingkungan dapur atau counter bar malam hari.
3. **Format Angka & Uang:**
   - Selalu gunakan helper [`lib/format.ts`](file:///d:/project/node/2.frontend/tumbuh-fe/lib/format.ts) (`formatIDR`, `formatNumber`).
   - Dilarang membuat `toLocaleString` ad-hoc di komponen.
4. **Ikon:**
   - Menggunakan [`components/icon.tsx`](file:///d:/project/node/2.frontend/tumbuh-fe/components/icon.tsx) (Google Material Symbols). Dilarang keras memakai karakter emoji sebagai ikon antarmuka.

---
*Dokumen ini disinkronkan secara resmi dengan Stitch Project `2361311057318663865` (Remix of Tumbuh POS Backoffice Dashboard).*