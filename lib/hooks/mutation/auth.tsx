import { useMutation } from '@tanstack/react-query';
import { setGuestSessionId } from '@/lib/api';
import { login, signup } from '@/lib/api/auth';
import { useSignupStore } from '@/lib/hooks/zustand/use-signup-store';
import { UserStateTypes, useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

export const useLoginMutation = () => {
  const { setUser } = useUserStore((state) => state);
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: login,
    onMutate: () => {
      show('로그인 중...');
    },
    onSuccess: (data) => {
      setUser(data as UserStateTypes);
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
  const { email, password, reset } = useSignupStore();
  const { mutate: loginMutate } = useLoginMutation();
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: signup,
    onMutate: () => {
      show('회원가입 중...');
    },
    onSuccess: async (data) => {
      setGuestSessionId(null);
      const currentEmail = email;
      const currentPassword = password;
      reset();
      loginMutate({
        email: currentEmail,
        password: currentPassword,
      });
    },
    onError: (error) => {
      console.error('Signup failed:', error);
      hide();
    },
  });
};
