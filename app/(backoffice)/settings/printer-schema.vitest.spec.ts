import { describe, expect, it } from 'vitest';
import { printerSchema } from './printer-panel';

describe('printerSchema', () => {
  const base = {
    name: 'Kasir 1',
    type: 'thermal' as const,
    connection: 'usb' as const,
    address: '',
    paperWidth: 58,
    station: '',
  };

  it('accepts a valid printer', () => {
    expect(printerSchema.safeParse(base).success).toBe(true);
  });

  it('requires a name', () => {
    expect(printerSchema.safeParse({ ...base, name: ' ' }).success).toBe(false);
  });

  it('rejects an unknown connection', () => {
    expect(
      printerSchema.safeParse({ ...base, connection: 'wifi' }).success,
    ).toBe(false);
  });

  it('requires a sane paper width', () => {
    expect(printerSchema.safeParse({ ...base, paperWidth: 0 }).success).toBe(
      false,
    );
    expect(printerSchema.safeParse({ ...base, paperWidth: 500 }).success).toBe(
      false,
    );
  });
});
