import { describe, expect, it } from 'vitest';
import { poSchema } from './create-po-modal';

const line = { rawMaterialId: 'm1', qtyOrdered: 10, unitPrice: 19500 };

describe('poSchema', () => {
  it('accepts a supplier with one valid line', () => {
    expect(
      poSchema.safeParse({ supplierId: 's1', items: [line] }).success,
    ).toBe(true);
  });

  it('requires a supplier', () => {
    expect(poSchema.safeParse({ supplierId: '', items: [line] }).success).toBe(
      false,
    );
  });

  it('requires at least one line', () => {
    expect(poSchema.safeParse({ supplierId: 's1', items: [] }).success).toBe(
      false,
    );
  });

  it('rejects zero qty and negative price', () => {
    expect(
      poSchema.safeParse({
        supplierId: 's1',
        items: [{ ...line, qtyOrdered: 0 }],
      }).success,
    ).toBe(false);
    expect(
      poSchema.safeParse({
        supplierId: 's1',
        items: [{ ...line, unitPrice: -1 }],
      }).success,
    ).toBe(false);
  });
});
