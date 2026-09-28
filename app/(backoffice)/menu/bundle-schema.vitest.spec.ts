import { describe, expect, it } from 'vitest';
import { bundleSchema } from './bundles-manager';

describe('bundleSchema', () => {
  const base = {
    name: 'Paket Hemat',
    price: '35000',
    items: [{ productId: 'p1', qty: 1 }],
  };

  it('accepts a valid bundle', () => {
    expect(bundleSchema.safeParse(base).success).toBe(true);
  });

  it('requires a name and a positive price', () => {
    expect(bundleSchema.safeParse({ ...base, name: ' ' }).success).toBe(false);
    expect(bundleSchema.safeParse({ ...base, price: '0' }).success).toBe(false);
  });

  it('requires at least one item', () => {
    expect(bundleSchema.safeParse({ ...base, items: [] }).success).toBe(false);
  });

  it('rejects a non-positive qty', () => {
    expect(
      bundleSchema.safeParse({
        ...base,
        items: [{ productId: 'p1', qty: 0 }],
      }).success,
    ).toBe(false);
  });
});
