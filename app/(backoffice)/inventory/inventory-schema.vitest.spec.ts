import { describe, expect, it } from 'vitest';
import {
  materialSchema,
  stockAdjustSchema,
  stockUnitCost,
} from './material-modals';

describe('materialSchema', () => {
  const base = {
    name: 'Fresh Milk',
    unit: 'liter',
    stockUnitId: 'u-liter',
    packSize: 12,
    stockQty: 4.2,
    minStockQty: 15,
    purchasePrice: 234000,
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

describe('stockUnitCost', () => {
  it('divides the price of one purchase unit by the pack size', () => {
    expect(stockUnitCost(130000, 1000)).toBe(130);
    expect(stockUnitCost(45000, 250)).toBe(180);
  });

  it('rounds to 2 decimals like money', () => {
    expect(stockUnitCost(10000, 3)).toBe(3333.33);
  });

  it('falls back to 0 when the price or pack size is unusable', () => {
    expect(stockUnitCost(0, 1000)).toBe(0);
    expect(stockUnitCost(10000, 0)).toBe(0);
    expect(stockUnitCost(Number.NaN, 10)).toBe(0);
  });
});
