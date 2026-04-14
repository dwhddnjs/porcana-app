import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../zustand/use-user-store';
import { useLoadingStore } from '../zustand/use-loading-store';
import {
  createPortfolio,
  directCreatePortfolio,
  deletePortfolio,
  getRebalancingPlan,
  setMainPortfolio,
  setSeed,
  updatePortfolioWeights,
  type PortfolioTypes,
  type UpdateWeightItemTypes,
} from '@/lib/api/portfolio';
import { useCustomPortfolioStore } from '../zustand/use-custom-portfolio-store';
import { toast } from 'sonner-native';
import { useArenaStore } from '../zustand/use-arena-store';
import { useRouter } from 'expo-router';
import { InteractionManager } from 'react-native';
import { createArenaSessions, pickArenaSessionPreference } from '@/lib/api/arena';
import { createGuestSession } from '@/lib/api/auth';
import { setGuestSessionId } from '@/lib/api';
import * as ScreenOrientation from 'expo-screen-orientation';

export const useCreatePortfolioMutation = () => {
  const { user } = useUserStore((state) => state);
  const { setPortfolio, setPicked, resetArena } = useArenaStore((state) => state);
  const { show, hide } = useLoadingStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      riskProfile,
      sectors,
    }: {
      name: string;
      riskProfile: string;
      sectors: string[];
    }) => {
      if (!user?.userId) {
        const { guestSessionId } = await createGuestSession();
        setGuestSessionId(guestSessionId);
      }

      // 1. 포트폴리오 생성
      const portfolio = await createPortfolio({ name });

      // 2. 아레나 세션 생성
      const session = await createArenaSessions({ portfolioId: portfolio.portfolioId });

      // 3. 선호도 설정
      const preference = await pickArenaSessionPreference({
        sessionId: session.sessionId,
        riskProfile,
        sectors,
      });

      return { portfolio, session, preference };
    },
    onMutate: () => {
      resetArena();
      queryClient.removeQueries({ queryKey: ['arena-session-rounds'] });
      show('포트폴리오 생성 중...');
    },
    onSuccess: ({ portfolio, session, preference }) => {
      setPortfolio({
        name: portfolio.name,
        portfolioId: portfolio.portfolioId,
        sessionId: session.sessionId,
        status: session.status,
        currentRound: session.currentRound,
      });
      setPicked(preference.picked, preference.currentRound);
      router.dismiss();

      InteractionManager.runAfterInteractions(() => {
        router.push('/(arena)');
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      });
    },
    onError: (error) => {
      console.error('Portfolio creation failed:', error);
    },
    onSettled: () => {
      hide();
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
};

export const useDirectCreatePortfolioMutation = () => {
  const { show, hide } = useLoadingStore();
  const { clearAssets } = useCustomPortfolioStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      assets,
    }: {
      name: string;
      assets: { assetId: string; weightPct?: number }[];
    }) => directCreatePortfolio({ name, assets }),
    onMutate: () => {
      show('포트폴리오 생성 중...');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      clearAssets();
      toast.success('포트폴리오가 생성되었습니다');
      router.dismissTo('/(tabs)');
      router.push(`/portfolio/${data.portfolioId}`);
    },
    onError: (error) => {
      console.error('Direct portfolio creation failed:', error);
      toast.error('포트폴리오 생성에 실패했습니다');
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
      router.dismiss();
      InteractionManager.runAfterInteractions(() => {
        router.push('/(arena)');
      });
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
    mutationFn: ({
      portfolioId,
      weights,
    }: {
      portfolioId: string;
      weights: UpdateWeightItemTypes[];
    }) => updatePortfolioWeights({ portfolioId, weights }),
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

export const useSetSeedMutation = () => {
  const queryClient = useQueryClient();
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: ({
      portfolioId,
      seedMoney,
      baseCurrency,
    }: {
      portfolioId: string;
      seedMoney: number;
      baseCurrency?: string;
    }) => setSeed({ portfolioId, seedMoney, baseCurrency }),
    onMutate: () => {
      show('시드 금액 설정 중...');
    },
    onSuccess: (_data, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ['holding-baseline', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (error) => {
      console.error('Set seed failed:', error);
    },
    onSettled: () => {
      hide();
    },
  });
};

export const useGetRebalancingPlanMutation = () => {
  return useMutation({
    mutationFn: ({
      portfolioId,
      thresholdPct,
    }: {
      portfolioId: string;
      thresholdPct?: number;
    }) => getRebalancingPlan({ portfolioId, thresholdPct }),
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
