import { ChartRangeTypes, getAsset, getAssetChart } from '@/lib/api/asset';
import { useQuery } from '@tanstack/react-query';

export const useGetAssetQuery = (assetId: string | undefined) => {
  return useQuery({
    queryKey: ['assets', assetId],
    queryFn: () => getAsset({ assetId: assetId! }),
    enabled: !!assetId,
  });
};

export const useGetAssetChartQuery = (assetId: string | undefined, range: ChartRangeTypes) => {
  return useQuery({
    queryKey: ['assets', assetId, 'chart', range],
    queryFn: () => getAssetChart({ assetId: assetId!, range }),
    enabled: !!assetId,
  });
};
