import { useQuery } from '@tanstack/react-query';
import { useArenaStore } from '../zustand/use-arena-store';
import { recommendArenaCards } from '@/lib/api/arena';

export const useRecommendArenaCardsQuery = () => {
  const picked = useArenaStore((state) => state.picked);
  const selectedCards = useArenaStore((state) => state.selectedCards);
  const shownAssetIds = useArenaStore((state) => state.shownAssetIds);

  const round = selectedCards.length;

  return useQuery({
    queryKey: ['arena-recommend', picked?.riskProfile, picked?.sectors, round],
    queryFn: () => {
      if (!picked) return Promise.reject(new Error('preferences not picked'));
      return recommendArenaCards({
        riskProfile: picked.riskProfile,
        sectors: picked.sectors,
        excludeIds: shownAssetIds,
      });
    },
    enabled: !!picked,
    staleTime: Infinity,
    gcTime: 60_000, // prefetch 데이터가 살아있도록 충분한 시간 유지
  });
};
