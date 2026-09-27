import { describe, expect, it } from 'vitest';
import { customerSchema, toCustomerInput } from './customer-form';

describe('customerSchema', () => {
  const base = { name: 'Sari', phone: '08123456789' };

  it('accepts a minimal customer', () => {
    expect(customerSchema.safeParse(base).success).toBe(true);
  });

  it('requires a name and phone', () => {
    expect(customerSchema.safeParse({ ...base, name: ' ' }).success).toBe(false);
    expect(customerSchema.safeParse({ ...base, phone: '' }).success).toBe(false);
  });

  it('rejects a phone longer than 20 characters', () => {
    expect(
      customerSchema.safeParse({ ...base, phone: '0'.repeat(21) }).success,
    ).toBe(false);
  });

  it('accepts a blank email but rejects a malformed one', () => {
    expect(customerSchema.safeParse({ ...base, email: '' }).success).toBe(true);
    expect(customerSchema.safeParse({ ...base, email: 'nope' }).success).toBe(
      false,
    );
  });
});

describe('toCustomerInput', () => {
  it('trims fields and drops empty optionals', () => {
    const input = toCustomerInput({
      name: '  Sari ',
      phone: ' 0812 ',
      email: '',
      birthDate: '',
      notes: '  suka kopi  ',
      referralCode: '',
    });
    expect(input).toEqual({
      name: 'Sari',
      phone: '0812',
      email: undefined,
      birthDate: undefined,
      notes: 'suka kopi',
      referralCode: undefined,
    });
  });
});
