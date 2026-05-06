import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoadingStore } from '../zustand/use-loading-store';
import {
  directCreatePortfolio,
  deletePortfolio,
  executeTopUp,
  getRebalancingPlan,
  getSeedPreview,
  getTopUpPlan,
  setMainPortfolio,
  setSeed,
  triggerRecalc,
  updatePortfolioWeights,
  type PortfolioTypes,
  type TopUpExecuteRequestTypes,
  type UpdateWeightItemTypes,
} from '@/lib/api/portfolio';
import { useCustomPortfolioStore } from '../zustand/use-custom-portfolio-store';
import { toast } from 'sonner-native';
import { useRouter } from 'expo-router';

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
      triggerRecalc({ portfolioId: data.portfolioId }).catch(() => {});
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

export const useSeedPreviewMutation = () => {
  return useMutation({
    mutationFn: ({
      portfolioId,
      seedMoney,
      baseCurrency,
    }: {
      portfolioId: string;
      seedMoney: number;
      baseCurrency?: string;
    }) => getSeedPreview({ portfolioId, seedMoney, baseCurrency }),
    onError: (error) => {
      console.error('Seed preview failed:', error);
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

export const useGetTopUpPlanMutation = () => {
  return useMutation({
    mutationFn: ({
      portfolioId,
      additionalCash,
    }: {
      portfolioId: string;
      additionalCash: number;
    }) => getTopUpPlan({ portfolioId, additionalCash }),
  });
};

export const useExecuteTopUpMutation = () => {
  const queryClient = useQueryClient();
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: ({
      portfolioId,
      additionalCash,
      purchases,
      addRemainingCashToBaseline,
    }: {
      portfolioId: string;
    } & TopUpExecuteRequestTypes) =>
      executeTopUp({ portfolioId, additionalCash, purchases, addRemainingCashToBaseline }),
    onMutate: () => {
      show('추가 입금 처리 중...');
    },
    onSuccess: (_data, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ['holding-baseline', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (error) => {
      console.error('Execute top-up failed:', error);
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
      queryClient.invalidateQueries({ queryKey: ['holding-baseline'] });
    },
  });
};
