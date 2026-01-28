import { useMutation, useQuery } from '@tanstack/react-query';
import { useUserStore } from '../zustand/use-user-store';
import { createPortfolio, getPortfolios } from '@/lib/api/portfolio';
import { useArenaStore } from '../zustand/use-arena-store';
import { useRouter } from 'expo-router';
import { createArenaSessions, pickArenaSessionPreference } from '@/lib/api/arena';

export const useCreatePortfolioMutation = () => {
  const { user, accessToken } = useUserStore((state) => state);
  const { setPortfolio } = useArenaStore((state) => state);
  const router = useRouter();

  return useMutation({
    mutationFn: (name: string) => {
      if (!user?.userId) {
        return Promise.reject(new Error('User not found'));
      }
      return createPortfolio({ name, userId: user.userId });
    },
    onSuccess: async (data) => {
      if (!data) {
        console.log('data is null');
        return;
      }
      const response = await createArenaSessions({ portfolioId: data.portfolioId });

      if (!response) {
        console.log('response is null');
        return;
      }

      setPortfolio({
        name: data.name,
        portfolioId: data.portfolioId,
        sessionId: response.sessionId,
        status: response.status,
        currentRound: response.currentRound,
      });
      router.push('/add-modal');
    },
    onError: (error) => {
      console.error('Portfolio creation failed:', error);
    },
  });
};

export const usePickArenaSessionPreferenceMutation = () => {
  const { sessionId, setPicked } = useArenaStore((state) => state);
  const router = useRouter();
  return useMutation({
    mutationFn: ({ riskProfile, sectors }: { riskProfile: string; sectors: string[] }) => {
      if (!sessionId) {
        return Promise.reject(new Error('Session not found'));
      }
      return pickArenaSessionPreference({ sessionId, riskProfile, sectors });
    },
    onSuccess: (data) => {
      setPicked(data.picked, data.currentRound);
      router.push('/start-arena');
    },
    onError: (error) => {
      console.error('Arena session preference picking failed:', error);
    },
  });
};
