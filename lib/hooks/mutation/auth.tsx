import { useMutation } from '@tanstack/react-query';
import { login, signup } from '@/lib/api/auth';
import { useSignupStore } from '@/lib/hooks/zustand/use-signup-store';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { useArenaStore } from '@/lib/hooks/zustand/use-arena-store';
import { finalizeArenaPortfolio } from '@/lib/api/arena';
import { queryClient } from '@/lib/react-query';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

const finalizePendingArena = async (): Promise<void> => {
  const { name, picked, selectedCards, resetArena } = useArenaStore.getState();
  if (!picked || selectedCards.length !== 10) return;

  await finalizeArenaPortfolio({
    name,
    riskProfile: picked.riskProfile,
    sectors: picked.sectors,
    pickedAssetIds: selectedCards.map((c) => c.assetId),
  });
  resetArena();
  queryClient.invalidateQueries({ queryKey: ['home'] });
  queryClient.invalidateQueries({ queryKey: ['portfolios'] });
};

export const useLoginMutation = () => {
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: login,
    onMutate: () => {
      show('로그인 중...');
    },
    onSuccess: async () => {
      try {
        await finalizePendingArena();
      } catch (e) {
        console.error('arena finalize after login failed:', e);
      }
      router.replace('/(tabs)');
    },
    onError: (error) => {
      console.error('Login failed:', error);
      toast.error('이메일과 비밀번호를 확인해주세요');
    },
    onSettled: () => {
      hide();
    },
  });
};

export const useSignupMutation = () => {
  const { reset } = useSignupStore();
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: signup,
    onMutate: () => {
      show('회원가입 중...');
    },
    onSuccess: async () => {
      reset();
      try {
        await finalizePendingArena();
      } catch (e) {
        console.error('arena finalize after signup failed:', e);
      }
      router.replace('/(tabs)');
    },
    onError: (error: Error) => {
      console.error('Signup failed:', error);
      toast.error(error.message ?? '회원가입에 실패했어요');
    },
    onSettled: () => {
      hide();
    },
  });
};
