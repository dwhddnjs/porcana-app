import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { ProviderTypes } from '@/lib/api/auth';

interface UserState {
  accessToken: string | null;
  refreshToken: string | null;
  provider: ProviderTypes | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  isAuthenticated: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      provider: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
