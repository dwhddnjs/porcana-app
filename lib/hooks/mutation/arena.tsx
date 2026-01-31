import { pickArenaSessionAsset } from '@/lib/api/arena';
import { useMutation } from '@tanstack/react-query';
import { useArenaStore } from '../zustand/use-arena-store';

export const usePickArenaSessionAssetMutation = () => {
  return useMutation({
    mutationFn: ({ pickedAssetId }: { pickedAssetId: string }) => {
      const sessionId = useArenaStore.getState().sessionId;
      if (!sessionId) {
        return Promise.reject(new Error('Session not found'));
      }
      return pickArenaSessionAsset({ sessionId, pickedAssetId });
    },
  });
};
