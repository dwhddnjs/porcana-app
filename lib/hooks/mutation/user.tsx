import { useMutation } from '@tanstack/react-query';
import { updateProfile } from '@/lib/api/user';
import { UserStateTypes, useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { router } from 'expo-router';

export const useUpdateProfileMutation = () => {
  const { user, setUser } = useUserStore((state) => state);
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: () => {
      show('저장 중...');
    },
    onSuccess: (data) => {
      if (user) {
        setUser({ user: { ...user, nickname: data.nickname } } as UserStateTypes);
      }
      router.back();
    },
    onError: (error) => {
      console.error('Update profile failed:', error);
    },
    onSettled: () => {
      hide();
    },
  });
};
