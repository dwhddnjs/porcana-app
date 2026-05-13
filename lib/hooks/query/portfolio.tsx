import { getPortfolio, getPortfolioChart, getPortfolioReturns, getPortfolios } from '@/lib/api/portfolio';
import { useQuery } from '@tanstack/react-query';

export const useGetPortfoliosQuery = () => {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: getPortfolios,
  });
};

export const useGetPortfolioQuery = (portfolioId: string | undefined) => {
  return useQuery({
    queryKey: ['portfolios', portfolioId],
    queryFn: () => getPortfolio({ portfolioId: portfolioId! }),
    enabled: !!portfolioId,
  });
};

export const useGetPortfolioChartQuery = (
  portfolioId: string | undefined,
  range: '1M' | '3M' | '1Y' = '1Y'
) => {
  return useQuery({
    queryKey: ['portfolios', 'chart', portfolioId, range],
    queryFn: () => getPortfolioChart({ portfolioId: portfolioId!, range }),
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetPortfolioReturnsQuery = (portfolioId: string | undefined) => {
  return useQuery({
    queryKey: ['portfolios', 'returns', portfolioId],
    queryFn: () => getPortfolioReturns({ portfolioId: portfolioId! }),
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
  });
};
