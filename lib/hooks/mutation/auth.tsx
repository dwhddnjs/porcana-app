import { useMutation } from '@tanstack/react-query';
import { setGuestSessionId } from '@/lib/api';
import { login, signup } from '@/lib/api/auth';
import { useSignupStore } from '@/lib/hooks/zustand/use-signup-store';
import { UserState, useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { router } from 'expo-router';

export const useLoginMutation = () => {
  const { setUser } = useUserStore((state) => state);
  const resetSignup = useSignupStore((state) => state.reset);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setUser(data as UserState);
      router.replace('/(tabs)');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

export const useSignupMutation = () => {
  const { email, password, reset } = useSignupStore();
  const { mutate: loginMutate } = useLoginMutation();

  return useMutation({
    mutationFn: signup,
    onSuccess: async (data) => {
      setGuestSessionId(null);
      loginMutate({
        email,
        password,
      });
      reset();
    },
    onError: (error) => {
      console.error('Signup failed:', error);
    },
  });
};
