import { useQuery } from '@tanstack/react-query';
import { useArenaStore } from '../zustand/use-arena-store';
import { getArenaSessionRounds } from '@/lib/api/arena';

export const useGetArenaSessionRoundsQuery = () => {
  const sessionId = useArenaStore((state) => state.sessionId);
  return useQuery({
    queryKey: ['arena-session-rounds', sessionId],
    queryFn: () => {
      const currentSessionId = useArenaStore.getState().sessionId;
      if (!currentSessionId) {
        return Promise.reject(new Error('Session not found'));
      }
      return getArenaSessionRounds({ sessionId: currentSessionId });
    },
    enabled: !!sessionId,
  });
};
