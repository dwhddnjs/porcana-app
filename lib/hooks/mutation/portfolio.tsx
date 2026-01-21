import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../zustand/use-user-store';
import { createPortfolio } from '@/lib/api/portfolio';
import { useArenaStore } from '../zustand/use-arena-store';
import { useRouter } from 'expo-router';

export const useCreatePortfolioMutation = () => {
  const { user, accessToken } = useUserStore((state) => state);
  console.log(user);
  console.log(accessToken);
  const { setPortfolio } = useArenaStore((state) => state);
  const router = useRouter();

  return useMutation({
    mutationFn: (name: string) => {
      if (!user?.userId) {
        return Promise.reject(new Error('User not found'));
      }
      return createPortfolio({ name, userId: user.userId });
    },
    onSuccess: (data) => {
      setPortfolio({ name: data.name, portfolioId: data.id });
      router.push('/add-modal');
    },
    onError: (error) => {
      console.error('Portfolio creation failed:', error);
    },
  });
};
