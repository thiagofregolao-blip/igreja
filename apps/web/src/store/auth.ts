import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicUser } from '@catedral/types';

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (data: { user: PublicUser; accessToken: string; refreshToken: string }) => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: PublicUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'catedral-auth' },
  ),
);
