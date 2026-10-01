# MOBILE.md — Aplikasi Android POS (Flutter)

Aplikasi mobile **fokus POS kasir saja** hingga **siap live production**. Tidak ada fase "MVP":
semua item di bawah adalah syarat rilis. Urutan kerja (bagian 8) hanya soal *eksekusi*.

Fitur non-POS (backoffice, absensi, owner dashboard, KDS, self-order) tetap di **web** —
lihat bagian 7. Absensi pegawai = **self-service di web**, bukan di app.

---

## 1. Prinsip

- **Satu aplikasi: stasiun kasir.** Peran: kasir (`role` employee). Login PIN + device binding.
- **Offline-first.** Transaksi wajib jalan saat internet mati; sinkronisasi saat online.
- **Server otoritatif** untuk pajak, service charge, rounding, total akhir
  (`computeOrderTotals`, `roundingBase`). Klien hanya hitung total draft untuk preview.
- **Honest UI.** Data absen tampil sebagai ketiadaan, bukan `0`/nilai karangan.
- **Kontrak** dengan `tumbuh-be` (NestJS); model Dart digenerate dari Swagger BE.
- **DESIGN.md = SSOT visual**; token `lp-*` dipetakan ke `ThemeData`/`ColorScheme` Flutter.

---

## 2. Platform & Stack

- Flutter (stable), Android **8.0+** (minSdk 26, targetSdk terbaru Play).
- **Tablet landscape** untuk kasir; HP didukung (layout responsif).
- State **Riverpod**. Routing **go_router** (deep link QR meja).
- HTTP **Dio** (interceptor auth, 401 → logout global, retry GET, `Idempotency-Key` POST).
- Model **freezed** + **json_serializable** (generated dari OpenAPI BE).
- DB lokal **Drift** (SQLite) + tabel outbox antrean sync.
- Secure storage **flutter_secure_storage**; biometric **local_auth**.
- Printer **esc_pos_utils_plus** + **flutter_pos_printer_platform_image_3** (BT/USB/LAN).
- Scan **mobile_scanner** (kamera + scanner HID). QR display **qr_flutter**.
- Push **firebase_messaging** (notif shift/stok). Background sync **workmanager**.
- Observability **Sentry Flutter**. i18n **flutter_localizations** (`id-ID`), `intl`, Asia/Jakarta.

---

## 3. Arsitektur

```
lib/
  core/        env, dio, interceptor auth/idempotency, error mapping, secure storage
  data/
    models/     generated (freezed) dari Swagger BE
    local/      drift schema + dao + outbox queue
    remote/     repository per domain
  features/
    auth/ shift/ pos/ customers/
  shared/      order_math.dart (port lib/order-math.ts), theme (lp-*), widgets, formatters
  routing/     go_router + deep links
```

- Repository: remote (Dio) + local (Drift) + **sync engine** (outbox → BE, idempoten).
- Operasi kasir berbasis event append-only (order, payment, void) → aman di-replay.
- Cache read-model (menu, stok, pelanggan) di Drift untuk offline browse.

---

## 4. Fitur Mode Kasir (POS)

- **Auth**: login PIN (`POST /v1/auth/login-kasir`) + biometric unlock; **device binding**
  (aktivasi device oleh owner; 1 device ↔ 1 shift).
- **Shift**: current/open/close (`/v1/shifts/*`), modal awal, hitung pecahan, rekap penjualan,
  **variance** + alasan, setoran, riwayat shift.
- **POS**: kategori + grid menu (`loadMenu`), cari, **scan barcode/SKU**
  (`lookupProductByCode`), opsi produk (`loadProductOptions`: varian + modifier), catatan item,
  tipe order (dine-in/take-away/delivery).
- **Bill Parkir**: hold/resume, edit isi (`items/replace`), daftar tagihan berjalan, durasi.
- **Pindah meja** (`move-table`), merge/split (`/merge`, `/split`).
- **Pembayaran**: tunai (pecahan cepat + kembalian), split bayar, QRIS statis,
  **QRIS dinamis** (tampil QR + poll status), debit/kredit, deposit/piutang, `credit-settle`.
- **Diskon & voucher**: diskon manual (`/discount`), voucher (`/voucher` + validate),
  pasang pelanggan.
- **Void**: void item/order + alasan, cetak ulang bukti.
- **Printer thermal**: struk (`/v1/printers/receipt/:id`) + tiket dapur
  (`/kitchen-ticket/:id`), auto-print saat bayar, pilih printer (58/80mm).
- **Offline**: semua transaksi ke outbox; status sinkron terlihat (pending/terkirim/gagal).

---

## 5. Fitur Platform
- Push FCM + deep link (order baru, shift).
- Deep link QR meja (`/order/:tableId`) & pasangan QR printer.
- Background sync (`workmanager`) + foreground sync.
- In-app update (Play Core). Mode kiosk (screen pin). Bluetooth pairing (printer/scanner).
- Export/share struk (PDF/WA).

---

## 6. Non-Functional (syarat live)

- **Offline & sync**: outbox persisten, idempoten, retry backoff, dedup, indikator status,
  rekonsiliasi saat online, tanpa kehilangan/duplikasi order.
- **Keamanan**: secure storage token, TLS pinning opsional, 401 → logout global, device binding,
  PIN tak disimpan plaintext, ProGuard/R8, sembunyikan data sensitif di app switcher.
- **Performa**: cold start < 2s kelas menengah, list menu >100 item lancar (lazy + cache),
  gambar produk lazy + cache.
- **Observability**: Sentry (crash + breadcrumb), log terstruktur, event analytics kunci,
  health-check konektivitas BE.
- **i18n & format**: `id-ID`, `Rp`, Asia/Jakarta.
- **Aksesibilitas**: target sentuh ≥44dp, kontras sesuai DESIGN.md, label screen-reader.
- **Reliabilitas printer**: antre cetak, fallback, pesan gagal jelas, cetak ulang.
- **Testing**: unit (order_math, sync engine, formatter), widget (layar kritis), integrasi
  (mock BE), **E2E** kasir→bayar→cetak di perangkat nyata.
- **CI/CD**: `flutter analyze` + test + build APK/AAB per PR; rilis bertanda tangan.

---

## 7. Di Luar App (tetap WEB)

- **Absensi pegawai = self-service di web.** Pegawai login PIN kasir → halaman absen:
  tombol Masuk/Keluar, ambil **GPS** (browser geolocation) + **selfie** (getUserMedia) bila
  outlet mewajibkan, lihat status hari ini + riwayat. Servernya `POST /v1/attendances/*`,
  geofence/selfie dari `outlet.settings.attendance`.
- **Backoffice web**: dashboard owner, laporan, inventory, menu, keuangan, CRM, settings,
  kelola outlet/meja, karyawan.
- **KDS** dan **self-order PWA** (scan QR meja) tetap web.

---

## 8. Integrasi Backend (kontrak POS)

- Base URL `NEXT_PUBLIC_API_URL`, semua `/v1/*`.
- Auth: `POST /v1/auth/login-kasir` (+ refresh).
- Orders: `GET/POST /v1/orders`, `:id`, `hold/unhold`, `items/replace`, `voucher`, `discount`,
  `move-table`, `merge`, `split`, `credit-settle`, `void`, `items/:id/void`, `confirm`, `cancel`.
- Payments: create (single/split) + status poll (QRIS).
- Shifts: current/open/close/list.
- Printers: `GET /v1/printers`, `receipt/:id`, `kitchen-ticket/:id`.
- Menu: `loadMenu`, `loadProductOptions`, `lookupProductByCode`.
- CRM: customers CRUD, vouchers CRUD + validate.
- Tables: list (+ QR untuk link self-order).
- **Normalisasi payload** di repository Dart (BE tidak 1:1 dengan bentuk FE lama).
- POST selalu `Idempotency-Key`; GET retry; 401 → logout.

---

## 9. Rilis Production

- Play Console **AAB**, signing key di secure CI, Play App Signing.
- `versionName`/`versionCode` naik per rilis + changelog.
- Crash-free ≥ 99.5% sebelum promote; staged rollout (5% → 100%).
- Kebijakan privasi + data safety form selaras `/privacy`.
- SOP ops: pairing printer, aktivasi device, prosedur BE down (mode offline).

---

## 10. Urutan Kerja (eksekusi)

1. Fondasi: repo, theme `lp-*`, Dio + auth + secure storage, model generated, Drift + outbox.
2. Auth + shift + device binding.
3. POS core: menu/scan/cart/modifier + printer + bayar (tunai/QRIS/split) + offline sync.
4. Bill Parkir + pindah meja + merge/split + void + diskon/voucher/pelanggan.
5. Hardening: observability, E2E, performa, aksesibilitas, uji offline, SOP.
6. Rilis: signing, CI/CD, staged rollout, monitoring pasca-rilis.

---

## 11. Checklist Siap-Live

- [ ] Endpoint kontrak POS terverifikasi lawan BE produksi.
- [ ] Uji offline→online: tak ada order hilang/duplikat (idempotensi terbukti).
- [ ] Printer BT/LAN teruji (58 & 80mm, struk + tiket dapur, gagal-ulang).
- [ ] QRIS dinamis: QR tampil + status terkonfirmasi.
- [ ] Device binding + biometric + logout 401 berfungsi.
- [ ] Crash-free ≥ 99.5% di rilis kandidat.
- [ ] `flutter analyze` & test hijau di CI; AAB bertanda tangan.
- [ ] Struk benar (pajak, service, rounding, pembulatan kas).
- [ ] Aksesibilitas & target sentuh memadai.
- [ ] SOP operator + prosedur degradasi BE-down terdokumentasi.
