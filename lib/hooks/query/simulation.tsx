import {
  getSimulationChart,
  getSimulationHoldingBaseline,
  getSimulationHoldingReturns,
  getSimulationReturns,
} from '@/lib/api/simulation';
import { useQuery } from '@tanstack/react-query';

export const useGetSimulationBaselineQuery = (portfolioId: string | undefined) => {
  return useQuery({
    queryKey: ['simulation', 'baseline', portfolioId],
    queryFn: () => getSimulationHoldingBaseline({ portfolioId: portfolioId! }),
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetSimulationChartQuery = (
  portfolioId: string | undefined,
  range: '1M' | '3M' | '1Y' = '1Y'
) => {
  return useQuery({
    queryKey: ['simulation', 'chart', portfolioId, range],
    queryFn: () => getSimulationChart({ portfolioId: portfolioId!, range }),
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetSimulationReturnsQuery = (portfolioId: string | undefined) => {
  return useQuery({
    queryKey: ['simulation', 'returns', portfolioId],
    queryFn: () => getSimulationReturns({ portfolioId: portfolioId! }),
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetSimulationHoldingReturnsQuery = (portfolioId: string | undefined) => {
  return useQuery({
    queryKey: ['simulation', 'holding-returns', portfolioId],
    queryFn: () => getSimulationHoldingReturns({ portfolioId: portfolioId! }),
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
  });
};
