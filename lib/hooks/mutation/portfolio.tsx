import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../zustand/use-user-store';
import { useLoadingStore } from '../zustand/use-loading-store';
import { createPortfolio, setMainPortfolio, type Portfolio } from '@/lib/api/portfolio';
import { useArenaStore } from '../zustand/use-arena-store';
import { useRouter } from 'expo-router';
import { createArenaSessions, pickArenaSessionPreference } from '@/lib/api/arena';
import { createGuestSession } from '@/lib/api/auth';
import { setGuestSessionId } from '@/lib/api';

export const useCreatePortfolioMutation = () => {
  const { user } = useUserStore((state) => state);
  const { setPortfolio, resetArena } = useArenaStore((state) => state);
  const { show, hide } = useLoadingStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (user?.userId) {
        return createPortfolio({ name });
      }
      const { guestSessionId } = await createGuestSession();
      setGuestSessionId(guestSessionId);
      return createPortfolio({ name });
    },
    onMutate: () => {
      // 이전 아레나 상태 및 캐시 정리
      resetArena();
      queryClient.removeQueries({ queryKey: ['arena-session-rounds'] });
      show('포트폴리오 생성 중...');
    },
    onSuccess: async (data) => {
      if (!data) {
        console.log('data is null');
        return;
      }
      const response = await createArenaSessions({ portfolioId: data.portfolioId });
      console.log('response', response);

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
    onSettled: () => {
      hide();
    },
  });
};

export const usePickArenaSessionPreferenceMutation = () => {
  const setPicked = useArenaStore((state) => state.setPicked);
  const { show, hide } = useLoadingStore();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ riskProfile, sectors }: { riskProfile: string; sectors: string[] }) => {
      // 최신 sessionId를 가져옴
      const sessionId = useArenaStore.getState().sessionId;
      if (!sessionId) {
        return Promise.reject(new Error('Session not found'));
      }
      return pickArenaSessionPreference({ sessionId, riskProfile, sectors });
    },
    onMutate: () => {
      show('설정 중...');
    },
    onSuccess: (data) => {
      setPicked(data.picked, data.currentRound);
      router.push('/start-arena');
    },
    onError: (error) => {
      console.error('Arena session preference picking failed:', error);
    },
    onSettled: () => {
      hide();
    },
  });
};

type PreviousPortfolioData = {
  previousEntries: Array<{ queryKey: readonly unknown[]; data: unknown }>;
};

export const useSetMainPortfolioMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (portfolioId: string) => setMainPortfolio({ portfolioId }),
    onMutate: async (portfolioId: string) => {
      await queryClient.cancelQueries({ queryKey: ['portfolios'] });

      const previousEntries = queryClient
        .getQueriesData({ queryKey: ['portfolios'] })
        .map(([queryKey, data]) => ({
          queryKey,
          data,
        }));

      queryClient.setQueryData<Portfolio[]>(['portfolios'], (old) =>
        old
          ? old.map((p) => ({
              ...p,
              isMain: p.portfolioId === portfolioId,
            }))
          : old
      );

      queryClient
        .getQueriesData<Portfolio>({ queryKey: ['portfolios'] })
        .forEach(([queryKey, data]) => {
          if (queryKey.length === 2 && typeof queryKey[1] === 'string' && data) {
            queryClient.setQueryData<Portfolio>(queryKey, {
              ...data,
              isMain: data.portfolioId === portfolioId,
            });
          }
        });

      return { previousEntries };
    },
    onError: (error, _portfolioId, context: PreviousPortfolioData | undefined) => {
      console.error('Set main portfolio failed:', error);
      context?.previousEntries.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_data, _error, portfolioId) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
};
