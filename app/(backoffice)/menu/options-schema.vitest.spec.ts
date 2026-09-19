import { describe, expect, it } from 'vitest';
import { variantSchema } from './variant-editor';
import { modifierGroupSchema, modifierSchema } from './modifier-editor';

describe('variantSchema', () => {
  it('requires a name and an integer adjustment', () => {
    expect(variantSchema.safeParse({ name: '', priceAdjustment: 0 }).success).toBe(
      false,
    );
    expect(
      variantSchema.safeParse({ name: 'Large', priceAdjustment: 1.5 }).success,
    ).toBe(false);
    expect(
      variantSchema.safeParse({ name: 'Large', priceAdjustment: 5000 }).success,
    ).toBe(true);
  });
});

describe('modifierGroupSchema', () => {
  it('rejects max below min', () => {
    const result = modifierGroupSchema.safeParse({
      name: 'Sugar Level',
      isRequired: true,
      minSelect: 2,
      maxSelect: 1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('maxSelect');
    }
  });

  it('accepts a required single-choice group', () => {
    expect(
      modifierGroupSchema.safeParse({
        name: 'Sugar Level',
        isRequired: true,
        minSelect: 1,
        maxSelect: 1,
      }).success,
    ).toBe(true);
  });
});

describe('modifierSchema', () => {
  it('requires a name and a non-negative price', () => {
    expect(modifierSchema.safeParse({ name: '', priceAddition: 0 }).success).toBe(
      false,
    );
    expect(
      modifierSchema.safeParse({ name: 'Less Ice', priceAddition: -1 }).success,
    ).toBe(false);
    expect(
      modifierSchema.safeParse({ name: 'Oat Milk', priceAddition: 8000 }).success,
    ).toBe(true);
  });
});
