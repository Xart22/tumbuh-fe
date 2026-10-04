import { describe, expect, it } from 'vitest';
import { isModuleEnabled } from './tenant-modules';

describe('isModuleEnabled', () => {
  it('treats an empty list as all-enabled', () => {
    expect(isModuleEnabled([], 'inventory')).toBe(true);
  });

  it('allows a listed module and blocks an unlisted one', () => {
    expect(isModuleEnabled(['pos', 'inventory'], 'inventory')).toBe(true);
    expect(isModuleEnabled(['pos', 'inventory'], 'accounting')).toBe(false);
  });
});
