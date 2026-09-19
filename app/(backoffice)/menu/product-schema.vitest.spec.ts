import { describe, expect, it } from 'vitest';
import { productSchema } from './product-form';

describe('productSchema', () => {
  const base = { name: 'Kopi Susu', basePrice: 24000, isAvailable: true };

  it('accepts a minimal product', () => {
    expect(productSchema.safeParse(base).success).toBe(true);
  });

  it('requires a non-empty name', () => {
    expect(productSchema.safeParse({ ...base, name: '   ' }).success).toBe(
      false,
    );
  });

  it('rejects a non-numeric or negative price', () => {
    expect(productSchema.safeParse({ ...base, basePrice: NaN }).success).toBe(
      false,
    );
    expect(productSchema.safeParse({ ...base, basePrice: -1 }).success).toBe(
      false,
    );
  });

  it('caps SKU length at 100 characters', () => {
    expect(
      productSchema.safeParse({ ...base, sku: 'x'.repeat(101) }).success,
    ).toBe(false);
  });

  it('treats an empty category as "no category"', () => {
    const result = productSchema.safeParse({ ...base, categoryId: '' });
    expect(result.success).toBe(true);
  });
});
