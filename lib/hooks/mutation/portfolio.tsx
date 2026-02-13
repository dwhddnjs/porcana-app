import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../zustand/use-user-store';
import { useLoadingStore } from '../zustand/use-loading-store';
import {
  createPortfolio,
  deletePortfolio,
  setMainPortfolio,
  updatePortfolioWeights,
  type PortfolioTypes,
  type UpdateWeightItemTypes,
} from '@/lib/api/portfolio';
import { toast } from 'sonner-native';
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
      console.error('PortfolioTypes creation failed:', error);
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

export const useUpdatePortfolioWeightsMutation = () => {
  const queryClient = useQueryClient();
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: ({ portfolioId, weights }: { portfolioId: string; weights: UpdateWeightItemTypes[] }) =>
      updatePortfolioWeights({ portfolioId, weights }),
    onMutate: () => {
      show('비중 수정 중...');
    },
    onSuccess: (_data, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (error) => {
      console.error('Update portfolio weights failed:', error);
    },
    onSettled: () => {
      hide();
    },
  });
};

type PreviousPortfolioDataTypes = {
  previousEntries: Array<{ queryKey: readonly unknown[]; data: unknown }>;
};

export const useDeletePortfolioMutation = () => {
  const queryClient = useQueryClient();
  const { show, hide } = useLoadingStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (portfolioId: string) => deletePortfolio({ portfolioId }),
    onMutate: () => {
      show('포트폴리오 삭제 중...');
    },
    onSuccess: (_data, portfolioId) => {
      queryClient.removeQueries({ queryKey: ['portfolios', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toast.success('포트폴리오가 삭제되었습니다');
      router.back();
    },
    onError: (error) => {
      console.error('Delete portfolio failed:', error);
    },
    onSettled: () => {
      hide();
    },
  });
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

      queryClient.setQueryData<PortfolioTypes[]>(['portfolios'], (old) =>
        old
          ? old.map((p) => ({
              ...p,
              isMain: p.portfolioId === portfolioId,
            }))
          : old
      );

      queryClient
        .getQueriesData<PortfolioTypes>({ queryKey: ['portfolios'] })
        .forEach(([queryKey, data]) => {
          if (queryKey.length === 2 && typeof queryKey[1] === 'string' && data) {
            queryClient.setQueryData<PortfolioTypes>(queryKey, {
              ...data,
              isMain: data.portfolioId === portfolioId,
            });
          }
        });

      return { previousEntries };
    },
    onError: (error, _portfolioId, context: PreviousPortfolioDataTypes | undefined) => {
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
