import { describe, expect, it } from 'vitest';
import { acceptSchema } from './accept-invite-form';

describe('acceptSchema', () => {
  const base = { password: 'Rahasia123', confirm: 'Rahasia123' };

  it('accepts a matching password pair', () => {
    expect(acceptSchema.safeParse(base).success).toBe(true);
  });

  it('accepts an optional display name', () => {
    expect(
      acceptSchema.safeParse({ ...base, name: 'Budi' }).success,
    ).toBe(true);
  });

  it('rejects a short password', () => {
    expect(
      acceptSchema.safeParse({ password: 'pendek', confirm: 'pendek' })
        .success,
    ).toBe(false);
  });

  it('rejects a mismatched confirmation', () => {
    expect(
      acceptSchema.safeParse({ ...base, confirm: 'Beda12345' }).success,
    ).toBe(false);
  });
});
