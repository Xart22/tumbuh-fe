import type { Role } from './types';

/** Where a session lands after login, before any outlet is bound. */
export function routeForRole(role: Role | string | null | undefined): string {
  switch (role) {
    case 'owner':
    case 'manager':
      return '/dashboard';
    case 'supervisor':
      return '/menu';
    case 'staff':
      return '/absen';
    default:
      return '/pos';
  }
}

/** Owner/manager reach the backoffice without a bound outlet (bootstrap picks one). */
export function roleNeedsOutlet(role: Role | string | null | undefined): boolean {
  return role !== 'owner' && role !== 'manager';
}
