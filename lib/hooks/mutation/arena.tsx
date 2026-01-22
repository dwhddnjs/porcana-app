import { pickArenaSessionAsset } from '@/lib/api/arena';
import { useMutation } from '@tanstack/react-query';

export const usePickArenaSessionAssetMutation = () => {
  return useMutation({
    mutationFn: ({ sessionId, pickedAssetId }: { sessionId: string; pickedAssetId: string }) => {
      return pickArenaSessionAsset({ sessionId, pickedAssetId });
    },
  });
};
