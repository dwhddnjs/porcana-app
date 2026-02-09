import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { ProviderTypes } from '@/lib/api/auth';

export type ThemeModeTypes = 'light' | 'dark' | 'system';

export interface UserStateTypes {
  user: {
    userId: string;
    nickname: string;
    mainPortfolioId: string | null;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
  provider: ProviderTypes | null;
  themeMode: ThemeModeTypes;
  setUser: (data: UserStateTypes) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  isAuthenticated: () => boolean;
  setThemeMode: (mode: ThemeModeTypes) => void;
  reset: () => void;
  logout: () => void;
}

export const useUserStore = create<UserStateTypes>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      provider: null,
      themeMode: 'system',
      setUser: (data: UserStateTypes) => set(data),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),
      isAuthenticated: () => !!get().accessToken,
      setThemeMode: (mode) => set({ themeMode: mode }),
      reset: () => set({ user: null, accessToken: null, refreshToken: null, provider: null }),
      logout: () => set({ accessToken: null, refreshToken: null, provider: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
