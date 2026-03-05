import { useMutation } from '@tanstack/react-query';
import { deleteAccount, updateProfile } from '@/lib/api/user';
import { UserStateTypes, useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { queryClient } from '@/lib/react-query';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

export const useDeleteAccountMutation = () => {
  const reset = useUserStore((s) => s.reset);
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: deleteAccount,
    onMutate: () => {
      show('탈퇴 중...');
    },
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      reset();
      router.replace('/landing');
    },
    onError: (error) => {
      hide();
      console.error('Delete account failed:', error);
    },
    onSettled: () => {
      hide();
    },
  });
};

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
      toast.success('닉네임이 변경되었습니다.');
      router.back();
    },
    onError: () => {
      toast.error('닉네임 변경에 실패했습니다.');
    },
    onSettled: () => {
      hide();
    },
  });
};
