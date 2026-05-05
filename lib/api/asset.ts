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
  imageUrl: string | string[] | null;
  impactHint: string | null;
};

export type GetAssetLibraryResponseTypes = {
  assets: AssetLibraryItemTypes[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
};

type DbAssetLibraryRowTypes = {
  asset_id: string;
  ticker: string;
  name: string;
  market: string;
  type: string;
  sector: string | null;
  asset_class: string | null;
  current_risk_level: number;
  image_url: string | null;
  website_domain: string | null;
  impact_hint: string | null;
};

export const getAssetLibrary = async (
  params: GetAssetLibraryRequestTypes
): Promise<GetAssetLibraryResponseTypes> => {
  const page = params.page ?? 0;
  const size = params.size ?? 20;
  const from = page * size;
  const to = from + size - 1;

  let query = supabase
    .from('assets')
    .select(
      'asset_id, ticker, name, market, type, sector, asset_class, current_risk_level, image_url, website_domain, impact_hint',
      { count: 'exact' }
    );

  if (params.market) query = query.eq('market', params.market);
  if (params.type) query = query.eq('type', params.type);
  if (params.sectors?.length) query = query.in('sector', params.sectors);
  if (params.assetClasses?.length) query = query.in('asset_class', params.assetClasses);
  if (params.riskLevels?.length) query = query.in('current_risk_level', params.riskLevels);

  if (params.query) {
    const q = params.query.replace(/[%,]/g, '');
    if (q) query = query.or(`name.ilike.%${q}%,ticker.ilike.%${q}%`);
  }

  const sortColumn =
    params.sortBy === 'symbol'
      ? 'ticker'
      : params.sortBy === 'riskLevel'
        ? 'current_risk_level'
        : 'name';
  const ascending = params.sortDirection !== 'desc';
  query = query.order(sortColumn, { ascending });

  const { data, error, count } = await query.range(from, to).returns<DbAssetLibraryRowTypes[]>();

  if (error) throw error;

  const rows = data ?? [];
  const totalCount = count ?? 0;
  const totalPages = size > 0 ? Math.ceil(totalCount / size) : 0;

  const assets: AssetLibraryItemTypes[] = rows.map((row) => ({
    assetId: row.asset_id,
    symbol: row.ticker,
    name: row.name,
    market: row.market as MarketTypes,
    type: row.type as AssetTypeTypes,
    sector: row.sector,
    assetClass: row.asset_class,
    currentRiskLevel: row.current_risk_level,
    imageUrl: resolveAssetImageUrl(row.market, row.ticker, row.website_domain, row.image_url),
    impactHint: row.impact_hint,
  }));

  return {
    assets,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize: size,
    hasNext: from + assets.length < totalCount,
  };
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
