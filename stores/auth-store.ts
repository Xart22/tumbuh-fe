'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  apiFetch,
  setAuthContext,
  setUnauthorizedHandler,
} from '@/lib/api-client';
import { loginOwner, WorkspaceChoiceRequired } from '@/lib/api';
export { WorkspaceChoiceRequired };
import type {
  LoginKasirResult,
  Outlet,
  PublicStore,
  Role,
} from '@/lib/types';

export type AuthUser = { id: string; name: string; role: Role };

type AuthState = {
  token: string | null;
  outletId: string | null;
  outletName: string | null;
  user: AuthUser | null;
  tenantSlug: string;
  login: (outletId: string, pin: string) => Promise<void>;
  /** Workspace owner/manager login — session without an outlet scope. */
  loginOwner: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  logout: () => void;
  selectOutlet: (outletId: string, outletName: string) => void;
  setTenantSlug: (slug: string) => void;
  /** Kasir session: token + outlet bound. */
  isAuthed: () => boolean;
  /** Any session (kasir or owner): token + user present. */
  hasSession: () => boolean;
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

      async loginOwner(email, password, tenantSlug?) {
        const result = await loginOwner({ email, password, tenantSlug });
        if (!('accessToken' in result)) {
          throw new WorkspaceChoiceRequired(result.workspaces);
        }
        if (tenantSlug) set({ tenantSlug: tenantSlug.trim().toLowerCase() });
        set({
          token: result.accessToken,
          outletId: null,
          outletName: null,
          user: {
            id: result.user.id,
            name: result.user.name,
            role: result.user.role as Role,
          },
        });
        setAuthContext(result.accessToken, null);
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

      hasSession() {
        return Boolean(get().token && get().user);
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
