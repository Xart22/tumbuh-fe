import { describe, expect, it } from 'vitest';
import { wasteSchema } from './waste-view';

describe('wasteSchema', () => {
  const base = { rawMaterialId: 'm1', qty: 1.5, reason: 'expired' as const };

  it('accepts a valid waste record', () => {
    expect(wasteSchema.safeParse(base).success).toBe(true);
  });

  it('requires a material and a positive qty', () => {
    expect(
      wasteSchema.safeParse({ ...base, rawMaterialId: '' }).success,
    ).toBe(false);
    expect(wasteSchema.safeParse({ ...base, qty: 0 }).success).toBe(false);
  });

  it('only allows known reasons', () => {
    expect(
      wasteSchema.safeParse({ ...base, reason: 'unknown' }).success,
    ).toBe(false);
  });
});
