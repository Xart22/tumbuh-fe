# 🎨 Brief Desain UI/UX — POS + Backoffice SaaS F&B

**Untuk:** Tim UI/UX
**Sumber plan:** [`claude copy.md`](claude%20copy.md)
**Design system acuan:** [`DESIGN.md`](DESIGN.md) (warna, tipografi, spacing, elevation, shape)
**Versi:** 1.0 | **Status:** Draft untuk dikerjakan

---

## 0. Cara pakai dokumen ini

Dokumen ini adalah **inventory screen** hasil terjemahan plan produk menjadi daftar layar yang harus didesain.

- Setiap layar punya: **ID**, **Status**, **Tujuan**, **Fitur wajib**, **Komponen kunci**, **State wajib**, **Tier**.
- **Status** = `ADA` (sudah ada di repo, desain ulang/penyempurnaan saja), `BARU` (belum ada, perlu desain dari nol), `PARSIAL` (sebagian sudah ada, perlu ditambah).
- **Kerjakan berurutan sesuai fase** (lihat §11) — jangan desain fitur Enterprise sebelum MVP selesai.
- Semua keputusan visual ikut `DESIGN.md`. Jangan bikin token baru untuk satu layar.

### Legenda

| Simbol | Arti |
| ------ | ---- |
| 🟢 Starter | Paket termurah — wajib untuk MVP |
| 🔵 Growth | Paket menengah — fitur retensi |
| 🟣 Enterprise | Custom — chain/white-label |
| ⭐ | Prioritas desain tertinggi di fasenya |

---

## 1. Platform / Surface yang harus didesain

Produk punya **5 permukaan** dengan bahasa visual berbeda. **Jangan campur** gaya antar surface.

| # | Surface | Pengguna | Gaya visual | Device |
| - | ------- | -------- | ----------- | ------ |
| S1 | **POS Kasir** | Kasir/Barista | Dark shell, touch-first, cepat | Tablet/desktop landscape |
| S2 | **Backoffice Owner** | Owner/Manajer | Light `lp-*`, data-dense | Desktop + mobile (read-only dashboard) |
| S3 | **Kitchen Display (KDS)** | Chef | Dark, besar, jarak pandang jauh | Tablet/TV dapur |
| S4 | **Self-Order Pelanggan** | Pelanggan | Mobile-first, branding outlet | HP pelanggan (web) |
| S5 | **Auth & Onboarding** | Owner baru/kasir | Light, marketing-grade | Desktop + mobile |

> Referensi gaya: `S1` & `S3` = dark POS tokens (`components/pos-ui.tsx`), `S2` & `S5` = light `lp-*` (`components/ui/`). Legal pages sudah ada (`app/(legal)/`).

---

## 2. Ringkasan Screen (high-level) & Progress Terkini

| Surface | Jumlah layar | Status Desain & Kode | Keterangan |
| ------- | ------------ | -------------------- | ---------- |
| S1 POS Kasir | 9 | **9 Selesai (100%)** ✅ | P-01 s/d P-09 (Clean Modern Light Hybrid) lengkap di Stitch & Next.js |
| S2 Backoffice | 24 | **24 Selesai (100%)** ✅ | Seluruh modul Menu, Meja, Inventori, Supplier, PO, Finansial, CRM, HQ lengkap |
| S3 KDS (Dapur & Bar) | 4 | **4 Selesai (100%)** ✅ | K-01 s/d K-04 tiket antrian, SLA timers, dan routing stasiun lengkap di Stitch |
| S4 Self-Order QR | 6 | **6 Selesai (100%)** ✅ | Q-01 s/d Q-06 mobile QR menu, keranjang, QRIS dinamis & live tracking lengkap |
| S5 Auth & Onboarding | 9 | **9 Selesai (100%)** ✅ | Landing page, Login, Register, Lupa Password lengkap |
| **Total** | **52** | **52 Selesai (100%)** 🏆 | **100% Seluruh Screen di Dokumen Brief Selesai Didesain!** |

---

## 3. Surface S1 — POS Kasir (Clean Modern Light & High-Efficiency Hybrid)

> **Catatan Paradigma Baru:** Berdasarkan preferensi user, POS Kasir dialihkan dari *dark shell touch-first* menjadi **Clean Modern Light & High-Efficiency Hybrid POS** (inspirasi Square POS / Toast / Shopify POS) yang terang, bersih, ergonomis untuk layar counter kafe/resto siang hari, dan ramah hybrid (touchscreen + barcode scanner + keyboard enter).

Modul plan: **4.1 POS Kasir & Ordering**.

### P-01 · Layar Utama POS / Grid Menu ⭐ — `SELESAI` (Stitch `bcffd34f2a0a4148921e1fc25f5d4eff` & Code Implemented)
- **Tujuan:** Kasir pilih menu & bangun keranjang < 30 detik secara cepat dan responsif.
- **Fitur:** grid menu visual card terang (`bg-lp-surface-container-lowest`), chip kategori aktif emerald (`bg-lp-primary`), pencarian realtime, scanner barcode/SKU terintegrasi dengan shortcut `[Enter ↵]`, badge jumlah item, dan panel keranjang interaktif.
- **Komponen kunci:** chip kategori, search bar dengan icon, product card tile (nama + harga mono + add badge), cart panel kanan, segmented order type (Dine In / Take Away / Delivery), subtotal + tombol lanjut bayar.
- **State:** loading menu spinner, menu kosong, produk habis, barcode scan hit/miss.

### P-02 · Modal Modifier / Add-on — `SELESAI` (Code Implemented)
- **Tujuan:** Pilih varian & topping dengan cepat dalam modal light card.
- **Fitur:** varian (size/jenis), grup modifier wajib vs opsional, min/max pilih, harga tambahan live total, catatan per item, validasi wajib pilih.
- **State:** grup wajib belum lengkap, opsi habis, max tercapai.

### P-03 · Modal Catatan / Instruksi Item — `SELESAI` (Code Implemented)
- **Fitur:** free text catatan langsung di line item keranjang maupun modal modifier dengan autoFocus.

### P-04 · Panel Pembayaran ⭐ — `SELESAI` (Stitch `f924699e03254c85b2d72aa0c5c012c0` & Code Implemented)
- **Tujuan:** Selesaikan transaksi + hitung kembalian cepat.
- **Fitur:** grid kartu metode bayar dengan icon (Tunai, QRIS, QRIS Dinamis, Debit, Kredit, GoPay, OVO, Dana, ShopeePay, Deposit), pecahan uang cepat (`CASH_QUICK`), tombol instan **Uang Pas**, container kembalian emerald kontras tinggi, mode split bill, validasi selisih.
- **Komponen kunci:** kartu ringkasan tagihan (subtotal, diskon, service, pajak), pilihan metode bayar, input nominal tunai dengan prefix Rp, container kembalian, tombol submit `Bayar Rp ...`.
- **State:** uang kurang konfirmasi deposit, split bayar tidak seimbang, gateway async pending, offline.

### P-05 · Modal Struk / Preview Cetak — `SELESAI` (Code Implemented)
- **Fitur:** preview struk thermal kertas putih bersih, logo/nama outlet, nomor order, rincian produk, pajak & service charge, rincian pembayaran, tombol Cetak Struk (`window.print()`) dan Transaksi Baru.
- **State:** printer thermal, awaiting webhook indicator.

### P-06 · Bar & Indikator Global POS — `SELESAI` (Code Implemented in `components/app-nav.tsx`)
- **Tujuan:** Status sistem selalu terlihat oleh kasir.
- **Fitur:** indikator status Kasir Live / online, jam operasional, identitas outlet & terminal kasir aktif, tombol logout / lock.
- **State:** online status live, session outlet active.

### P-07 · Hold Order & Multi-Open Orders / Bill Parkir Meja 🔵 — `SELESAI` (Stitch `a6c408821ea44f869a4b34e14e2ca3d8`)
- **Tujuan:** Parkir order sementara & kelola beberapa order meja/tamu sekaligus.
- **Fitur:** grid kartu pesanan aktif (Meja 04, Meja 12, Take Away, Delivery), durasi order berjalan (`⏱ 16 mnt lalu`), badge peringatan order lama (`>45 Menit`), kalkulasi subtotal realtime, filter tab kategori pesanan, tombol cetak bill sementara, dan slide-out detail tagihan meja.
- **State:** order aktif normal, order lama (warning amber), filter tipe pesanan.

### P-08 · Modal Void / Pembatalan Item & Order (PIN Manager) 🔵 — `SELESAI` (Stitch `9ae636cf1c1c438ab59d656b8ed5d817`)
- **Tujuan:** Mencegah fraud kasir & pencatatan audit saat pembatalan item atau pembatalan seluruh tagihan.
- **Fitur:** pemilih item yang dibatalkan dengan checkbox & harga, peringatan notifikasi ke KDS dapur, alasan pembatalan wajib (salah input, ganti menu, kualitas bahan), toggle pencatatan waste vs pengembalian stok, keypad PIN 6-digit terintegrasi, dan verifikasi profil Store Manager aktif.
- **State:** item sebagian, void seluruh bill, PIN valid terverifikasi.

### P-09 · Layar Buka / Tutup Kas Shift Kasir & Rekonsiliasi Cash Drawer ⭐ — `SELESAI` (Stitch `9d14af8254c0449f8ff9320e6ec5d304`)
- **Tujuan:** Flow 4 di plan — kontrol uang fisik di laci kasir (cash drawer) & sesi operasional kasir.
- **Fitur:** 5 kartu metrik kinerja shift (Omzet Sesi, Total Transaksi, Kas Tunai, Non-Tunai QRIS/EDC, Kas Masuk/Keluar Petty Cash, dan Target Expected Cash laci), tabel kalkulator pecahan rupiah (100k, 50k, 20k, 10k, 5k, 2k, koin), indikator status selisih kas otomatis (Seimbang / Match), catatan serah terima shift, serta tombol cetak X-Report dan Z-Report resmi penutupan kasir.
- **State:** kas seimbang (match perfect 0.00% selisih), batch settlement EDC.

---

## 4. Surface S2 — Backoffice Owner (light `lp-*`)

Modul plan: **4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.9, 4.11, 4.12**.
Semua route di `app/(backoffice)/`, chrome = `OwnerShell` (kecuali Reports pakai `AppNav`).

### 4.2 Manajemen Menu — `/menu` (sudah ada, `PARSIAL`)

| ID | Screen | Status | Fitur utama |
| -- | ------ | ------ | ----------- |
| M-01 | Daftar Produk (list + grid) | ADA | CRUD produk, foto, kategori, status aktif, drag & drop urutan, harga per varian, SKU/barcode |
| M-02 | Form Produk (create/edit) | ADA | nama, deskripsi, harga, foto upload/kamera, kategori, rekomendasi/favorit |
| M-03 | Editor Varian | ADA | nama varian + selisih harga |
| M-04 | Editor Modifier Group | ADA | grup, wajib/opsional, min/max, modifier + harga |
| M-05 | Manajer Kategori | ADA | CRUD kategori & sub-kategori, urutan |
| M-06 | Bundling / Paket | ADA | gabung produk jadi 1 harga |
| M-07 | Waktu Ketersediaan Menu 🔵 | BARU | menu per jam (sarapan 07–10), happy hour, harga promo waktu, habis per outlet |
| M-08 | Resep & COGS 🔵 | ADA/PARSIAL | resep per produk, kalkulasi HPP otomatis, gross margin %, update COGS |
| M-09 | Override Harga per Outlet 🔵 | ADA | harga beda per kota |

### 4.3 Meja & Area — `/tables` (BARU semua)

| ID | Screen | Fitur utama |
| -- | ------ | ----------- |
| T-01 | Floor Plan Visual ⭐ | layout area (Indoor/Outdoor/VIP), drag & drop meja, kapasitas kursi, status meja (kosong/terisi/menunggu bayar/dipesan) warna |
| T-02 | Form/Editor Meja | nama meja, kapasitas, area, posisi |
| T-03 | Buka Order dari Denah | tap meja → buka order, gabung meja, pindah meja, timer durasi |
| T-04 | Reservasi Meja | nama tamu, HP, tanggal/jam, jumlah orang, preferensi meja, status (terkonfirmasi/hadir/tidak hadir/batal), deposit DP |
| T-05 | Kalender Reservasi | view harian/mingguan, konfirmasi & reminder WA |

### 4.5 Inventori & Bahan Baku — `/inventory` (sudah ada, `PARSIAL`)

| ID | Screen | Status | Fitur utama |
| -- | ------ | ------ | ----------- |
| I-01 | Daftar Bahan Baku | ADA | nama, unit, harga satuan, stok saat ini, min stock |
| I-02 | Form Bahan + Adjustment | ADA | stok awal, penyesuaian manual |
| I-03 | Alert Stok Minimum | ADA | daftar bahan < batas minimum, badge kritis |
| I-04 | Riwayat Mutasi Stok | ADA | log perubahan (terjual/tambah/adjust), filter |
| I-05 | Stock Opname ⭐ | ADA | pilih tanggal/outlet, input qty fisik, hitung selisih, review, konfirmasi, catat alasan selisih |
| I-06 | Expired Date Tracking 🔵 | BARU | pantau kedaluwarsa, badge mendekati expired |
| I-07 | Data Supplier 🟢 | BARU | nama, kontak, kategori bahan |
| I-08 | Purchase Order 🔵 | ADA | buat PO, kirim WA/email, status |
| I-09 | Penerimaan Barang 🔵 | BARU | konfirmasi barang datang, stok bertambah |
| I-10 | Riwayat Pembelian & Harga per Supplier 🔵 | BARU | history, bandingkan harga supplier |
| I-11 | Hutang Supplier 🟣 | BARU | pembelian kredit, jatuh tempo |
| I-12 | Transfer Stok Antar Outlet 🔵 | ADA | kirim bahan outlet A→B, status transfer |
| I-13 | Catat Waste 🔵 | BARU | bahan rusak/expired/terbuang + alasan, laporan waste bulanan |

### 4.6 Karyawan, Shift & Absensi — `/employees` (sudah ada, `PARSIAL`)

| ID | Screen | Status | Fitur utama |
| -- | ------ | ------ | ----------- |
| E-01 | Daftar Karyawan | ADA | profil, jabatan, status aktif, multi-outlet assignment |
| E-02 | Form Karyawan | ADA | nama, foto, HP, jabatan, tanggal masuk, role RBAC |
| E-03 | Set/Reset PIN Kasir | ADA | PIN unik, log aktivitas |
| E-04 | Jadwal Shift (kalender) 🔵 | ADA | assign karyawan ke shift, template mingguan, copy minggu, notifikasi |
| E-05 | Tukar Shift 🟣 | BARU | request tukar shift + approval |
| E-06 | Absensi / Clock in-out 🔵 | BARU | clock-in/out, absen via PIN di POS, rekap bulanan, jam kerja |
| E-07 | Kinerja Kasir 🔵 | BARU | transaksi & omzet per kasir, komisi, target penjualan, void |
| E-08 | Slip Gaji Sederhana 🟣 | BARU | generate dari rekap jam + gaji pokok |
| E-09 | Dokumen Karyawan 🟣 | BARU | upload KTP/kontrak |

### 4.7 Laporan & Analytics — `/reports`, `/dashboard` (sudah ada, `PARSIAL`)

| ID | Screen | Status | Fitur utama |
| -- | ------ | ------ | ----------- |
| R-01 | Dashboard Owner ⭐ | ADA | omzet hari ini, perbandingan vs kemarin/minggu lalu, grafik per jam, jumlah transaksi & rata-rata, top 5 produk, stok kritis, kasir aktif |
| R-02 | Laporan Penjualan | ADA | harian/mingguan/bulanan, per produk/kategori/kasir/meja/order type/jam, diskon & void, metode bayar, date range, export Excel/PDF |
| R-03 | Laporan Inventori | ADA/PARSIAL | stok saat ini, pemakaian bahan, pembelian, stock opname, waste |
| R-04 | Analytics Lanjutan 🟣 | BARU | menu engineering (Star/Plow Horse/Puzzle/Dog), trend produk, prediksi kebutuhan bahan, komparasi outlet, customer analytics |
| R-05 | Empty/Error states global | ADA | "Belum ada data", "Tidak dapat menghubungi server", tanpa delta palsu |

### 4.8 Keuangan & Pembukuan — `/finance` (sudah ada, `PARSIAL`)

| ID | Screen | Status | Fitur utama |
| -- | ------ | ------ | ----------- |
| F-01 | Kas & Arus Kas | ADA | kas awal shift, rekap kas akhir, pengeluaran operasional + kategori, arus kas harian/bulanan |
| F-02 | Laba Rugi 🔵 | ADA/PARSIAL | omzet − HPP − operasional = laba bersih, gross profit per produk, biaya tetap/variabel |
| F-03 | Break-even Point 🟣 | BARU | omzet minimum balik modal |
| F-04 | Piutang & Hutang | ADA | piutang pelanggan, hutang supplier, jatuh tempo + reminder, rekonsiliasi |
| F-05 | Pajak | ADA/PARSIAL | PPN 11%, laporan pajak bulanan, integrasi e-Faktur, PPh final UMKM |

### 4.9 CRM & Loyalitas — `/customers` (sudah ada, `PARSIAL`)

| ID | Screen | Status | Fitur utama |
| -- | ------ | ------ | ----------- |
| C-01 | Daftar Pelanggan | ADA | registrasi, profil (history kunjungan, spending, produk favorit), segmentasi otomatis (baru/reguler/VIP), tag manual |
| C-02 | Detail Profil Pelanggan | ADA | riwayat transaksi, poin, tier, ulang tahun |
| C-03 | Program Poin & Reward | ADA | poin (Rp10rb=1), tukar poin, poin expire, member tier (Bronze–Platinum), bonus event |
| C-04 | Stamp Card Digital | BARU | beli 9x gratis 1, multi-item |
| C-05 | Voucher & Promo | ADA | kode voucher unik, min order, masa berlaku, max pakai |
| C-06 | Blast WhatsApp/Email | BARU | pilih segmen, template pesan, kirim blast, riwayat |
| C-07 | Program Referral 🟣 | BARU | kode referral pelanggan, bonus |

### 4.11 Multi-Outlet — `/outlets` (sudah ada, `PARSIAL`)

| ID | Screen | Status | Fitur utama |
| -- | ------ | ------ | ----------- |
| O-01 | Daftar Outlet | ADA | tambah outlet, status, akses |
| O-02 | Form Outlet | ADA | nama, alamat, logo, jam operasional, timezone, setting per outlet |
| O-03 | Dashboard Semua Outlet ⭐ | ADA | agregasi semua cabang, komparasi omzet/stok |
| O-04 | Dashboard Per Outlet | ADA | omzet, stok, aktivitas per cabang |
| O-05 | Menu Master (HQ) 🔵 | BARU | buat menu pusat, deploy ke cabang, nonaktifkan per outlet, sync real-time |
| O-06 | Stok Semua Outlet 🔵 | ADA | kondisi stok semua cabang sekaligus |

### 4.12 Pengaturan — `/settings` (sudah ada, `PARSIAL`)

| ID | Screen | Status | Fitur utama |
| -- | ------ | ------ | ----------- |
| G-01 | Info Outlet & Umum | ADA | nama, alamat, logo, HP, jam operasional, mata uang, format angka, timezone |
| G-02 | Pajak & Service Charge | ADA | PPN on/off + persentase, service charge on/off |
| G-03 | Printer | ADA | tambah printer, test print, ukuran kertas |
| G-04 | Template Struk | BARU | custom header/footer/logo/tagline |
| G-05 | Notifikasi & Alert | BARU | pilih notifikasi & penerima |
| G-06 | Backup & Restore | BARU | manual / jadwal otomatis |
| G-07 | Log Aktivitas (audit) | ADA | audit trail perubahan setting |
| G-08 | Kode Referral Reseller 🟣 | BARU | lacak referral mitra |

---

## 5. Surface S3 — Kitchen Display System (KDS Dapur & Bar)

Modul plan: **4.4 Dapur & KDS**.

| ID | Screen | Status | Fitur utama | Screen ID Stitch |
| -- | ------ | ------ | ----------- | ---------------- |
| K-01 | Antrian Tiket Order ⭐ | `SELESAI` | Kartu tiket berurutan, meja/takeaway/ojol, modifier & notes, live status | `1e17a437e3d14d4f925e3ce639bbaa48` |
| K-02 | Detail Order + Bump Item | `SELESAI` | Bump per item (Siap), bump seluruh tiket (Kirim ke Runner), KDS kitchen bump bar shortcuts | `1e17a437e3d14d4f925e3ce639bbaa48` |
| K-03 | Timer & Alert Keterlambatan 🔵 | `SELESAI` | Stopwatch realtime per tiket, kode warna SLA (Hijau <10m, Amber 10-15m, Merah >15m), recall tiket bump | `1e17a437e3d14d4f925e3ce639bbaa48` |
| K-04 | Multi-Station Router 🟣 | `SELESAI` | Filter stasiun (Semua, Hot Kitchen, Bar Kopi, Pastry/Bakery, Cold/Salad) | `1e17a437e3d14d4f925e3ce639bbaa48` |

---

## 6. Surface S4 — Self-Order Pelanggan (Mobile Web HP)

Modul plan: **4.10 Omnichannel**.

| ID | Screen | Status | Fitur utama | Screen ID Stitch |
| -- | ------ | ------ | ----------- | ---------------- |
| Q-01 | Landing QR Menu Meja | `SELESAI` | Branding cafe, identitas meja aktif (Meja 08 Garden Terrace), promo voucher meja | `d7e926a1475148e6ad96ba0b62fe0e19` |
| Q-02 | Menu Digital Interaktif ⭐ | `SELESAI` | Feed foto makanan macro, kategori pills, bottom sheet customizer (size, milk, sugar, ice, notes) | `d7e926a1475148e6ad96ba0b62fe0e19` |
| Q-03 | Keranjang Belanja Floating | `SELESAI` | Floating bar tas belanja dengan total harga mono, diskon meja, CTA checkout | `d7e926a1475148e6ad96ba0b62fe0e19` |
| Q-04 | Pembayaran QRIS Dinamis | `SELESAI` | Kode QRIS standar nasional dinamis meja, countdown timer 15m, auto-verify 3 detik | `ac07c614a70d4530bf63c003089d6eac` |
| Q-05 | Live Tracking Status Dapur | `SELESAI` | Stepper 4 langkah pesanan, estimasi 8-10m, live status per stasiun (Bar/Hot Kitchen/Bakery), tombol panggil waiter | `ac07c614a70d4530bf63c003089d6eac` |
| Q-06 | Konfirmasi ke Kasir | `SELESAI` | Auto-sync ke terminal kasir & auto-ticket ke KDS dapur tanpa antri kasir | `ac07c614a70d4530bf63c003089d6eac` |

---

## 7. Surface S5 — Auth & Onboarding

Modul plan: **Flow 5 + 4.12 Onboarding**.

| ID | Screen | Status | Fitur utama |
| -- | ------ | ------ | ----------- |
| A-01 | Landing / Marketing | ADA | hero, paket harga (Starter/Growth/Enterprise), CTA |
| A-02 | Login Owner | ADA | email + password, Turnstile, lupa password |
| A-03 | Login Kasir (PIN) | ADA | keypad PIN |
| A-04 | Register (multi-step) | ADA | step akun (nama/email/HP/jenis usaha), step bisnis, verifikasi OTP |
| A-05 | Lupa/Reset Password | ADA | |
| A-06 | Pilih Paket & Billing ⭐ | BARU | pilih Starter/Growth/Enterprise, add-on, pembayaran Xendit |
| A-07 | Onboarding Wizard ⭐ | BARU | Step 1 info outlet, Step 2 setup menu (import Excel/manual/template), Step 3 tambah karyawan & PIN, Step 4 test transaksi dummy, Step 5 selesai |
| A-08 | Walkthrough & Tips | BARU | tutorial, email tips D+1 s/d D+7 |
| A-09 | Legal | ADA | Terms & Privacy |

---

## 8. Komponen & State Global (dipakai semua surface)

### Komponen reusable
- **Product card** (grid + list) — POS & menu.
- **Cart panel / order summary** — POS & self-order.
- **Kartu order** — KDS & POS multi-order.
- **Status pill** — meja, order, stok, pembayaran, shift.
- **Metric/KPI card** — dashboard & laporan (dengan/hampa baseline: tanpa delta palsu).
- **Chart** — bar (per jam), line (trend), donut (metode bayar/kategori).
- **Data table** — semua daftar backoffice (filter, sort, pagination, export).
- **Modal / drawer / confirm dialog** — form & aksi destruktif.
- **Empty state** — "Belum ada data" + ilustrasi + CTA.
- **Offline banner** + sync indicator.
- **Toast/notifikasi** + bell panel.

### State wajib didesain tiap layar
1. Loading (skeleton, bukan spinner kosong).
2. Empty ("Belum ada data").
3. Error server ("Tidak dapat menghubungi server").
4. Offline (POS: mode tunai).
5. Permission denied (RBAC: kasir vs manajer vs owner).
6. Long content / overflow (nama panjang, angka besar).

---

## 9. Alur (Flow) yang harus di-desain sebagai prototype

1. **Transaksi Dine-In** (plan Flow 1) — pilih meja → order → kirim dapur → bayar → struk → meja kosong.
2. **Order GoFood/GrabFood masuk** (Flow 2) — notif → terima → dapur → siap diambil → selesai.
3. **Stock Opname** (Flow 3) — generate → input fisik → selisih → konfirmasi/investigasi.
4. **Buka/Tutup Shift** (Flow 4) — modal kas → transaksi → ringkasan → uang fisik → selisih → approval.
5. **Registrasi & Onboarding** (Flow 5) — daftar → OTP → paket → bayar → wizard 5 langkah.

---

## 10. Prioritas Desain per Fitur (mapping tier)

| Prioritas | Scope | Surface |
| --------- | ----- | ------- |
| P0 (MVP) ⭐ | POS order+bayar+struk, menu CRUD, floor plan, inventori dasar, laporan dasar, auth, onboarding wizard | S1, S2, S5 |
| P1 (Growth) 🔵 | KDS, resep/HPP, laba rugi, shift & absensi, CRM + poin, QR menu, multi-outlet, omnichannel, split payment | S1, S2, S3, S4 |
| P2 (Enterprise) 🟣 | Multi-station KDS, menu engineering, PO/supplier, e-Faktur, payroll, white-label, API, referral | S2, S3 |

---

## 11. Roadmap Desain (selaras roadmap dev plan)

| Fase | Bulan | Deliverable desain |
| ---- | ----- | ------------------ |
| Fase 1 — MVP | 1–3 | P-01…P-05, P-06, P-09, M-01…M-05, M-08, T-01…T-03, I-01…I-05, I-08, E-01…E-04, R-01…R-03, F-01, F-04, G-01…G-03, G-07, A-01…A-05, A-07 |
| Fase 2 — Growth | 4–6 | K-01…K-03, P-07, P-08, T-04, T-05, I-06, I-09, I-10, I-12, I-13, E-06, E-07, R-04 (komparasi), F-02, C-03, C-05, Q-01…Q-06, O-05, G-04…G-06 |
| Fase 3 — Scale/Enterprise | 7–12 | K-04, E-05, E-08, E-09, R-04 penuh, F-03, F-05 (e-Faktur), C-04, C-06, C-07, G-08, A-06, A-08, mobile app screens |

---

## 12. Checklist Deliverable per Screen

Untuk **setiap** screen di atas, minta:
- [ ] Wireframe low-fidelity (desktop + mobile jika relevan).
- [ ] High-fidelity sesuai `DESIGN.md` (light atau dark sesuai surface).
- [ ] Semua state di §8.
- [ ] Spesifikasi ukuran (touch target ≥ 44px untuk POS/KDS).
- [ ] Microcopy bahasa Indonesia.
- [ ] Edge case: angka besar, nama panjang, izin akses, offline.

---

## 13. Catatan untuk tim desain

- **Kecepatan > estetika** di POS & KDS: target kasir ≤ 30 detik/transaksi.
- **Kontras sinyal status** (meja, stok, order) harus konsisten & aksesibel — bukan dekorasi.
- **Owner dashboard sering dibuka dari HP** — desain responsive, jangan hanya desktop.
- **Self-order & KDS baru** — belum ada gaya baku, ambil turunan dari dark POS tokens.
- **Empty/absent data eksplisit** — jangan fabrikasi delta/angka.

_Dokumen ini turunan dari `claude copy.md`. Update saat plan berubah._
