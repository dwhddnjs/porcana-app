import { getHome } from '@/lib/api/home';
import { useQuery } from '@tanstack/react-query';

export const useGetHomeQuery = () => {
  return useQuery({
    queryKey: ['home'],
    queryFn: getHome,
  });
};
