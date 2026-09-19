import { describe, expect, it } from 'vitest';
import { materialSchema, stockAdjustSchema } from './material-modals';

describe('materialSchema', () => {
  const base = {
    name: 'Fresh Milk',
    unit: 'liter',
    stockUnitId: 'u-liter',
    packSize: 12,
    stockQty: 4.2,
    minStockQty: 15,
    costPerUnit: 19500,
  };

  it('accepts a valid material', () => {
    expect(materialSchema.safeParse(base).success).toBe(true);
  });

  it('requires a name and a stock unit', () => {
    expect(materialSchema.safeParse({ ...base, name: ' ' }).success).toBe(false);
    expect(materialSchema.safeParse({ ...base, stockUnitId: '' }).success).toBe(
      false,
    );
  });

  it('requires packSize greater than 0', () => {
    expect(materialSchema.safeParse({ ...base, packSize: 0 }).success).toBe(
      false,
    );
    expect(materialSchema.safeParse({ ...base, packSize: -2 }).success).toBe(
      false,
    );
  });

  it('rejects negative numbers', () => {
    expect(materialSchema.safeParse({ ...base, minStockQty: -1 }).success).toBe(
      false,
    );
    expect(materialSchema.safeParse({ ...base, costPerUnit: -5 }).success).toBe(
      false,
    );
  });
});

describe('stockAdjustSchema', () => {
  it('rejects a zero delta', () => {
    expect(stockAdjustSchema.safeParse({ qty: 0 }).success).toBe(false);
  });

  it('accepts positive and negative deltas', () => {
    expect(stockAdjustSchema.safeParse({ qty: 12 }).success).toBe(true);
    expect(stockAdjustSchema.safeParse({ qty: -3.5 }).success).toBe(true);
  });
});
