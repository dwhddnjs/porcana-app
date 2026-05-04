import { api } from '.';
import { supabase } from '@/lib/supabase/client';
import { resolveAssetImageUrl } from '@/lib/utils/asset-image';

export type ChartPointTypes = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type AssetPersonalityTypes = {
  role: string;
  roleDisplayName: string;
  roleDescription: string;
  riskLevel: number;
  exposureType: string;
  exposureTypeDisplayName: string;
  persona: string;
  personaDisplayName: string;
  dividendProfile: string;
  dividendProfileDisplayName: string;
};

export type MarketTypes = 'US' | 'KR';

export type AssetTypeTypes = 'STOCK' | 'ETF';

export type AssetDetailTypes = {
  assetId: string;
  ticker: string;
  name: string;
  market: MarketTypes;
  sector: string | null;
  currency: string | null;
  imageUrl: string | string[];
  description: string | null;
  personality: AssetPersonalityTypes | null;
};

export type AssetChartTypes = {
  assetId: string;
  range: string;
  points: ChartPointTypes[];
};

export type ChartRangeTypes = '1M' | '3M' | '1Y';

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

type DbAssetDetailRowTypes = {
  asset_id: string;
  ticker: string;
  name: string;
  market: string;
  sector: string | null;
  image_url: string | null;
  description: string | null;
  website_domain: string | null;
  personality: AssetPersonalityTypes | null;
  asset_prices: { currency: string | null }[] | null;
};

export const getAsset = async ({ assetId }: { assetId: string }): Promise<AssetDetailTypes> => {
  const { data, error } = await supabase
    .from('assets')
    .select(
      `asset_id, ticker, name, market, sector, image_url, description,
       website_domain, personality,
       asset_prices ( currency )`
    )
    .eq('asset_id', assetId)
    .single<DbAssetDetailRowTypes>();

  if (error) throw error;

  const currency = data.asset_prices?.find((p) => p.currency)?.currency ?? null;

  return {
    assetId: data.asset_id,
    ticker: data.ticker,
    name: data.name,
    market: data.market as MarketTypes,
    sector: data.sector,
    currency,
    imageUrl: resolveAssetImageUrl(data.market, data.ticker, data.website_domain, data.image_url),
    description: data.description,
    personality: data.personality,
  };
};

type DbPricePointTypes = { t: string; o: number; h: number; l: number; c: number; v: number };

type DbAssetPricesRowTypes = {
  points: DbPricePointTypes[] | null;
};

export const getAssetChart = async ({
  assetId,
  range,
}: {
  assetId: string;
  range: ChartRangeTypes;
}): Promise<AssetChartTypes> => {
  const { data, error } = await supabase
    .from('asset_prices')
    .select('points')
    .eq('asset_id', assetId)
    .eq('range', range)
    .maybeSingle<DbAssetPricesRowTypes>();

  if (error) throw error;

  const rawPoints = data?.points ?? [];
  const points: ChartPointTypes[] = rawPoints.map((p) => ({
    date: p.t,
    open: p.o,
    high: p.h,
    low: p.l,
    close: p.c,
    volume: p.v,
  }));

  return { assetId, range, points };
};
