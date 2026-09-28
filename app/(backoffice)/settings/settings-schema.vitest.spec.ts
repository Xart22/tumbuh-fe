import { describe, expect, it } from 'vitest';
import {
  opsSchema,
  outletProfileSchema,
  taxSchema,
  toOpsPatch,
  toProfilePayload,
  toTaxPatch,
} from './settings-forms';

describe('outletProfileSchema', () => {
  it('requires a name and timezone', () => {
    expect(
      outletProfileSchema.safeParse({ name: ' ', timezone: 'Asia/Jakarta' })
        .success,
    ).toBe(false);
    expect(
      outletProfileSchema.safeParse({ name: 'Kopi', timezone: '' }).success,
    ).toBe(false);
  });

  it('accepts a valid profile', () => {
    expect(
      outletProfileSchema.safeParse({
        name: 'Kopi',
        timezone: 'Asia/Jakarta',
      }).success,
    ).toBe(true);
  });
});

describe('toProfilePayload', () => {
  it('trims and nulls empty optionals', () => {
    expect(
      toProfilePayload({
        name: ' Kopi ',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
        picName: '',
        timezone: 'Asia/Jakarta',
      }),
    ).toEqual({
      name: 'Kopi',
      address: null,
      city: null,
      postalCode: null,
      phone: null,
      picName: null,
      timezone: 'Asia/Jakarta',
    });
  });
});

describe('taxSchema', () => {
  const base = {
    taxEnabled: true,
    taxRate: 11,
    taxName: 'PPN',
    scEnabled: false,
    scRate: 0,
    roundingBase: 100,
  };

  it('accepts a valid tax config', () => {
    expect(taxSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a rate over 100', () => {
    expect(taxSchema.safeParse({ ...base, taxRate: 120 }).success).toBe(false);
  });

  it('requires an integer rounding base >= 1', () => {
    expect(taxSchema.safeParse({ ...base, roundingBase: 0 }).success).toBe(
      false,
    );
    expect(taxSchema.safeParse({ ...base, roundingBase: 12.5 }).success).toBe(
      false,
    );
  });
});

describe('toTaxPatch', () => {
  it('maps to nested settings blocks', () => {
    expect(
      toTaxPatch({
        taxEnabled: true,
        taxRate: 11,
        taxName: ' PPN ',
        scEnabled: true,
        scRate: 5,
        roundingBase: 100,
      }),
    ).toEqual({
      tax: { enabled: true, rate: 11, name: 'PPN' },
      serviceCharge: { enabled: true, rate: 5 },
      roundingBase: 100,
    });
  });
});

describe('toOpsPatch', () => {
  it('maps kds/attendance/receipt', () => {
    expect(
      toOpsPatch({
        alertMinutes: 15,
        maxRadiusM: 100,
        requireGps: true,
        requirePhoto: false,
        receiptWhatsapp: true,
      }),
    ).toEqual({
      kds: { alertMinutes: 15, stationRules: [] },
      attendance: { maxRadiusM: 100, requireGps: true, requirePhoto: false },
      receipt: { whatsapp: true },
    });
  });
});

describe('opsSchema', () => {
  const base = {
    alertMinutes: 15,
    maxRadiusM: 100,
    requireGps: false,
    requirePhoto: false,
    receiptWhatsapp: false,
  };

  it('accepts a valid ops config', () => {
    expect(opsSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a negative radius', () => {
    expect(opsSchema.safeParse({ ...base, maxRadiusM: -1 }).success).toBe(false);
  });
});
