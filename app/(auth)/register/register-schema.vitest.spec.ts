import { describe, expect, it } from 'vitest';
import { registerSchema } from './types';

const VALID = {
  ownerName: 'Dimas Pratama',
  email: 'dimas@kopitumbuh.id',
  phone: '081289012345',
  password: 'KalaSenja2025!',
  confirmPassword: 'KalaSenja2025!',
  agreed: true,
  brandName: 'Kala Senja Coffee',
  businessType: 'cafe',
  outletName: 'Outlet Utama - Senopati',
  city: 'Jakarta Selatan, DKI Jakarta',
  address: 'Jl. Senopati No. 42',
  modulePos: true,
  moduleInventory: true,
  moduleShifts: true,
} as const;

describe('registerSchema', () => {
  it('accepts a complete valid payload', () => {
    expect(registerSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects a bad email', () => {
    const r = registerSchema.safeParse({ ...VALID, email: 'bukan-email' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.path).toEqual(['email']);
    }
  });

  it('rejects a short password', () => {
    const r = registerSchema.safeParse({
      ...VALID,
      password: 'pendek',
      confirmPassword: 'pendek',
    });
    expect(r.success).toBe(false);
  });

  it('rejects a mismatched confirmation on the confirmPassword path', () => {
    const r = registerSchema.safeParse({ ...VALID, confirmPassword: 'Lain2025!' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('confirmPassword');
    }
  });

  it('requires agreement to terms', () => {
    const r = registerSchema.safeParse({ ...VALID, agreed: false });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.path).toEqual(['agreed']);
    }
  });

  it('requires business profile fields', () => {
    const r = registerSchema.safeParse({ ...VALID, brandName: '  ', address: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['brandName', 'address']));
    }
  });
});
