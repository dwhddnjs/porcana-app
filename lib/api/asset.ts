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

export type MarketTypes = 'US' | 'KR';

export type AssetTypeTypes = 'STOCK' | 'ETF';

export type GetAssetLibraryRequestTypes = {
  market?: MarketTypes;
  type?: AssetTypeTypes;
  sectors?: string[];
  assetClasses?: string[];
  riskLevels?: number[];
  query?: string;
  sortBy?: 'name' | 'symbol' | 'riskLevel';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
};

export type AssetLibraryItemTypes = {
  assetId: string;
  symbol: string;
  name: string;
  market: MarketTypes;
  type: AssetTypeTypes;
  sector: string | null;
  assetClass: string | null;
  currentRiskLevel: number;
  imageUrl: string | null;
};

export type GetAssetLibraryResponseTypes = {
  assets: AssetLibraryItemTypes[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
};

export const getAssetLibrary = async (
  params: GetAssetLibraryRequestTypes
): Promise<GetAssetLibraryResponseTypes> => {
  try {
    const response = await api.get<GetAssetLibraryResponseTypes>('/assets/library', { params });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

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
