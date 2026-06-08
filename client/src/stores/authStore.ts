import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RealDebridUser } from '@shared/types/api';

interface AuthState {
  user: RealDebridUser | null;
  connected: boolean;
  lastChecked: string | null;
  setUser: (user: RealDebridUser) => void;
  clearUser: () => void;
}

/**
 * Auth state persists the connected user profile only — NOT the API token.
 * The token lives exclusively in server/.env and never touches the browser.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      connected: false,
      lastChecked: null,
      setUser: (user) => set({ user, connected: true, lastChecked: new Date().toISOString() }),
      clearUser: () => set({ user: null, connected: false, lastChecked: null }),
    }),
    { name: 'auth-store' },
  ),
);
