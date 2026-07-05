import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { ProviderTypes } from '@/lib/api/auth';
import type { Session } from '@supabase/supabase-js';

export type ThemeModeTypes = 'light' | 'dark' | 'system';

export type UserProfileTypes = {
  userId: string;
  nickname: string | null;
  mainPortfolioId: string | null;
  isAnonymous: boolean;
  provider: ProviderTypes | 'ANONYMOUS' | null;
};

export interface UserStateTypes {
  user: UserProfileTypes | null;
  themeMode: ThemeModeTypes;
  setUser: (user: UserProfileTypes | null) => void;
  syncFromSession: (session: Session | null) => void;
  isAuthenticated: () => boolean;
  setThemeMode: (mode: ThemeModeTypes) => void;
  reset: () => void;
}

const sessionToProfile = (session: Session | null): UserProfileTypes | null => {
  if (!session?.user) return null;
  const { user } = session;
  const provider = (user.app_metadata?.provider ?? '').toLowerCase();
  return {
    userId: user.id,
    nickname: (user.user_metadata?.nickname as string | undefined) ?? null,
    mainPortfolioId: (user.user_metadata?.main_portfolio_id as string | undefined) ?? null,
    isAnonymous: user.is_anonymous ?? false,
    provider:
      provider === 'google'
        ? 'GOOGLE'
        : provider === 'apple'
          ? 'APPLE'
          : provider === 'email'
            ? 'EMAIL'
            : 'ANONYMOUS',
  };
};

export const useUserStore = create<UserStateTypes>()(
  persist(
    (set, get) => ({
      user: null,
      themeMode: 'system',
      setUser: (user) => set({ user }),
      syncFromSession: (session) => set({ user: sessionToProfile(session) }),
      isAuthenticated: () => {
        const u = get().user;
        return !!u && !u.isAnonymous;
      },
      setThemeMode: (mode) => set({ themeMode: mode }),
      reset: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
    }
  )
);
