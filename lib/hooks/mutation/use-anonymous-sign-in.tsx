import { signInAnonymously } from '@/lib/api/auth';
import { useMutation } from '@tanstack/react-query';

export const useAnonymousSignIn = () => {
  return useMutation({
    mutationFn: signInAnonymously,
    onError: (error) => {
      console.error('Anonymous sign-in failed:', error);
    },
  });
};
