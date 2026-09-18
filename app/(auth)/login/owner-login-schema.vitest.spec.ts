import { describe, expect, it } from 'vitest';
import { ownerLoginSchema } from './owner-form';

describe('ownerLoginSchema', () => {
  it('accepts a complete payload', () => {
    expect(
      ownerLoginSchema.safeParse({
        workspace: 'kopikita',
        email: 'owner@kopikita.local',
        password: 'rahasia123',
      }).success,
    ).toBe(true);
  });

  it('rejects a bad email', () => {
    const r = ownerLoginSchema.safeParse({
      workspace: 'kopikita',
      email: 'bukan-email',
      password: 'rahasia123',
    });
    expect(r.success).toBe(false);
  });

  it('requires all fields', () => {
    const r = ownerLoginSchema.safeParse({ workspace: '', email: '', password: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['workspace', 'email', 'password']));
    }
  });
});
