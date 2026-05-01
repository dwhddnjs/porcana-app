import { getHome } from '@/lib/api/home';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useQuery } from '@tanstack/react-query';

export const useGetHomeQuery = () => {
  const user = useUserStore((s) => s.user);

  return useQuery({
    queryKey: ['home'],
    queryFn: getHome,
    enabled: !!user && !user.isAnonymous,
  });
};
