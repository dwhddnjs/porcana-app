import { api } from '.';

export type ChartPointTypes = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type AssetDetailTypes = {
  assetId: string;
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  currency: string;
  imageUrl: string | null;
  description: string | null;
};

export type AssetChartTypes = {
  assetId: string;
  range: string;
  points: ChartPointTypes[];
};

export type ChartRangeTypes = '1M' | '3M' | '1Y';

export const getAsset = async ({ assetId }: { assetId: string }): Promise<AssetDetailTypes> => {
  try {
    const response = await api.get<AssetDetailTypes>(`/assets/${assetId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAssetChart = async ({
  assetId,
  range,
}: {
  assetId: string;
  range: ChartRangeTypes;
}): Promise<AssetChartTypes> => {
  try {
    const response = await api.get<AssetChartTypes>(`/assets/${assetId}/chart`, {
      params: { range },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
