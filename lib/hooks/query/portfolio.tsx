import { getPortfolio, getPortfolios } from '@/lib/api/portfolio';
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
