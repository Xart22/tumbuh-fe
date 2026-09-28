import { describe, expect, it } from 'vitest';
import { outletSchema, toOutletInput } from './outlet-form';
import { transferSchema } from './outlets-view';

describe('outletSchema', () => {
  const base = { name: 'Cabang 2', timezone: 'Asia/Jakarta' };

  it('accepts a minimal outlet', () => {
    expect(outletSchema.safeParse(base).success).toBe(true);
  });

  it('requires a name and timezone', () => {
    expect(outletSchema.safeParse({ ...base, name: ' ' }).success).toBe(false);
    expect(outletSchema.safeParse({ ...base, timezone: '' }).success).toBe(
      false,
    );
  });
});

describe('toOutletInput', () => {
  it('trims and drops empty optionals', () => {
    expect(
      toOutletInput({
        name: ' Cabang 2 ',
        address: ' ',
        city: 'Bandung',
        phone: '',
        picName: '',
        timezone: 'Asia/Jakarta',
      }),
    ).toEqual({
      name: 'Cabang 2',
      address: undefined,
      city: 'Bandung',
      phone: undefined,
      picName: undefined,
      timezone: 'Asia/Jakarta',
    });
  });
});

describe('transferSchema', () => {
  const base = {
    toOutletId: 'o2',
    notes: '',
    items: [{ rawMaterialId: 'm1', qty: 2 }],
  };

  it('accepts a valid transfer', () => {
    expect(transferSchema.safeParse(base).success).toBe(true);
  });

  it('requires a target outlet and at least one item', () => {
    expect(
      transferSchema.safeParse({ ...base, toOutletId: '' }).success,
    ).toBe(false);
    expect(transferSchema.safeParse({ ...base, items: [] }).success).toBe(
      false,
    );
  });

  it('rejects a non-positive qty', () => {
    expect(
      transferSchema.safeParse({
        ...base,
        items: [{ rawMaterialId: 'm1', qty: 0 }],
      }).success,
    ).toBe(false);
  });
});
