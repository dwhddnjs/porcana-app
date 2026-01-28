import { getPortfolios } from '@/lib/api/portfolio';
import { useQuery } from '@tanstack/react-query';

export const useGetPortfoliosQuery = () => {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: getPortfolios,
  });
};
