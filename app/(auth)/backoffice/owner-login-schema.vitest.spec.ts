import { describe, expect, it } from 'vitest';
import { ownerLoginSchema } from './owner/owner-form';

describe('ownerLoginSchema', () => {
  it('accepts email + password without workspace', () => {
    expect(
      ownerLoginSchema.safeParse({
        email: 'owner@kopikita.local',
        password: 'rahasia123',
      }).success,
    ).toBe(true);
  });

  it('rejects a bad email', () => {
    const r = ownerLoginSchema.safeParse({
      email: 'bukan-email',
      password: 'rahasia123',
    });
    expect(r.success).toBe(false);
  });

  it('requires email and password', () => {
    const r = ownerLoginSchema.safeParse({ email: '', password: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['email', 'password']));
    }
  });
});
