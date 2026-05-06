import { supabase } from '@/lib/supabase/client';

export type HomeChartDataTypes = {
  date: string;
  value: number;
};

export type HomeMainPortfolioTypes = {
  name: string;
  portfolioId: string;
  startedAt: string;
  totalReturnPct: number;
};

export type HomePositionTypes = {
  assetId: string;
  imageUrl: string | string[];
  name: string;
  returnPct: number;
  ticker: string;
  weightPct: number;
  targetWeightPct: number;
};

export type HomeResponseTypes = {
  chart: HomeChartDataTypes[];
  hasMainPortfolio: boolean;
  mainPortfolio: HomeMainPortfolioTypes | null;
  positions: HomePositionTypes[];
};

type PricePointTypes = { t: string; c: number };

type DbAssetTypes = {
  asset_id: string;
  ticker: string;
  name: string;
  market: string;
  image_url: string | null;
  website_domain: string | null;
  asset_prices: { range: string; points: unknown; current_price: number | null }[];
};

type DbHoldingTypes = {
  target_weight_pct: number;
  assets: DbAssetTypes;
};

const resolveImageUrl = (asset: DbAssetTypes): string | string[] => {
  if (asset.market === 'US') return asset.image_url ?? '';
  if (asset.website_domain)
    return [
      `https://logo.clearbit.com/${asset.website_domain}`,
      `https://unavatar.io/${asset.website_domain}`,
      `https://www.google.com/s2/favicons?domain=${asset.website_domain}&sz=128`,
    ];
  return asset.image_url ?? '';
};

export const getHome = async (): Promise<HomeResponseTypes> => {
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .select(
      `portfolio_id, name, total_return_pct, started_at,
      portfolio_holdings (
        target_weight_pct,
        assets ( asset_id, ticker, name, market, image_url, website_domain,
          asset_prices ( range, points, current_price )
        )
      )`
    )
    .eq('is_main', true)
    .maybeSingle();

  if (error) throw error;

  if (!portfolio) {
    return { chart: [], hasMainPortfolio: false, mainPortfolio: null, positions: [] };
  }

  const holdings = (portfolio.portfolio_holdings ?? []) as unknown as DbHoldingTypes[];

  const positions: HomePositionTypes[] = holdings.map((h) => {
    const prices = h.assets.asset_prices ?? [];
    const price1Y = prices.find((p) => p.range === '1Y');
    const points = (price1Y?.points as PricePointTypes[]) ?? [];

    const currentPrice = points.length >= 1 ? points[points.length - 1].c : 0;
    const prevClose = points.length >= 2 ? points[points.length - 2].c : 0;

    const returnPct =
      prevClose > 0 && currentPrice > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
    return {
      assetId: h.assets.asset_id,
      imageUrl: resolveImageUrl(h.assets),
      name: h.assets.name,
      returnPct,
      ticker: h.assets.ticker,
      weightPct: Number(h.target_weight_pct),
      targetWeightPct: Number(h.target_weight_pct),
    };
  });

  const { data: historyRows } = await supabase
    .from('portfolio_value_history')
    .select('date, index_value')
    .eq('portfolio_id', portfolio.portfolio_id)
    .order('date', { ascending: true });

  const chart: HomeChartDataTypes[] = (historyRows ?? []).map((row) => ({
    date: row.date,
    value: Number(row.index_value),
  }));

  return {
    chart,
    hasMainPortfolio: true,
    mainPortfolio: {
      name: portfolio.name,
      portfolioId: portfolio.portfolio_id,
      startedAt: portfolio.started_at ?? '',
      totalReturnPct: Number(portfolio.total_return_pct ?? 0),
    },
    positions,
  };
};
