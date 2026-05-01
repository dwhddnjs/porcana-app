import { useMutation } from '@tanstack/react-query';
import { login, signup } from '@/lib/api/auth';
import { useSignupStore } from '@/lib/hooks/zustand/use-signup-store';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

export const useLoginMutation = () => {
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: login,
    onMutate: () => {
      show('로그인 중...');
    },
    onSuccess: () => {
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
    onSuccess: () => {
      reset();
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
