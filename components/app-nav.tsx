'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from './pos-ui';

type NavLink = {
  href: string;
  label: string;
  roles: readonly string[] | null;
  hideForRoles?: readonly string[];
};

const LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ['owner', 'manager'] },
  { href: '/pos', label: 'Kasir', roles: null, hideForRoles: ['staff'] },
  { href: '/shift', label: 'Shift Kasir', roles: null, hideForRoles: ['staff'] },
  { href: '/absen', label: 'Absen Saya', roles: null, hideForRoles: ['owner', 'manager'] },
  { href: '/kds', label: 'KDS Dapur', roles: null, hideForRoles: ['staff'] },
  { href: '/reports', label: 'Laporan', roles: ['owner', 'manager'] },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const outletName = useAuthStore((s) => s.outletName);
  const logout = useAuthStore((s) => s.logout);

  const isStaff = user?.role === 'staff';

  // Staff (absen-only) has no POS access — keep them on the self-attendance page.
  useEffect(() => {
    if (isStaff && pathname !== '/absen') router.replace('/absen');
  }, [isStaff, pathname, router]);

  const links = LINKS.filter((link) => {
    if (link.roles && !(user && link.roles.includes(user.role))) return false;
    if (link.hideForRoles && user && link.hideForRoles.includes(user.role)) {
      return false;
    }
    return true;
  });

  return (
    <header className="flex items-center justify-between gap-4 border-b border-lp-outline-variant/30 bg-lp-surface-container-lowest px-4 py-2.5 shadow-xs">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lp-primary text-xs font-bold text-white shadow-xs">
            TP
          </span>
          <span className="text-sm font-bold tracking-tight text-lp-on-surface">Tumbuh POS</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-lp-primary border border-emerald-200/60">
            Kasir Live
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-lp-primary/10 text-lp-primary font-semibold'
                    : 'text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-semibold text-lp-on-surface">{user?.name}</p>
          <p className="text-[11px] text-lp-on-surface-variant">
            {outletName ?? '—'} · {user?.role}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            router.replace('/login');
          }}
        >
          Keluar
        </Button>
      </div>
    </header>
  );
}
