<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# tumbuh-fe — agent notes

Next.js 16 + React 19 + Tailwind v4 + RHF/zod + shadcn (manual) + TanStack Query + Zustand. Backend `tumbuh-be` (NestJS) expected at `NEXT_PUBLIC_API_URL`. All routes static-prerendered; interactivity is client components. Skills in `.agents/skills/` hold Next.js + UI/UX guidance — load them for UI work.

## Commands (port 3001)

- `npm run dev` (HMR) / `npm run build && npm start` (prod server serves build output — rebuild + restart after changes, no HMR)
- `npm run lint` must be 0 errors; `npx tsc --noEmit`; `npm test` runs node:test (`lib/*.test.ts`) then vitest
- `npx vitest run`, `npm run test:e2e` (Playwright chromium, reuses dev server if up)
- Test file split is load-bearing: vitest only picks `*.vitest.spec.{ts,tsx}` — never name vitest files `*.test.ts` or node:test will execute them and fail

## Tooling gotcha: shell is PowerShell, not bash

The terminal tool runs `pwsh`. No heredocs (`<<EOF` fails), no `<` stdin redirect (pipe via `Get-Content ... | ...` or `docker cp` + `-f` instead), quote paren-paths (`"app/(auth)/..."`), `Set-Content -NoNewline` concatenates array lines — never use it for multi-line files.

## Structure rules

- Route groups `(auth)/(pos)/(backoffice)/(legal)` don't affect URLs. URLs: `/login` owner, `/kasir` PIN, `/register`, `/pos`, `/reports`, `/terms`, `/privacy`. Colocate route-specific components next to `page.tsx`; shared code in `components/`, `lib/`, `stores/`.
- Two UI systems, never mix: `components/ui/` = shadcn for light pages (auth/landing/legal); `components/pos-ui.tsx` = dark POS shell. Landing/marketing tokens are `lp-*` in `globals.css`.
- `AuthGate`: POS layouts need outlet scope (default; unauthenticated POS goes to `loginPath="/kasir"`), backoffice passes `requireOutlet={false}`. Auth state (kasir vs owner session) lives in `stores/auth-store.ts`.
- Fonts: single `next/font` instances in `lib/fonts.ts`, applied via CSS variables. Material Symbols icon font loads once in `app/layout.tsx`; use `components/icon.tsx`, never emoji as icons.

## API client (`lib/api-client.ts`)

- `GET` auto-retries transient failures; `POST` never retries — mutations rely on `Idempotency-Key` instead (`idempotencyKey` option for orders/payments, `headers` option for onboarding).
- 401 triggers global logout — don't catch-and-ignore it. Pass `outletScoped: false` for public routes. Transport/server failures go to `setErrorReporter` (wired to Sentry, dormant without DSN).

## Forms

- `react-hook-form` + `zodResolver`, schemas colocated with routes, `z.infer` as the single type source. Inline per-field errors with reserved `min-h-4` slots (prevents layout shift stealing clicks mid-gesture).
- Never read refs during render (React Compiler lint) — `useState(() => crypto.randomUUID())` for per-mount values, not `useRef`.
- shadcn `Checkbox` (Radix button) must not sit inside a plain `<label>` — double-toggle. Use `FormLabel`, and in tests prefer `click()` + `toBeChecked()` over `check()`.

## Env & backend dependency

- Copy `.env.example` to `.env.local`. Dev Turnstile test keys are documented there (real keys only in prod). Most E2E/login flows need BE + Postgres running with seed tenant `kopikita`; seed SQL password hashes are placeholders and can't log in — working dev owner is `e2e-owner@tumbuh.local` / `E2E_Test123!` (provisioned by BE e2e helper), kasir PIN is `123456`.

## Workflow

- TS `strict` + `noUnusedLocals/Parameters`; keep lint/test/build green before finishing.
- Conventional commits per area (`feat:`, `fix:`, `chore:`, `test:`, `docs:`); commit each workstream separately, never mix repos' concerns.
