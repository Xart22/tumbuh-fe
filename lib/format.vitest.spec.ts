import { describe, expect, it } from 'vitest';
import { formatIDR, formatNumber, formatQty, todayISO } from './format';

describe('formatIDR', () => {
  it('formats rupiah without decimals', () => {
    const out = formatIDR(14820000);
    expect(out).toContain('Rp');
    expect(out).toContain('14.820.000');
    expect(out).not.toContain(',');
  });

  it('treats nullish as zero', () => {
    expect(formatIDR(null as unknown as number)).toContain('0');
  });
});

describe('formatNumber', () => {
  it('groups thousands id-ID', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });
});

describe('formatQty', () => {
  it('keeps fractional stock (id-ID comma)', () => {
    expect(formatQty(1.5)).toBe('1,5');
    expect(formatQty(0.5)).toBe('0,5');
  });

  it('rounds to at most 2 decimals and groups thousands', () => {
    expect(formatQty(1234.567)).toBe('1.234,57');
  });
});

describe('todayISO', () => {
  it('returns YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
