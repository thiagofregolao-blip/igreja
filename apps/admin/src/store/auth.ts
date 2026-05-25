import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicUser } from '@catedral/types';

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (s: { user: PublicUser; accessToken: string; refreshToken: string }) => void;
  setTokens: (a: string, r: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (s) => set(s),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'catedral-admin-auth' },
  ),
);
