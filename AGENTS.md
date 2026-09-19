<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# tumbuh-fe — agent notes

Next.js 16 + React 19 + Tailwind v4 + RHF/zod + shadcn (manual) + TanStack Query + Zustand. Backend `tumbuh-be` (NestJS) expected at `NEXT_PUBLIC_API_URL`. All routes static-prerendered; interactivity is client components.

## Read first

1. **Any UI work** → read [`DESIGN.md`](DESIGN.md) (colors, type scale, radius, elevation, F&B component patterns, pre-delivery checklist). It is the Single Source of Truth; this file only carries repo-specific rules.
2. **Next.js APIs/conventions** → `node_modules/next/dist/docs/` (see the block above).
3. **Skills** in `.agents/skills/` (`next-best-practices`, `ui-ux-pro-max`) — load the matching one before UI or routing work.

## Commands (port 3001)

- `npm run dev` (HMR) / `npm run build && npm start` (prod server serves build output — rebuild + restart after changes, no HMR)
- `npm run lint` must be 0 errors; `npx tsc --noEmit`; `npm test` runs node:test (`lib/*.test.ts`) then vitest
- `npx vitest run`, `npm run test:e2e` (Playwright chromium, reuses dev server if up)
- Test file split is load-bearing: vitest only picks `*.vitest.spec.{ts,tsx}` — never name vitest files `*.test.ts` or node:test will execute them and fail
- `npx vitest run` must stay green (currently 5 files / 16 tests). Vitest is pinned to the **vite 6 + vitest 3 + @vitejs/plugin-react 4 + jsdom 26** line on purpose: the vite 8 / vitest 5 "rolldown" line is broken on Windows here, failing every suite at load with `Cannot read properties of undefined (reading 'config')` (Vite externalises `@vitest/runner`, Node resolves it through `fs.realpathSync.native` which uppercases the drive letter `d:` → `D:`, and the collector state splits across two module registries). Do NOT bump vite/vitest without re-running `npx vitest run` from the repo root.
- Config must be `vitest.config.mts` (a `.ts` file is loaded as CommonJS — package.json has no `"type": "module"` — and the ESM config silently fails to load).

## Tooling gotcha: shell is PowerShell, not bash

The terminal tool runs `pwsh`. No heredocs (`<<EOF` fails), no `<` stdin redirect (pipe via `Get-Content ... | ...` or `docker cp` + `-f` instead), quote paren-paths (`"app/(auth)/..."`), `Set-Content -NoNewline` concatenates array lines — never use it for multi-line files. Chaining with `;` makes `npx tsc --noEmit` swallow the next command as a flag (`TS5025`) — use `&&`.

## Design system rules (enforced)

- **Never add design tokens to [`app/globals.css`](app/globals.css) for a single page.** The `lp-*` palette is complete; compose with the existing tokens. A new token needs a `DESIGN.md` entry first.
- **Never invent a spacing/typography scale.** Tailwind v4 here has no `tailwind.config`; hex scales like `p-space-md`, `gap-gutter`, `mt-margin-lg` from external mockups compile to **nothing** (verified: `padding: 0px, gap: normal`). Translate them to numeric utilities (`p-4`, `gap-2`, `pb-6`) — this is exactly how the owner dashboard first shipped broken.
- **Raw hex is banned in components.** Use `bg-lp-*` / `text-lp-*` / `border-lp-*`. The only exception is the dark POS shell's `var(--surface|panel|panel-2|line|ink|muted)` tokens.
- **Money, quantities, margins, codes → `font-lp-mono`.** Headings, labels, buttons, prose → `font-lp-sans` (via `font-lp-sans` on the light-page root). Never mono for narrative text.
- **Status color is a signal, not decoration** — [`DESIGN.md`](DESIGN.md) §2.4 pairs it to Cash-drawer/HPP/stock semantics. Don't restyle a `Critical` as `Info`.
- **Contrast**: no green-on-mint, no red-on-pink. Dark tone goes on the light tint (`on-primary-fixed` on `primary-fixed`, `on-error-container` on `error-container`). 11px labels need weight ≥600.
- **Touch targets ≥44px** (`h-11`) on POS and backoffice toolbars; icon-only buttons need `aria-label`; icons come from [`components/icon.tsx`](components/icon.tsx), never emoji.
- **Reuse primitives before writing markup**: shadcn [`components/ui/button.tsx`](components/ui/button.tsx) (`asChild` + `Link` for link-buttons) for light pages, [`components/pos-ui.tsx`](components/pos-ui.tsx) for dark POS. Don't hand-roll a styled `<Link>` next to a `Button`.
- **Empty/absent data is explicit**: "Belum ada data" states, and no fabricated deltas — a metric without a baseline renders as absence, not `0%`.

## Structure rules

- Route groups `(auth)/(pos)/(backoffice)/(legal)` don't affect URLs. URLs: `/login` owner, `/kasir` PIN, `/register`, `/pos`, `/dashboard` owner dashboard, `/reports`, `/terms`, `/privacy`. Colocate route-specific components next to `page.tsx`; shared code in `components/`, `lib/`, `stores/`.
- Two UI systems, never mix: `components/ui/` = shadcn for light pages (auth/landing/legal); `components/pos-ui.tsx` = dark POS shell. Landing/marketing tokens are `lp-*` in `globals.css`. The owner dashboard (`(backoffice)/dashboard`) also uses the light `lp-*` tokens plus its own sidebar shell (`owner-shell.tsx`), NOT `app-nav.tsx`/`pos-ui`.
- `(backoffice)/layout.tsx` is auth-only; each page owns its chrome. `reports/page.tsx` wraps itself in `AppNav` (dark, three links incl. Dashboard), `dashboard/page.tsx` in `OwnerShell`. `/reports` is the only sanctioned light-content-under-dark-nav page.
- Derived `--font-lp-*` tokens live in `@theme inline`, not `@theme`: a `var()` chain declared in the non-inline block resolves at `:root` where next/font never sets `--font-landing-*`, so the whole font stack lands on the guaranteed-invalid value and silently falls back to Geist.
- `AuthGate`: POS layouts need outlet scope (default; unauthenticated POS goes to `loginPath="/kasir"`), backoffice passes `requireOutlet={false}`. Auth state (kasir vs owner session) lives in `stores/auth-store.ts`.
- Fonts: single `next/font` instances in `lib/fonts.ts`, applied via CSS variables. A page must apply `plusJakarta.variable` (and `jetbrainsMono.variable` for mono) on its root, or `font-lp-*` silently falls back to Geist.

## API client (`lib/api-client.ts`)

- `GET` auto-retries transient failures; `POST` never retries — mutations rely on `Idempotency-Key` instead (`idempotencyKey` option for orders/payments, `headers` option for onboarding).
- 401 triggers global logout — don't catch-and-ignore it. Pass `outletScoped: false` for public routes. Transport/server failures go to `setErrorReporter` (wired to Sentry, dormant without DSN).
- Queries set `retry: false` in [`lib/query-client.ts`](lib/query-client.ts) and `staleTime: 60s`. A failed query will not refetch on remount of the same cache key — verify data states with a real BE or a mocked `fetch`, not by re-navigating.

## Forms

- `react-hook-form` + `zodResolver`, schemas colocated with routes, `z.infer` as the single type source. Inline per-field errors with reserved `min-h-4` slots (prevents layout shift stealing clicks mid-gesture).
- Never read refs during render (React Compiler lint) — `useState(() => crypto.randomUUID())` for per-mount values, not `useRef`.
- shadcn `Checkbox` (Radix button) must not sit inside a plain `<label>` — double-toggle. Use `FormLabel`, and in tests prefer `click()` + `toBeChecked()` over `check()`.

## Env & backend dependency

- Copy `.env.example` to `.env.local`. Dev Turnstile test keys are documented there (real keys only in prod). Most E2E/login flows need BE + Postgres running with seed tenant `kopikita`; the seed SQL's `admin@kopikita.com` hash is a placeholder and can't log in — working dev owner is `e2e-owner@tumbuh.local` / `E2e_Test123!` (provisioned by the BE e2e helper), kasir PIN is `123456`.
- BE CORS: `tumbuh-be/.env` needs `CORS_ORIGINS=http://localhost:3001` (this FE's dev port). Without it `main.ts` falls back to `:3000` only and the browser blocks every request — the dashboard then shows "Tidak dapat menghubungi server" even though `curl` to the BE succeeds.
- Owner/manager sessions carry no outlet scope, but every `/v1/reports` route is gated by `OutletHeaderGuard`. [`components/outlet-bootstrap.tsx`](components/outlet-bootstrap.tsx) resolves the tenant's first outlet via `/v1/outlets` before the backoffice renders; without it every report 400s with `Missing X-Outlet-Id header`.
- BE report payloads do not match the FE types 1:1 (`orderCount` vs `totalOrders`, `productName`/`soldQty`, `hourly-sales` → `{buckets}`, `payment-methods` → `{methods}`). [`lib/api.ts`](lib/api.ts) normalises each one — never map raw BE shapes in a page.
- BE `sales-summary`/`top-products`/`payment-methods` accepted `YYYY-MM-DD` and parsed it as midnight UTC, so `lte: new Date(dateTo)` dropped the whole selected day. Do not reintroduce a bare `new Date(dateStr)` in a range filter; use the `startOfDay`/`endOfDay` helpers in `tumbuh-be/src/reports/reports.service.ts`.
- With no BE on `:3000` the app still renders — pages show "Tidak dapat menghubungi server" and honest empty states. That is the correct degraded behaviour; don't paper over it with fixtures in app code.

## Workflow

- TS `strict` + `noUnusedLocals/Parameters`; keep lint/test/build green before finishing.
- Before presenting UI as done: run `npm run build`, then check the rendered page in a browser (Playwright MCP) and assert real measurements (`getBoundingClientRect`, `getComputedStyle`, `scrollWidth`) — a compiling build proves nothing about layout.
- Conventional commits per area (`feat:`, `fix:`, `chore:`, `test:`, `docs:`); commit each workstream separately, never mix repos' concerns.
