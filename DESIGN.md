# Tumbuh POS & Backoffice — Design System Specification

> **Single Source of Truth** untuk seluruh implementasi UI Tumbuh POS & Backoffice.
> Baca ini sebelum menulis komponen atau styling apa pun.
> Implementasi konkret (file, token, helper) ada di [§7 Mapping ke kode](#7-mapping-ke-kode).

Cakupan: POS kasir, backoffice (dashboard owner, laporan, inventori, resep/HPP,
keuangan, multi-outlet), dan landing/marketing.

---

## 1. Prinsip Desain

- **Brand essence** — Pertumbuhan (*Growth*), Presisi Finansial (*Accuracy*), Kecepatan Operasional (*Speed & Reliability*).
- **Domain** — F&B Indonesia: kafe, coffee shop, bistro, restoran dine-in, bakery & pastry, quick service.
- **High visibility** — kontras tinggi; UI dibaca di kafe remang dan dapur sibuk, bukan di ruang designer.
- **Data clarity** — teks naratif dan angka akuntansi/inventori dipisah tegas (font berbeda, lihat §3).
- **Touch first** — operator kasir memakai tablet; target sentuh ≥44px.

---

## 2. Warna

Token di kode berprefix `lp-` untuk namespace landing/backoffice **light**
(`--color-lp-*` di [`app/globals.css`](app/globals.css)). POS gelap punya
namespace sendiri (`--surface`, `--panel`, `--ink`, `--muted`) — lihat §7.2.

### 2.1 Primary & Brand (Emerald Growth)

| Token | Hex | Pemakaian | Utility |
|---|---|---|---|
| `primary` | `#059669` | CTA utama, status aktif, link aktif | `lp-primary` |
| `primary-container` | `#00855d` | Hover CTA, container aksen sekunder | `lp-primary-container` |
| `primary-fixed` | `#85f8c4` | Pill badge aktif, chip highlight lembut, badge "Paling Populer" | `lp-primary-fixed` |
| `primary-fixed-dim` | `#68dba9` | Border & highlight sekunder | `lp-primary-fixed-dim` |
| `on-primary` | `#ffffff` | Teks di atas primary | `lp-on-primary` |
| `on-primary-container` | `#f5fff7` | Teks di atas container emerald pekat | `lp-on-primary-container` |
| `on-primary-fixed` | `#002114` | Teks gelap di atas `primary-fixed` | `lp-on-primary-fixed` |

### 2.2 Neutral Surfaces

| Token | Hex | Pemakaian | Utility |
|---|---|---|---|
| `background` | `#f8f9ff` | Latar global aplikasi | `lp-background` |
| `surface` | `#f8f9ff` | Permukaan konten dasar | `lp-surface` |
| `surface-container-lowest` | `#ffffff` | Kartu utama, modal, input | `lp-surface-container-lowest` |
| `surface-container-low` | `#eff4ff` | Section komparasi, striping tabel, panel filter | `lp-surface-low` |
| `surface-container` | `#e5eeff` | Input focus, badge kategori sekunder | `lp-surface-container` |
| `surface-container-high` | `#dce9ff` | Hover elemen sekunder | `lp-surface-container-high` |
| `surface-container-highest` | `#d3e4fe` | Placeholder, divider tebal, disabled | `lp-surface-container-highest` |
| `inverse-surface` | `#213145` | Footer gelap, elemen dark theme | `lp-inverse-surface` |
| `inverse-on-surface` | `#eaf1ff` | Teks di atas surface gelap | `lp-inverse-on-surface` |

### 2.3 Teks & Kontras

| Token | Hex | Pemakaian | Utility |
|---|---|---|---|
| `on-background` | `#0b1c30` | Teks utama (Deep Navy) | `lp-on-background` |
| `on-surface` | `#0b1c30` | Heading, judul kartu, label form | `lp-on-surface` |
| `on-surface-variant` | `#3d4a42` | Deskripsi sekunder, subtitle, help text | `lp-on-surface-variant` |
| `tertiary` | `#545c72` | Metadata, label eyebrow | `lp-tertiary` |
| `outline` | `#6d7a72` | Border form aktif, divider sekunder | `lp-outline` |
| `outline-variant` | `#bccac0` | Border kartu subtle, garis tabel | `lp-outline-variant` |

### 2.4 Status & Indikator Finansial

Ini bagian paling domain-spesifik: warna = sinyal operasional, bukan dekorasi.

| Status | Background | Foreground | Utility | Sinyal di F&B POS |
|---|---|---|---|---|
| **Success** | `lp-primary-fixed` / `#ecfdf5` | `#059669` | `bg-lp-primary-fixed/40 text-lp-on-primary-fixed` | Selisih kas Rp 0, POS online, margin >65% |
| **Warning / Amber** | `lp-secondary-container` `#fea619` | `#855300` | `bg-lp-secondary-container text-lp-secondary` | Stok mendekati minimum, HPP naik, paket rekomendasi |
| **Critical / Error** | `lp-error-container` `#ffdad6` | `lp-on-error-container` `#93000a` | `bg-lp-error-container text-lp-on-error-container` | Stok habis, selisih kas, transaksi void |
| **Info / Tertiary** | `lp-surface-container` `#e5eeff` | `lp-tertiary` `#545c72` | `bg-lp-surface-container text-lp-tertiary` | Notifikasi fitur, info sinkronisasi cloud |

Token amber/error yang tersedia: `lp-secondary` `#855300`,
`lp-secondary-container` `#fea619`, `lp-on-secondary-container` `#684000`,
`lp-error` `#ba1a1a`, `lp-error-container` `#ffdad6`, `lp-on-error-container` `#93000a`.

> **Aturan kontras** — jangan pasang teks hijau di atas mint atau merah di atas
> pink. Pasangan aman: `on-primary-fixed` / `on-error-container` (gelap di atas
> tint terang). Semua teks body ≥4.5:1; label 11px harus weight ≥600.

---

## 3. Tipografi

Dua keluarga, pairing terstandarisasi — Plus Jakarta Sans untuk seluruh teks UI,
JetBrains Mono **hanya** untuk angka.

1. **Plus Jakarta Sans** — heading, navigasi, label form, tombol, paragraf.
2. **JetBrains Mono** — Rupiah (IDR), gramatur bahan (gr/ml/kg), persentase
   margin, SKU/barcode, jam & tanggal pada header data.

Wajib pakai mono untuk: nilai uang, kuantitas terukur, persentase margin,
kode produk. Dilarang untuk: judul, label, deskripsi, tombol.

### 3.1 Type Scale

| Gaya | Font | Size | Weight | LH | Pemakaian |
|---|---|---|---|---|---|
| `display-lg` | Jakarta | 36–48px | 800–900 | 1.15–1.2 | Hero landing |
| `headline-lg` | Jakarta | 24–28px | 700 | 1.25 | Judul halaman backoffice, judul section |
| `headline-md` | Jakarta | 18–20px | 600–700 | 1.3 | Judul kartu metrik, nama menu, nama outlet |
| `headline-sm` | Jakarta | 16px | 600 | 1.4 | Subjudul grup form, nama kolom tabel |
| `body-lg` | Jakarta | 16px | 400–500 | 1.5 | Paragraf pengantar, testimoni |
| `body-md` | Jakarta | 14px | 400–500 | 1.4 | Teks default UI, deskripsi tabel, placeholder |
| `body-sm` | Jakarta | 12px | 400–500 | 1.3 | Help text, catatan kaki struk, metadata |
| `label-xs` | Jakarta | 11px | 600 | 1.2 | Chip badge, status indicator |
| `data-currency-lg` | JetBrains | 24–32px | 700 | 1.1 | Omzet utama, total transaksi |
| `data-currency` | JetBrains | 14–16px | 600 | 1.2 | Harga menu, subtotal struk, HPP per porsi |
| `data-mono-sm` | JetBrains | 12px | 500 | 1.2 | Gramatur resep (`18.5 gr`, `120 ml`) |

Base 16px. Body text tidak boleh <12px; 11px hanya untuk chip/label uppercase
dengan `tracking-wider`.

---

## 4. Radius & Elevation

### 4.1 Radius

| Utility | Nilai | Pemakaian |
|---|---|---|
| `rounded-md` | 6px | Tombol kecil, badge angka notifikasi |
| `rounded-lg` | 8px | Input, select, tombol aksi standar |
| `rounded-xl` | 12px | Kartu menu kasir, wrapper header tabel, modal |
| `rounded-2xl` | 16px | **Kartu KPI finansial utama**, widget kalkulator HPP, mockup |
| `rounded-3xl` | 24px | Banner promosi CTA, hero wrapper |
| `rounded-full` | 9999px | Avatar, pill button, chip status shift |

### 4.2 Elevation

| Utility | Pemakaian |
|---|---|
| `shadow-sm` | Kartu data, input saat focus |
| `shadow-md` | Dropdown, popover resep bahan |
| `shadow-lg` | Kartu paket rekomendasi, floating notification |
| `shadow-xl` | Modal rekonsiliasi kasir, preview struk |

Aturan: satu level elevasi per lapisan. Kartu di dalam modal tidak boleh
`shadow-xl` lagi. Shadow pakai `rgba(0,0,0,0.04)`–`0.08`, bukan hitam pekat.

---

## 5. Komponen F&B

### 5.1 Tombol

**Primary** — `bg-lp-primary text-lp-on-primary`, `font-bold`, hover
`bg-lp-primary-container`, radius `rounded-lg` (standar) atau `rounded-xl`
(CTA), padding `px-4 py-2.5` / CTA `px-6 py-3.5`.

**Secondary/Outline** — background `lp-surface-container-lowest` atau
`lp-surface-low`, border `border-lp-outline-variant`, teks `lp-on-surface` atau
`lp-primary`, hover `bg-lp-surface-container`.

Touch target minimum 44px (`h-11`) untuk semua tombol di POS dan toolbar
backoffice. Tombol ikon-saja wajib `aria-label`.

Implementasi: [`components/ui/button.tsx`](components/ui/button.tsx) (light),
[`components/pos-ui.tsx`](components/pos-ui.tsx) (gelap POS).

### 5.2 Input & Form

- Tinggi `h-10` (desktop) atau `h-11` (target sentuh kasir tablet).
- Background `#ffffff`, radius `rounded-lg`, padding `px-3.5 py-2`.
- Border `border-lp-outline-variant/60`, focus
  `focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/20`.
- Label di atas input: `text-xs font-semibold text-lp-on-surface mb-1.5`.
- Error inline **di bawah field**, dengan slot `min-h-4` yang sudah disiapkan
  (mencegah layout shift merebut klik di tengah gestur). Lihat §7.4.

### 5.3 Kartu Resep & BOM

- Header: nama menu + kategori.
- Tabel mikro: *Nama Bahan* · *Takaran (gr/ml)* · *Biaya Satuan* · *Subtotal HPP*.
  Takaran & biaya wajib `font-mono`.
- Footer: **Total HPP** (JetBrains Mono, `data-currency`) disandingkan
  **Harga Jual** dan badge **Gross Profit Margin** (mis. `68.8%`).

### 5.4 Kartu KPI Ringkasan

- Header: nama metrik (`label-xs` uppercase `lp-tertiary`) + judul
  (`headline-md`) + ikon 40×40 dalam `rounded-lg bg-lp-surface-low`.
- Body: angka primer `font-mono text-2xl font-bold text-lp-on-surface`.
- Footer: badge delta hijau (`+24.8%`) atau merah (kebocoran bahan), plus
  catatan pembanding.
- Aksen: rule 4px di tepi bawah kartu, warna sesuai domain metrik.
- Tanpa baseline pembanding → **jangan** render `0%`; sembunyikan chip-nya.

Implementasi: [`kpi-card.tsx`](app/(backoffice)/dashboard/kpi-card.tsx).

### 5.5 Tabel Data

- Header `label-xs` uppercase `lp-tertiary`.
- Baris dipisah `border-lp-surface-container`; striping opsional
  `bg-lp-surface-low`.
- Kolom angka rata kanan + `font-mono`. Kolom teks rata kiri.

---

## 6. Konfigurasi Referensi

Dokumen ini adalah sumbernya. **Jangan** menyalin blok `tailwind.config` ke
proyek ini — repo memakai Tailwind v4 tanpa config, token hidup di
`@theme` di `app/globals.css` (§7.1). Blok di bawah hanya referensi kalau
proyek lain perlu memetakan palette ini ke Tailwind.

```javascript
// REFERENSI SAJA — bukan untuk ditempel ke tumbuh-fe.
{
  colors: {
    primary: "#059669", "primary-container": "#00855d",
    "primary-fixed": "#85f8c4", "on-primary": "#ffffff",
    "on-primary-container": "#f5fff7", "on-primary-fixed": "#002114",
    surface: "#f8f9ff", "surface-container-lowest": "#ffffff",
    "surface-container-low": "#eff4ff", "surface-container": "#e5eeff",
    "surface-container-high": "#dce9ff", "surface-container-highest": "#d3e4fe",
    "inverse-surface": "#213145", "inverse-on-surface": "#eaf1ff",
    "on-surface": "#0b1c30", "on-surface-variant": "#3d4a42",
    tertiary: "#545c72", outline: "#6d7a72", "outline-variant": "#bccac0",
    secondary: "#855300", "secondary-container": "#fea619",
    error: "#ba1a1a", "error-container": "#ffdad6", "on-error-container": "#93000a",
  },
  fontFamily: { sans: ["Plus Jakarta Sans"], mono: ["JetBrains Mono"] },
  borderRadius: { lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" },
}
```

---

## 7. Mapping ke Kode

### 7.1 Token

Token warna & font di `app/globals.css`, prefix `--color-lp-*` /
`--font-lp-*` → utility `bg-lp-*`, `text-lp-*`, `font-lp-sans`, `font-lp-mono`.

`--font-lp-*` **wajib** di blok `@theme inline`. Token derived di blok
`@theme` biasa di-substitusi di `:root`, tempat `next/font` tidak pernah
menaruh `--font-landing-*`, sehingga seluruh font stack jatuh ke
*guaranteed-invalid* dan diam-diam jadi Geist. Terapkan `plusJakarta.variable`
/ `jetbrainsMono.variable` di root halaman yang memakainya
(`app/page.tsx`, `app/(backoffice)/dashboard/page.tsx`,
`app/(auth)/login/owner/owner-panel.tsx`).

### 7.2 Dua tema, jangan dicampur

| Tema | Token | Komponen | Halaman |
|---|---|---|---|
| Light (backoffice/landing/auth) | `lp-*` | `components/ui/*`, `components/landing/*` | `/`, `/login`, `/register`, `/dashboard` (+ `owner-shell.tsx`), legal |
| Dark (POS) | `--surface`/`--panel`/`--ink`/`--muted` | `components/pos-ui.tsx` | `/pos`, `/kasir` |

`/reports` memakai `AppNav` gelap di atas konten light — itu satu-satunya
halaman campuran yang diizinkan saat ini.

### 7.3 Angka & format

Semua uang lewat [`lib/format.ts`](lib/format.ts) (`formatIDR`, `formatNumber`)
— jangan `toLocaleString` ad-hoc. Bungkus dalam `font-lp-mono`.

### 7.4 Form

`react-hook-form` + `zodResolver`; schema colocated dengan route; `z.infer`
sebagai satu-satunya sumber tipe. Error inline per field dengan slot `min-h-4`.

### 7.5 Ikon

Material Symbols via [`components/icon.tsx`](components/icon.tsx). **Dilarang**
emoji sebagai ikon. Ikon dekoratif selalu `aria-hidden` (sudah di-handle
komponen); tombol ikon-saja tetap butuh `aria-label`.

---

## 8. Checklist Sebelum Kirim UI

1. Kontras teks ≥4.5:1 (≥3:1 untuk elemen grafis) di light **dan** dark.
2. Target sentuh ≥44×44px; jarak antar target ≥8px.
3. Fokus keyboard terlihat di semua kontrol interaktif.
4. Angka uang/persentase pakai `font-lp-mono`; tidak ada warna mentah di komponen.
5. Satu level elevasi per lapisan; tidak ada scroll horizontal di 360px.
6. `prefers-reduced-motion` dihormati untuk animasi non-esensial.
7. Ikon dari `components/icon.tsx`, bukan emoji; ikon-saja punya label.
8. Empty state eksplisit ("Belum ada data"), bukan kartu kosong tanpa penjelasan.
9. Delta/risiko tanpa baseline ditampilkan sebagai ketiadaan, bukan `0%`.
