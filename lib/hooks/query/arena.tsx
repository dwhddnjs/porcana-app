import { useQuery } from '@tanstack/react-query';
import { useArenaStore } from '../zustand/use-arena-store';
import { getArenaSessionRounds } from '@/lib/api/arena';

export const useGetArenaSessionRoundsQuery = () => {
  const { sessionId } = useArenaStore();
  return useQuery({
    queryKey: ['arena-session-rounds'],
    queryFn: () => getArenaSessionRounds({ sessionId }),
  });
};
