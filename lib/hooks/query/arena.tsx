import { useQuery } from '@tanstack/react-query';
import { useArenaStore } from '../zustand/use-arena-store';
import { recommendArenaCards } from '@/lib/api/arena';

export const useRecommendArenaCardsQuery = () => {
  const picked = useArenaStore((state) => state.picked);
  const selectedCards = useArenaStore((state) => state.selectedCards);

  const round = selectedCards.length;
  const excludeIds = selectedCards.map((c) => c.assetId);

  return useQuery({
    queryKey: ['arena-recommend', picked?.riskProfile, picked?.sectors, round],
    queryFn: () => {
      if (!picked) return Promise.reject(new Error('preferences not picked'));
      return recommendArenaCards({
        riskProfile: picked.riskProfile,
        sectors: picked.sectors,
        excludeIds,
      });
    },
    enabled: !!picked,
    staleTime: Infinity,
    gcTime: 0,
  });
};
