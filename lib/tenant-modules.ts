import type { TenantModuleKey } from './types';

/**
 * Mirrors the BE rule: an empty module list means "all enabled" (tenants
 * created before onboarding v2), otherwise the key must be present.
 */
export function isModuleEnabled(
  modules: readonly string[],
  key: TenantModuleKey,
): boolean {
  return modules.length === 0 || modules.includes(key);
}
