import { api } from '.';

export type ChartPoint = {
  date: string;
  value: number;
};

export type AssetDetail = {
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

export type AssetChart = {
  assetId: string;
  range: string;
  points: ChartPoint[];
};

export type ChartRange = '1M' | '3M' | '1Y';

export const getAsset = async ({ assetId }: { assetId: string }): Promise<AssetDetail> => {
  try {
    const response = await api.get<AssetDetail>(`/assets/${assetId}`);
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
  range: ChartRange;
}): Promise<AssetChart> => {
  try {
    const response = await api.get<AssetChart>(`/assets/${assetId}/chart`, {
      params: { range },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
