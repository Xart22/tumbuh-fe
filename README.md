# Tumbuh POS — Frontend (`tumbuh-fe`)

Frontend Next.js (App Router) untuk **Tumbuh POS**: landing marketing, onboarding
merchant, kasir POS, dan backoffice laporan untuk bisnis F&B Indonesia.
Backend: `tumbuh-be` (NestJS), diakses via `NEXT_PUBLIC_API_URL`.

## Menjalankan

```bash
cp .env.example .env.local   # sesuaikan NEXT_PUBLIC_API_URL bila perlu
npm install
npm run dev                  # http://localhost:3001 (hot reload)
npm run build && npm start   # mode produksi
npm test                     # unit test lib/*
```

## Struktur

```text
app/
  page.tsx                 # / landing publik
  not-found.tsx / error.tsx / global-error.tsx
  (auth)/login             # /login  (PIN kasir per outlet)
  (auth)/backoffice        # /backoffice (email+password owner/manager)
  (auth)/register          # /register (wizard 2 langkah, colocated components)
  (pos)/pos                # /pos (butuh login, layout + AppNav sendiri)
  (backoffice)/reports     # /reports (butuh login)
components/
  ui/                      # shadcn (button, input, form, select, …) — untuk form terang
  pos-ui.tsx               # primitif tema GELAP POS (jangan campur dengan ui/)
  landing/                 # section landing page
  icon.tsx                 # helper Material Symbols
  *-panel.tsx / *-modal.tsx / *-grid.tsx   # komponen POS
lib/                       # api-client, api, types, format, fonts, utils, order-math
stores/                    # zustand: auth-store, cart-store
```

## Konvensi (ringkas)

* **Form predefined**: `react-hook-form` + `zod` (`zodResolver`). Schema colocated
  dengan route; error inline per field.
* **UI**: halaman terang (auth/landing) pakai shadcn `components/ui`;
  layar POS gelap pakai `components/pos-ui`. Token landing berprefix `lp-*`
  di `app/globals.css` agar tidak menimpa tema POS. `--color-muted` milik POS.
* **Halaman baru**: taruh di route group yang sesuai (`(auth)/(pos)/(backoffice)`),
  beri `metadata.title`, colocate komponen khusus-route di sebelah `page.tsx`,
  impir via alias `@/`.
* TypeScript `strict` + `noUnusedLocals/Parameters`; ESLint Next core-web-vitals
  harus 0 error sebelum merge.
