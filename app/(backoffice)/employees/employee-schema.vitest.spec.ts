import { describe, expect, it } from 'vitest';
import { employeeSchema, pinError } from './employee-form';

describe('employeeSchema', () => {
  const base = {
    name: 'Andi',
    phone: '0812',
    role: 'cashier' as const,
    pin: '1234',
    payType: 'monthly' as const,
  };

  it('accepts a valid employee', () => {
    expect(employeeSchema.safeParse(base).success).toBe(true);
  });

  it('accepts per-shift rates and a commission', () => {
    const parsed = employeeSchema.safeParse({
      ...base,
      payType: 'per_shift',
      shiftRate: '50000',
      commissionRate: '1.5',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.shiftRate).toBe(50000);
      expect(parsed.data.commissionRate).toBe(1.5);
    }
  });

  it('rejects a negative pay rate', () => {
    expect(
      employeeSchema.safeParse({ ...base, baseSalary: '-1' }).success,
    ).toBe(false);
  });

  it('rejects a commission above 100%', () => {
    expect(
      employeeSchema.safeParse({ ...base, commissionRate: '150' }).success,
    ).toBe(false);
  });

  it('requires a non-empty name', () => {
    expect(employeeSchema.safeParse({ ...base, name: '  ' }).success).toBe(false);
  });

  it('rejects an unknown role', () => {
    expect(
      employeeSchema.safeParse({ ...base, role: 'ceo' }).success,
    ).toBe(false);
  });

  it('rejects a phone longer than 20 characters', () => {
    expect(
      employeeSchema.safeParse({ ...base, phone: '0'.repeat(21) }).success,
    ).toBe(false);
  });
});

describe('pinError', () => {
  it('requires a PIN when creating', () => {
    expect(pinError('', true)).toBe('PIN wajib diisi.');
  });

  it('allows a blank PIN when editing', () => {
    expect(pinError('', false)).toBeNull();
  });

  it('rejects a PIN shorter than 4 digits', () => {
    expect(pinError('12', true)).toBe('PIN minimal 4 digit.');
    expect(pinError('12', false)).toBe('PIN minimal 4 digit.');
  });

  it('accepts a 4+ digit PIN', () => {
    expect(pinError('1234', true)).toBeNull();
  });
});
