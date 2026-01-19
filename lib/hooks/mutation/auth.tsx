import { useMutation } from '@tanstack/react-query';
import { signup } from '@/lib/api/auth';
import { useSignupStore } from '../use-signup-store';
import { useUserStore } from '../use-user-store';

export const useSignupMutation = () => {
  const resetSignup = useSignupStore((state) => state.reset);
  const setTokens = useUserStore((state) => state.setTokens);

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      // 토큰이 응답에 포함되어 있다면 저장
      if (data?.accessToken && data?.refreshToken) {
        setTokens(data.accessToken, data.refreshToken);
      }
      // 회원가입 스토어 초기화
      resetSignup();
    },
    onError: (error) => {
      console.error('Signup failed:', error);
    },
  });
};
