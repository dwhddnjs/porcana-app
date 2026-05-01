import { useMutation, useQueryClient } from '@tanstack/react-query';
import { finalizeArenaPortfolio } from '@/lib/api/arena';
import { useArenaStore } from '../zustand/use-arena-store';

export const useFinalizeArenaPortfolioMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      const { name, picked, selectedCards } = useArenaStore.getState();
      if (!picked) return Promise.reject(new Error('preferences not picked'));
      if (selectedCards.length !== 10)
        return Promise.reject(new Error('must pick exactly 10 cards'));

      return finalizeArenaPortfolio({
        name,
        riskProfile: picked.riskProfile,
        sectors: picked.sectors,
        pickedAssetIds: selectedCards.map((c) => c.assetId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (error) => {
      console.error('finalize arena portfolio failed:', error);
    },
  });
};
