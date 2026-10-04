'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEnabledModules } from '@/lib/api';
import { isModuleEnabled } from '@/lib/tenant-modules';
import type { TenantModuleKey } from '@/lib/types';

/**
 * Optional tenant modules. An empty list means "all enabled", and while the
 * query is still loading we also treat everything as enabled — never hide a
 * feature before we know it is off.
 */
export function useEnabledModules() {
  const { data } = useQuery({
    queryKey: ['tenant', 'modules'],
    queryFn: getEnabledModules,
    staleTime: 5 * 60 * 1000,
  });

  const isEnabled = useCallback(
    (key: TenantModuleKey) => isModuleEnabled(data ?? [], key),
    [data],
  );

  return { isEnabled, modules: data ?? [] };
}
