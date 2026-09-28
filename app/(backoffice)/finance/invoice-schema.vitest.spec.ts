import { describe, expect, it } from 'vitest';
import { invoiceSchema, toInvoicePayload } from './invoice-form';

describe('invoiceSchema', () => {
  const base = {
    supplierId: 's1',
    invoiceNumber: 'INV-1',
    totalAmount: '500000',
    dueDate: '',
  };

  it('accepts a valid invoice', () => {
    expect(invoiceSchema.safeParse(base).success).toBe(true);
  });

  it('requires a supplier', () => {
    expect(
      invoiceSchema.safeParse({ ...base, supplierId: '' }).success,
    ).toBe(false);
  });

  it('requires a positive total', () => {
    expect(
      invoiceSchema.safeParse({ ...base, totalAmount: '0' }).success,
    ).toBe(false);
    expect(
      invoiceSchema.safeParse({ ...base, totalAmount: '-1' }).success,
    ).toBe(false);
  });
});

describe('toInvoicePayload', () => {
  it('converts the total and drops empty optionals', () => {
    expect(
      toInvoicePayload({
        supplierId: 's1',
        invoiceNumber: ' ',
        totalAmount: '250000',
        dueDate: '',
      }),
    ).toEqual({
      supplierId: 's1',
      totalAmount: 250000,
      invoiceNumber: undefined,
      dueDate: undefined,
    });
  });
});
