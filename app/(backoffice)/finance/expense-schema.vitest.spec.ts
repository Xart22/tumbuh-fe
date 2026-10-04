import { describe, expect, it } from 'vitest';
import { expenseSchema, toExpenseInput } from './expense-form';

describe('expenseSchema', () => {
  const base = {
    category: 'operational',
    costType: 'variable' as const,
    amount: '50000',
    description: 'Gas',
    expenseDate: '2026-09-28',
  };

  it('accepts a valid expense', () => {
    expect(expenseSchema.safeParse(base).success).toBe(true);
  });

  it('requires a category and a positive amount', () => {
    expect(expenseSchema.safeParse({ ...base, category: ' ' }).success).toBe(
      false,
    );
    expect(expenseSchema.safeParse({ ...base, amount: '0' }).success).toBe(false);
  });

  it('rejects an unknown cost type', () => {
    expect(
      expenseSchema.safeParse({ ...base, costType: 'other' }).success,
    ).toBe(false);
  });

  it('requires a date', () => {
    expect(expenseSchema.safeParse({ ...base, expenseDate: '' }).success).toBe(
      false,
    );
  });
});

describe('toExpenseInput', () => {
  it('converts the amount and trims fields', () => {
    expect(
      toExpenseInput({
        category: ' operational ',
        costType: 'fixed',
        amount: '150000',
        description: '  Sewa  ',
        expenseDate: '2026-09-28',
      }),
    ).toEqual({
      category: 'operational',
      costType: 'fixed',
      amount: 150000,
      description: 'Sewa',
      expenseDate: '2026-09-28',
    });
  });

  it('drops an empty description', () => {
    expect(
      toExpenseInput({
        category: 'other',
        costType: 'variable',
        amount: '1000',
        description: '',
        expenseDate: '2026-09-28',
      }).description,
    ).toBeUndefined();
  });
});
