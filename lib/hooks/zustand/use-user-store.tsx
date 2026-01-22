import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { ProviderTypes } from '@/lib/api/auth';

export interface UserState {
  user: {
    userId: string;
    nickname: string;
    mainPortfolioId: string | null;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
  provider: ProviderTypes | null;
  setUser: (data: UserState) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  isAuthenticated: () => boolean;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      provider: null,
      setUser: (data: UserState) => set(data),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),
      isAuthenticated: () => !!get().accessToken,
      reset: () => set({ user: null, accessToken: null, refreshToken: null, provider: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
