import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema, resetPasswordSchema } from './reset-password-form';

describe('forgotPasswordSchema', () => {
  it('requires a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(
      false,
    );
  });

  it('accepts and trims a valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '  a@x.id ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('a@x.id');
  });
});

describe('resetPasswordSchema', () => {
  const base = { code: '123456', password: 'password1', confirm: 'password1' };

  it('accepts a 6-digit code with a matching password', () => {
    expect(resetPasswordSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a non 6-digit code', () => {
    expect(resetPasswordSchema.safeParse({ ...base, code: '12ab' }).success).toBe(
      false,
    );
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(
      resetPasswordSchema.safeParse({ ...base, password: 'short', confirm: 'short' })
        .success,
    ).toBe(false);
  });

  it('rejects a mismatched confirmation', () => {
    const result = resetPasswordSchema.safeParse({
      ...base,
      confirm: 'different1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirm');
    }
  });
});
