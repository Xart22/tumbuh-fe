import { describe, expect, it } from 'vitest';
import type { Unit, UnitFamily } from '@/lib/types';
import { recipeQtyInStockUnit } from './unit-convert';

const unit = (code: string, family: UnitFamily, factorToBase: number): Unit => ({
  id: code,
  code,
  name: code,
  family,
  factorToBase,
  baseUnit: code,
  isCustom: false,
});

const units = [
  unit('gram', 'mass', 1),
  unit('kg', 'mass', 1000),
  unit('ml', 'volume', 1),
];

describe('recipeQtyInStockUnit', () => {
  it('converts within a family (500 g → 0.5 kg)', () => {
    expect(recipeQtyInStockUnit(500, 'gram', 'kg', units)).toBe(0.5);
    expect(recipeQtyInStockUnit(0.5, 'kg', 'gram', units)).toBe(500);
  });

  it('returns the raw qty for same/unknown/cross-family units', () => {
    expect(recipeQtyInStockUnit(3, 'gram', 'gram', units)).toBe(3);
    expect(recipeQtyInStockUnit(3, 'gram', 'ml', units)).toBe(3);
    expect(recipeQtyInStockUnit(3, 'gram', 'pcs', units)).toBe(3);
    expect(recipeQtyInStockUnit(3, undefined, 'kg', units)).toBe(3);
  });
});
