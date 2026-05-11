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
  contributionPct: number;
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

type DbAssetTypes = {
  asset_id: string;
  ticker: string;
  name: string;
  market: string;
  image_url: string | null;
  website_domain: string | null;
};

type DbHoldingTypes = {
  asset_id: string;
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
        asset_id, target_weight_pct,
        assets ( asset_id, ticker, name, market, image_url, website_domain )
      )`
    )
    .eq('is_main', true)
    .maybeSingle();

  if (error) throw error;

  if (!portfolio) {
    return { chart: [], hasMainPortfolio: false, mainPortfolio: null, positions: [] };
  }

  const holdings = (portfolio.portfolio_holdings ?? []) as unknown as DbHoldingTypes[];

  const { data: holdingReturnsRows } = await supabase
    .from('portfolio_holding_returns')
    .select('asset_id, cumulative_return_pct, contribution_pct, base_price, latest_price')
    .eq('portfolio_id', portfolio.portfolio_id);

  const returnsByAsset = new Map<
    string,
    { cumulative_return_pct: number; contribution_pct: number; base_price: number; latest_price: number }
  >();
  for (const r of holdingReturnsRows ?? []) {
    returnsByAsset.set(r.asset_id, {
      cumulative_return_pct: Number(r.cumulative_return_pct ?? 0),
      contribution_pct: Number(r.contribution_pct ?? 0),
      base_price: Number(r.base_price ?? 0),
      latest_price: Number(r.latest_price ?? 0),
    });
  }

  // 동적 현재 비중: target_weight × (latest_price / base_price) 로 가격 변화 반영
  // base_price/latest_price는 recalc Edge에서 base_currency 기준으로 환산된 값
  const currentValues = holdings.map((h) => {
    const r = returnsByAsset.get(h.asset_id);
    const weight = Number(h.target_weight_pct);
    return r && r.base_price > 0 && r.latest_price > 0
      ? weight * (r.latest_price / r.base_price)
      : weight;
  });
  const totalValue = currentValues.reduce((s, v) => s + v, 0);

  const positions: HomePositionTypes[] = holdings.map((h, i) => {
    const returns = returnsByAsset.get(h.asset_id);
    const currentWeightPct = (currentValues[i] / totalValue) * 100;
    return {
      assetId: h.assets.asset_id,
      imageUrl: resolveImageUrl(h.assets),
      name: h.assets.name,
      returnPct: returns?.cumulative_return_pct ?? 0,
      contributionPct: returns?.contribution_pct ?? 0,
      ticker: h.assets.ticker,
      weightPct: currentWeightPct,
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
