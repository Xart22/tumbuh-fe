import { describe, expect, it } from 'vitest';
import { toVoucherInput, voucherSchema } from './voucher-form';

describe('voucherSchema', () => {
  const base = {
    code: 'diskon10',
    name: 'Promo',
    type: 'percent' as const,
    value: '10',
    minOrder: '',
    maxDiscount: '',
    maxUses: '',
    expiresAt: '',
  };

  it('accepts a valid voucher', () => {
    expect(voucherSchema.safeParse(base).success).toBe(true);
  });

  it('requires a code and a positive value', () => {
    expect(voucherSchema.safeParse({ ...base, code: ' ' }).success).toBe(false);
    expect(voucherSchema.safeParse({ ...base, value: '0' }).success).toBe(false);
  });

  it('rejects a negative minimum order', () => {
    expect(
      voucherSchema.safeParse({ ...base, minOrder: '-1' }).success,
    ).toBe(false);
  });

  it('rejects a non-integer or zero usage cap', () => {
    expect(voucherSchema.safeParse({ ...base, maxUses: '0' }).success).toBe(
      false,
    );
    expect(voucherSchema.safeParse({ ...base, maxUses: '2.5' }).success).toBe(
      false,
    );
  });
});

describe('toVoucherInput', () => {
  it('uppercases the code and drops empty numbers', () => {
    expect(
      toVoucherInput({
        code: ' promo ',
        name: ' Promo ',
        type: 'fixed',
        value: '5000',
        minOrder: '',
        maxDiscount: '',
        maxUses: '',
        expiresAt: '',
      }),
    ).toEqual({
      code: 'PROMO',
      name: 'Promo',
      type: 'fixed',
      value: 5000,
      minOrder: undefined,
      maxDiscount: undefined,
      maxUses: undefined,
      expiresAt: undefined,
    });
  });

  it('parses provided numeric caps', () => {
    const input = toVoucherInput({
      code: 'x',
      name: 'X',
      type: 'percent',
      value: '10',
      minOrder: '20000',
      maxDiscount: '15000',
      maxUses: '100',
      expiresAt: '2026-12-31',
    });
    expect(input.minOrder).toBe(20000);
    expect(input.maxDiscount).toBe(15000);
    expect(input.maxUses).toBe(100);
    expect(input.expiresAt).toBe('2026-12-31');
  });
});
