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
  hasCompletedInstall: boolean;
  setUser: (user: UserProfileTypes | null) => void;
  syncFromSession: (session: Session | null) => void;
  isAuthenticated: () => boolean;
  setThemeMode: (mode: ThemeModeTypes) => void;
  setHasCompletedInstall: (value: boolean) => void;
  reset: () => void;
}

const resolveProvider = (
  user: NonNullable<Session['user']>,
  isAnonymous: boolean
): UserProfileTypes['provider'] => {
  if (isAnonymous) return 'ANONYMOUS';

  // 익명 계정에 이메일을 나중에 연결하면 app_metadata.provider가 갱신되지 않으므로,
  // 실제 연결된 identity 목록을 우선 신뢰한다.
  const providers = new Set((user.identities ?? []).map((identity) => identity.provider));
  const rawProvider = (user.app_metadata?.provider ?? '').toLowerCase();
  const has = (p: string) => providers.has(p) || rawProvider === p;

  if (has('google')) return 'GOOGLE';
  if (has('apple')) return 'APPLE';
  if (has('email') || !!user.email) return 'EMAIL';
  return null;
};

const sessionToProfile = (session: Session | null): UserProfileTypes | null => {
  if (!session?.user) return null;
  const { user } = session;
  const isAnonymous = user.is_anonymous ?? false;
  return {
    userId: user.id,
    nickname: (user.user_metadata?.nickname as string | undefined) ?? null,
    mainPortfolioId: (user.user_metadata?.main_portfolio_id as string | undefined) ?? null,
    isAnonymous,
    provider: resolveProvider(user, isAnonymous),
  };
};

export const useUserStore = create<UserStateTypes>()(
  persist(
    (set, get) => ({
      user: null,
      themeMode: 'system',
      hasCompletedInstall: false,
      setUser: (user) => set({ user }),
      syncFromSession: (session) => set({ user: sessionToProfile(session) }),
      isAuthenticated: () => {
        const u = get().user;
        return !!u && !u.isAnonymous;
      },
      setThemeMode: (mode) => set({ themeMode: mode }),
      setHasCompletedInstall: (value) => set({ hasCompletedInstall: value }),
      reset: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        hasCompletedInstall: state.hasCompletedInstall,
      }),
    }
  )
);
