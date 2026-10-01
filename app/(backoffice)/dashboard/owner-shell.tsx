'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { LOGO_URL } from '@/components/landing/assets';
import { Button } from '@/components/ui/button';
import { activeShifts, listOutlets } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { NAV, SOON } from './backoffice-nav';
import { HeaderSearch } from './header-search';
import { NotificationsBell } from './notifications-bell';

const ITEM = 'flex items-center gap-2 rounded-lg px-4 py-2.5 transition-colors';
const IDLE = 'text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  supervisor: 'Supervisor',
  cashier: 'Kasir',
  chef: 'Chef',
};

function roleLabel(role?: string | null): string {
  if (!role) return '—';
  return ROLE_LABELS[role] ?? role;
}

function roleSubtitle(role?: string | null): string {
  if (role === 'owner') return 'Super Admin';
  if (role === 'manager') return 'Admin Outlet';
  return roleLabel(role);
}

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const outletId = useAuthStore((s) => s.outletId);
  const outletName = useAuthStore((s) => s.outletName);
  const tenantSlug = useAuthStore((s) => s.tenantSlug);
  const selectOutlet = useAuthStore((s) => s.selectOutlet);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  const { data: shifts } = useQuery({
    queryKey: ['shifts', 'active'],
    queryFn: activeShifts,
  });
  const { data: outlets } = useQuery({
    queryKey: ['outlets'],
    queryFn: listOutlets,
  });
  const activeCount = shifts?.length ?? null;
  const singleShift = activeCount === 1 ? (shifts?.[0]?.terminalName ?? null) : null;
  const shiftPillText =
    singleShift && singleShift !== outletName
      ? `${singleShift} Berjalan`
      : `${activeCount} Kasir Aktif`;

  return (
    <div className="min-h-screen bg-lp-background font-lp-sans text-lp-on-surface">
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col justify-between overflow-y-auto scrollbar-thin bg-lp-surface-container-lowest shadow-sm lg:flex">
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Image
                alt="Logo Tumbuh POS"
                src={LOGO_URL}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                unoptimized
              />
              <span className="font-lp-sans text-base font-semibold">Tumbuh POS</span>
            </div>
            <span className="rounded-full bg-lp-surface-container px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-lp-on-surface-variant">
              Pro
            </span>
          </div>

          <div className="px-4 py-2">
            <div className="flex flex-col gap-1 rounded-lg bg-lp-surface-low p-2">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-lp-primary">
                <span className="inline-block h-2 w-2 rounded-full bg-lp-primary-container" />
                Online
              </span>
              <select
                value={outletId ?? ''}
                onChange={(event) => {
                  const next = (outlets ?? []).find(
                    (item) => item.id === event.target.value,
                  );
                  if (!next) return;
                  selectOutlet(next.id, next.name);
                  // Cached queries are not outlet-keyed; drop them so every
                  // panel refetches for the newly selected outlet.
                  queryClient.clear();
                }}
                aria-label="Pilih outlet aktif"
                className="w-full truncate bg-transparent text-sm font-semibold text-lp-on-surface outline-none"
              >
                {!outletId && (
                  <option value="">{outletName ?? tenantSlug ?? 'Memuat…'}</option>
                )}
                {(outlets ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <nav className="mt-2 flex flex-col gap-1 px-4" aria-label="Navigasi backoffice">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`${ITEM} ${
                    active
                      ? 'bg-lp-primary-container font-semibold text-lp-on-primary-container'
                      : IDLE
                  }`}
                >
                  <Icon name={item.icon} className="text-[20px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {SOON.map((item) => (
              <span
                key={item.label}
                title="Belum tersedia"
                aria-disabled="true"
                className={`${ITEM} cursor-not-allowed text-lp-on-surface-variant/50`}
              >
                <Icon name={item.icon} className="text-[20px]" />
                <span>{item.label}</span>
              </span>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <div className="flex flex-col gap-2 rounded-xl bg-lp-surface-low p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-lp-on-surface-variant">
                Status Terminal
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-lp-on-surface">
                {activeCount !== null && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-lp-primary" />
                )}
                {activeCount === null ? '—' : `${activeCount} Aktif`}
              </span>
            </div>
            <span className="text-xs text-lp-on-surface-variant">
              {activeCount === null
                ? 'Memuat status kasir…'
                : activeCount === 0
                  ? 'Belum ada kasir aktif'
                  : `Kasir Aktif: ${activeCount} Terminal`}
            </span>
            <Button asChild className="h-11 gap-1 bg-lp-primary text-lp-on-primary hover:bg-lp-primary-container">
              <Link href="/pos">
                <Icon name="point_of_sale" className="text-[18px]" />
                Buka Kasir POS
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between gap-4 bg-lp-surface-container-lowest/90 px-4 shadow-sm backdrop-blur-xl lg:left-72 lg:px-6">
          <div className="flex items-center gap-4">
            <span className="font-lp-sans text-base font-semibold lg:hidden">
              Tumbuh POS
            </span>
            <nav className="flex items-center gap-1 lg:hidden" aria-label="Navigasi utama">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-2.5 py-1.5 text-xs ${
                    pathname === item.href
                      ? 'bg-lp-primary-container font-semibold text-lp-on-primary-container'
                      : 'text-lp-on-surface-variant'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden flex-1 justify-center px-4 lg:flex">
            <HeaderSearch />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden xl:flex flex-col items-end">
              <span
                suppressHydrationWarning
                className="text-xs font-semibold text-lp-on-surface"
              >
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span
                suppressHydrationWarning
                className="font-lp-mono text-[11px] text-lp-on-surface-variant"
              >
                {new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </span>
            </div>

            {activeCount !== null && activeCount > 0 && (
              <span className="hidden items-center gap-1.5 rounded-full bg-lp-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-lp-on-surface md:inline-flex">
                <span className="inline-block h-2 w-2 rounded-full bg-lp-secondary-container" />
                {shiftPillText}
              </span>
            )}

            <div className="flex items-center gap-1">
              <NotificationsBell />
              <button
                type="button"
                title="Bantuan & Dukungan"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lp-on-surface-variant transition-colors hover:bg-lp-surface-container hover:text-lp-on-surface"
              >
                <Icon name="support_agent" className="text-[22px]" />
              </button>
            </div>

            <div className="hidden h-7 w-px bg-lp-surface-container md:block" />

            <div className="hidden items-center gap-2 md:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lp-primary text-lp-on-primary">
                <Icon name="person" className="text-[18px]" filled />
              </span>
              <div className="flex flex-col">
                <span className="flex items-center gap-1">
                  <span className="text-xs font-semibold">{user?.name ?? '—'}</span>
                  <span className="rounded bg-lp-primary-container px-1.5 py-0.5 text-[10px] font-semibold text-lp-on-primary-container">
                    {roleLabel(user?.role)}
                  </span>
                </span>
                <span className="text-[11px] text-lp-on-surface-variant">
                  {roleSubtitle(user?.role)}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              className="h-10 gap-1.5 px-2.5 text-xs font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface"
              onClick={() => {
                logout();
                router.replace('/login');
              }}
            >
              <Icon name="logout" className="text-[18px]" />
              Keluar
            </Button>
          </div>
        </header>

        <main className="w-full px-4 pb-6 pt-20 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
