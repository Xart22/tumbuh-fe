import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // POS/backoffice data changes on every sale; 60s keeps dashboards
        // fresh without refetch storms. Transport retries live in apiFetch.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}
