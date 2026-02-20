import { getHome } from '@/lib/api/home';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useQuery } from '@tanstack/react-query';

export const useGetHomeQuery = () => {
  const accessToken = useUserStore((s) => s.accessToken);

  return useQuery({
    queryKey: ['home'],
    queryFn: getHome,
    enabled: !!accessToken,
  });
};
