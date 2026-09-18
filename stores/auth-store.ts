'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  apiFetch,
  setAuthContext,
  setUnauthorizedHandler,
} from '@/lib/api-client';
import type { LoginKasirResult, Outlet, PublicStore, Role } from '@/lib/types';

export type AuthUser = { id: string; name: string; role: Role };

type AuthState = {
  token: string | null;
  outletId: string | null;
  outletName: string | null;
  user: AuthUser | null;
  tenantSlug: string;
  login: (outletId: string, pin: string) => Promise<void>;
  logout: () => void;
  selectOutlet: (outletId: string, outletName: string) => void;
  setTenantSlug: (slug: string) => void;
  isAuthed: () => boolean;
};

/** Tenant default matches the seeded BE tenant; override on the login screen. */
const DEFAULT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'kopikita';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      outletId: null,
      outletName: null,
      user: null,
      tenantSlug: DEFAULT_SLUG,

      async login(outletId, pin) {
        const result = await apiFetch<LoginKasirResult>('/v1/auth/login-kasir', {
          method: 'POST',
          body: { outletId, pin },
          outletScoped: false,
        });
        const outletName =
          get().outletId === outletId ? get().outletName : null;
        set({
          token: result.accessToken,
          outletId,
          outletName,
          user: {
            id: result.user.id,
            name: result.user.name,
            role: result.user.role,
          },
        });
        setAuthContext(result.accessToken, outletId);
      },

      logout() {
        set({ token: null, outletId: null, outletName: null, user: null });
        setAuthContext(null, null);
      },

      selectOutlet(outletId, outletName) {
        set({ outletId, outletName });
        setAuthContext(get().token, outletId);
      },

      setTenantSlug(slug) {
        set({ tenantSlug: slug });
      },

      isAuthed() {
        return Boolean(get().token && get().outletId);
      },
    }),
    {
      name: 'tumbuh-auth',
      partialize: (state) => ({
        token: state.token,
        outletId: state.outletId,
        outletName: state.outletName,
        user: state.user,
        tenantSlug: state.tenantSlug,
      }),
      onRehydrateStorage: () => (state) => {
        setAuthContext(state?.token ?? null, state?.outletId ?? null);
      },
    },
  ),
);

// Clearing the token is enough: AuthGate watches it and redirects to /login.
setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});

/** Public storefront lookup — no auth, so the login screen can list outlets. */
export function fetchPublicStore(slug: string): Promise<PublicStore> {
  return apiFetch<PublicStore>(`/v1/store/${encodeURIComponent(slug)}`, {
    outletScoped: false,
  });
}

export type { Outlet };
