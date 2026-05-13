import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoadingStore } from '../zustand/use-loading-store';
import {
  executeSimulationTopUp,
  getSimulationPreview,
  getSimulationTopUpPlan,
  resetSimulation,
  startSimulation,
} from '@/lib/api/simulation';

const invalidateSimulationQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  portfolioId: string
) => {
  queryClient.invalidateQueries({ queryKey: ['simulation', 'baseline', portfolioId] });
  queryClient.invalidateQueries({ queryKey: ['simulation', 'chart', portfolioId] });
  queryClient.invalidateQueries({ queryKey: ['simulation', 'returns', portfolioId] });
  queryClient.invalidateQueries({ queryKey: ['simulation', 'holding-returns', portfolioId] });
  queryClient.invalidateQueries({ queryKey: ['portfolios', portfolioId] });
  queryClient.invalidateQueries({ queryKey: ['portfolios'] });
  queryClient.invalidateQueries({ queryKey: ['home'] });
};

export const useSimulationPreviewMutation = () => {
  return useMutation({
    mutationFn: ({
      portfolioId,
      seedMoney,
      baseCurrency,
    }: {
      portfolioId: string;
      seedMoney: number;
      baseCurrency?: string;
    }) => getSimulationPreview({ portfolioId, seedMoney, baseCurrency }),
    onError: (error) => {
      console.error('Simulation preview failed:', error);
    },
  });
};

export const useStartSimulationMutation = () => {
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
    }) => startSimulation({ portfolioId, seedMoney, baseCurrency }),
    onMutate: () => {
      show('모의투자 시작 중...');
    },
    onSuccess: (_data, { portfolioId }) => {
      invalidateSimulationQueries(queryClient, portfolioId);
    },
    onError: (error) => {
      console.error('Start simulation failed:', error);
    },
    onSettled: () => {
      hide();
    },
  });
};

export const useGetSimulationTopUpPlanMutation = () => {
  return useMutation({
    mutationFn: ({
      portfolioId,
      additionalCash,
    }: {
      portfolioId: string;
      additionalCash: number;
    }) => getSimulationTopUpPlan({ portfolioId, additionalCash }),
    onError: (error) => {
      console.error('Get topup plan failed:', error);
    },
  });
};

export const useExecuteSimulationTopUpMutation = () => {
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
      additionalCash: number;
      purchases: { assetId: string; quantity: number; purchasePrice: number }[];
      addRemainingCashToBaseline?: boolean;
    }) => executeSimulationTopUp({ portfolioId, additionalCash, purchases, addRemainingCashToBaseline }),
    onMutate: () => {
      show('추가 입금 처리 중...');
    },
    onSuccess: (_data, { portfolioId }) => {
      invalidateSimulationQueries(queryClient, portfolioId);
    },
    onError: (error) => {
      console.error('Execute topup failed:', error);
    },
    onSettled: () => {
      hide();
    },
  });
};

export const useResetSimulationMutation = () => {
  const queryClient = useQueryClient();
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: ({ portfolioId }: { portfolioId: string }) => resetSimulation({ portfolioId }),
    onMutate: () => {
      show('모의투자 리셋 중...');
    },
    onSuccess: (_data, { portfolioId }) => {
      invalidateSimulationQueries(queryClient, portfolioId);
    },
    onError: (error) => {
      console.error('Reset simulation failed:', error);
    },
    onSettled: () => {
      hide();
    },
  });
};
