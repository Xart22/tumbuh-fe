import { describe, expect, it } from 'vitest';
import { roleNeedsOutlet, routeForRole } from './login-routing';

describe('routeForRole', () => {
  it('routes each role to its home', () => {
    expect(routeForRole('owner')).toBe('/dashboard');
    expect(routeForRole('manager')).toBe('/dashboard');
    expect(routeForRole('supervisor')).toBe('/menu');
    expect(routeForRole('staff')).toBe('/absen');
    expect(routeForRole('cashier')).toBe('/pos');
    expect(routeForRole('chef')).toBe('/pos');
    expect(routeForRole(undefined)).toBe('/pos');
  });
});

describe('roleNeedsOutlet', () => {
  it('only owner/manager skip outlet scoping', () => {
    expect(roleNeedsOutlet('owner')).toBe(false);
    expect(roleNeedsOutlet('manager')).toBe(false);
    expect(roleNeedsOutlet('supervisor')).toBe(true);
    expect(roleNeedsOutlet('cashier')).toBe(true);
    expect(roleNeedsOutlet('staff')).toBe(true);
  });
});
