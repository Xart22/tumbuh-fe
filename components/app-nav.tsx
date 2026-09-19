'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from './pos-ui';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', roles: ['owner', 'manager'] },
  { href: '/pos', label: 'Kasir', roles: null },
  { href: '/reports', label: 'Laporan', roles: ['owner', 'manager'] },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const outletName = useAuthStore((s) => s.outletName);
  const logout = useAuthStore((s) => s.logout);

  const links = LINKS.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role as never)),
  );

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-panel px-4 py-3">
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-ink">Tumbuh POS</span>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'bg-[var(--panel-2)] text-ink'
                    : 'text-muted hover:text-ink'
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
          <p className="text-sm text-ink">{user?.name}</p>
          <p className="text-xs text-muted">
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
