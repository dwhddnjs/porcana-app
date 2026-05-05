import { supabase } from '@/lib/supabase/client';
import { resolveAssetImageUrl } from '@/lib/utils/asset-image';

type DbAssetBasicTypes = {
  asset_id: string;
  ticker: string;
  name: string;
  market: string;
  image_url: string | null;
  website_domain: string | null;
};

type DbAssetDetailTypes = DbAssetBasicTypes & {
  current_risk_level: number;
  sector: string | null;
};

type DbAssetWithPricesTypes = DbAssetDetailTypes & {
  market: string;
  asset_prices: { current_price: number | null; range: string }[];
};

type DbHoldingBasicTypes = {
  target_weight_pct: number;
  assets: DbAssetBasicTypes;
};

type PricePointTypes = { t: string; c: number };

type DbHoldingDetailTypes = {
  target_weight_pct: number;
  avg_price: number | null;
  assets: DbAssetDetailTypes & {
    asset_prices: { range: string; points: unknown; current_price: number | null }[];
  };
};

type DbHoldingWithPricesTypes = {
  holding_id: string;
  asset_id: string;
  quantity: number | null;
  avg_price: number | null;
  target_weight_pct: number;
  assets: DbAssetWithPricesTypes;
};

export type PositionTypes = {
  assetId: string;
  currentRiskLevel: number;
  imageUrl: string | string[];
  name: string;
  returnPct: number;
  ticker: string;
  weightPct: number;
  targetWeightPct: number;
};

export type RiskDistributionTypes = Record<string, number>;

export type DiversityLevelTypes = 'LOW' | 'MEDIUM' | 'HIGH';

export type TopAssetTypes = {
  assetId: string;
  imageUrl: string | string[];
  symbol: string;
  name: string;
  weight: number;
};

export type PortfolioTypes = {
  portfolioId: string;
  name: string;
  status: string;
  isMain: boolean;
  totalReturnPct: number;
  createdAt?: string;
  averageRiskLevel: number;
  diversityLevel?: DiversityLevelTypes;
  positions?: PositionTypes[];
  riskDistribution?: RiskDistributionTypes;
  startedAt?: string;
  topAssets?: TopAssetTypes[];
};

export const getPortfolios = async (): Promise<PortfolioTypes[]> => {
  const { data, error } = await supabase
    .from('portfolios')
    .select(
      `portfolio_id, name, status, is_main, total_return_pct, average_risk_level, started_at, created_at,
      portfolio_holdings (
        target_weight_pct,
        assets ( asset_id, ticker, name, market, image_url, website_domain )
      )`
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const holdings = (row.portfolio_holdings ?? []) as unknown as DbHoldingBasicTypes[];
    const sorted = [...holdings].sort(
      (a, b) => Number(b.target_weight_pct) - Number(a.target_weight_pct)
    );
    const topAssets: TopAssetTypes[] = sorted.slice(0, 3).map((h) => ({
      assetId: h.assets.asset_id,
      imageUrl: resolveAssetImageUrl(h.assets.market, h.assets.ticker, h.assets.website_domain, h.assets.image_url),
      symbol: h.assets.ticker,
      name: h.assets.name,
      weight: Number(h.target_weight_pct),
    }));

    return {
      portfolioId: row.portfolio_id,
      name: row.name,
      status: row.status,
      isMain: row.is_main,
      totalReturnPct: Number(row.total_return_pct ?? 0),
      createdAt: row.created_at,
      averageRiskLevel: row.average_risk_level,
      startedAt: row.started_at ?? undefined,
      topAssets,
    };
  });
};

export const getPortfolio = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<PortfolioTypes> => {
  const { data, error } = await supabase
    .from('portfolios')
    .select(
      `portfolio_id, name, status, is_main, total_return_pct, average_risk_level, started_at, created_at,
      portfolio_holdings (
        target_weight_pct, avg_price,
        assets ( asset_id, ticker, name, market, current_risk_level, image_url, website_domain, sector,
          asset_prices ( range, points, current_price )
        )
      )`
    )
    .eq('portfolio_id', portfolioId)
    .single();

  if (error) throw error;

  const holdings = (data.portfolio_holdings ?? []) as unknown as DbHoldingDetailTypes[];

  const sectors = new Set(holdings.map((h) => h.assets.sector).filter(Boolean));
  const diversityLevel: DiversityLevelTypes =
    sectors.size >= 4 ? 'HIGH' : sectors.size >= 2 ? 'MEDIUM' : 'LOW';

  const riskDistribution: RiskDistributionTypes = {};
  holdings.forEach((h) => {
    const level = String(h.assets.current_risk_level);
    riskDistribution[level] = (riskDistribution[level] ?? 0) + Number(h.target_weight_pct);
  });

  const positions: PositionTypes[] = holdings.map((h) => {
    const prices = h.assets.asset_prices ?? [];
    const price1Y = prices.find((p) => p.range === '1Y');
    const points = (price1Y?.points as PricePointTypes[]) ?? [];
    const firstPrice = points.length ? points[0].c : 0;
    const currentPrice = Number(price1Y?.current_price ?? (points.length ? points[points.length - 1].c : 0));
    const avgPrice = h.avg_price ? Number(h.avg_price) : 0;
    const returnPct =
      avgPrice > 0 && currentPrice > 0
        ? ((currentPrice - avgPrice) / avgPrice) * 100
        : firstPrice > 0 && currentPrice > 0
          ? ((currentPrice - firstPrice) / firstPrice) * 100
          : 0;
    return {
      assetId: h.assets.asset_id,
      currentRiskLevel: h.assets.current_risk_level,
      imageUrl: resolveAssetImageUrl(h.assets.market, h.assets.ticker, h.assets.website_domain, h.assets.image_url),
      name: h.assets.name,
      returnPct,
      ticker: h.assets.ticker,
      weightPct: Number(h.target_weight_pct),
      targetWeightPct: Number(h.target_weight_pct),
    };
  });

  const sorted = [...holdings].sort(
    (a, b) => Number(b.target_weight_pct) - Number(a.target_weight_pct)
  );
  const topAssets: TopAssetTypes[] = sorted.slice(0, 3).map((h) => ({
    assetId: h.assets.asset_id,
    imageUrl: resolveAssetImageUrl(h.assets.market, h.assets.ticker, h.assets.website_domain, h.assets.image_url),
    symbol: h.assets.ticker,
    name: h.assets.name,
    weight: Number(h.target_weight_pct),
  }));

  return {
    portfolioId: data.portfolio_id,
    name: data.name,
    status: data.status,
    isMain: data.is_main,
    totalReturnPct: Number(data.total_return_pct ?? 0),
    createdAt: data.created_at,
    averageRiskLevel: data.average_risk_level,
    diversityLevel,
    positions,
    riskDistribution,
    startedAt: data.started_at ?? undefined,
    topAssets,
  };
};

export type UpdateWeightItemTypes = {
  assetId: string;
  weightPct: number;
};

export const updatePortfolioWeights = async ({
  portfolioId,
  weights,
}: {
  portfolioId: string;
  weights: UpdateWeightItemTypes[];
}): Promise<PortfolioTypes> => {
  const upserts = weights.map((w) => ({
    portfolio_id: portfolioId,
    asset_id: w.assetId,
    target_weight_pct: w.weightPct,
  }));

  const { error } = await supabase
    .from('portfolio_holdings')
    .upsert(upserts, { onConflict: 'portfolio_id,asset_id' });

  if (error) throw error;
  return getPortfolio({ portfolioId });
};

export const deletePortfolio = async ({ portfolioId }: { portfolioId: string }) => {
  const { error } = await supabase.from('portfolios').delete().eq('portfolio_id', portfolioId);
  if (error) throw error;
};

export type DirectCreatePortfolioAssetTypes = {
  assetId: string;
  weightPct?: number;
};

export type DirectCreatePortfolioRequestTypes = {
  name: string;
  assets: DirectCreatePortfolioAssetTypes[];
};

export type DirectCreatePortfolioResponseTypes = {
  portfolioId: string;
  name: string;
  status: string;
  createdAt: string;
};

export const directCreatePortfolio = async ({
  name,
  assets,
}: DirectCreatePortfolioRequestTypes): Promise<DirectCreatePortfolioResponseTypes> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('인증이 필요합니다');

  const { data: portfolio, error: portfolioError } = await supabase
    .from('portfolios')
    .insert({ name, status: 'DRAFT', user_id: user.id })
    .select('portfolio_id, name, status, created_at')
    .single();

  if (portfolioError) throw portfolioError;

  const equalWeight = Math.round((100 / assets.length) * 100) / 100;
  const holdings = assets.map((a) => ({
    portfolio_id: portfolio.portfolio_id,
    asset_id: a.assetId,
    target_weight_pct: a.weightPct ?? equalWeight,
  }));

  const { error: holdingsError } = await supabase.from('portfolio_holdings').insert(holdings);

  if (holdingsError) {
    await supabase.from('portfolios').delete().eq('portfolio_id', portfolio.portfolio_id);
    throw holdingsError;
  }

  const { data: riskData, error: riskError } = await supabase
    .from('assets')
    .select('asset_id, current_risk_level')
    .in(
      'asset_id',
      assets.map((a) => a.assetId)
    );

  if (!riskError && riskData) {
    const riskMap = Object.fromEntries(riskData.map((r) => [r.asset_id, r.current_risk_level]));
    const totalWeight = holdings.reduce((sum, h) => sum + h.target_weight_pct, 0);
    const avgRisk =
      totalWeight > 0
        ? Math.round(
            holdings.reduce(
              (sum, h) => sum + h.target_weight_pct * (riskMap[h.asset_id] ?? 0),
              0
            ) / totalWeight
          )
        : 0;

    await supabase
      .from('portfolios')
      .update({ average_risk_level: avgRisk })
      .eq('portfolio_id', portfolio.portfolio_id);
  }

  return {
    portfolioId: portfolio.portfolio_id,
    name: portfolio.name,
    status: portfolio.status,
    createdAt: portfolio.created_at,
  };
};

export type BaselineItemTypes = {
  assetId: string;
  symbol: string;
  name: string;
  market: string;
  quantity: number;
  avgPrice: number;
  targetWeightPct: number;
  currentPrice: number;
  currentValue: number;
  imageUrl?: string | string[] | null;
};

export type BaselineResponseTypes = {
  exists: boolean;
  baselineId: string;
  portfolioId: string;
  sourceType: string;
  baseCurrency: string;
  seedMoney: number;
  totalValue: number;
  cashAmount: number;
  confirmedAt: string;
  items: BaselineItemTypes[];
};

export type SetSeedRequestTypes = {
  seedMoney: number;
  baseCurrency?: string;
};

export const setSeed = async ({
  portfolioId,
  seedMoney,
  baseCurrency,
}: {
  portfolioId: string;
} & SetSeedRequestTypes): Promise<BaselineResponseTypes> => {
  const { error } = await supabase
    .from('portfolios')
    .update({ seed_money: seedMoney, base_currency: baseCurrency ?? 'KRW' })
    .eq('portfolio_id', portfolioId);

  if (error) throw error;

  return getHoldingBaseline({ portfolioId });
};

export const getSeedPreview = async ({
  portfolioId,
  seedMoney,
  baseCurrency,
}: {
  portfolioId: string;
} & SetSeedRequestTypes): Promise<BaselineResponseTypes> => {
  const { data, error } = await supabase
    .from('portfolios')
    .select(
      `portfolio_id, base_currency,
      portfolio_holdings (
        holding_id, asset_id, target_weight_pct,
        assets ( ticker, name, market, current_risk_level, image_url, website_domain,
          asset_prices ( current_price, range )
        )
      )`
    )
    .eq('portfolio_id', portfolioId)
    .single();

  if (error) throw error;

  const currency = baseCurrency ?? data.base_currency ?? 'KRW';
  const holdings = (data.portfolio_holdings ?? []) as unknown as (DbHoldingWithPricesTypes & {
    holding_id: string;
    asset_id: string;
  })[];

  const items: BaselineItemTypes[] = holdings.map((h) => {
    const prices = h.assets.asset_prices ?? [];
    const price = prices.find((p) => p.range === '1M')?.current_price ?? 0;
    const quantity = price > 0 ? Math.floor((seedMoney * (Number(h.target_weight_pct) / 100)) / price) : 0;
    const currentValue = quantity * price;
    return {
      assetId: h.asset_id,
      symbol: h.assets.ticker,
      name: h.assets.name,
      market: h.assets.market,
      quantity,
      avgPrice: price,
      targetWeightPct: Number(h.target_weight_pct),
      currentPrice: price,
      currentValue,
      imageUrl: resolveAssetImageUrl(h.assets.market, h.assets.ticker, h.assets.website_domain, h.assets.image_url),
    };
  });

  const totalValue = items.reduce((sum, i) => sum + i.currentValue, 0);
  const cashAmount = seedMoney - totalValue;

  return {
    exists: false,
    baselineId: '',
    portfolioId,
    sourceType: 'MANUAL',
    baseCurrency: currency,
    seedMoney,
    totalValue,
    cashAmount,
    confirmedAt: '',
    items,
  };
};

export const getHoldingBaseline = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<BaselineResponseTypes> => {
  const { data, error } = await supabase
    .from('portfolios')
    .select(
      `portfolio_id, seed_money, base_currency,
      portfolio_holdings (
        holding_id, asset_id, quantity, avg_price, target_weight_pct,
        assets ( ticker, name, market, current_risk_level, image_url, website_domain,
          asset_prices ( current_price, range )
        )
      )`
    )
    .eq('portfolio_id', portfolioId)
    .single();

  if (error) throw error;

  if (!data.seed_money) {
    return {
      exists: false,
      baselineId: '',
      portfolioId,
      sourceType: '',
      baseCurrency: data.base_currency ?? 'KRW',
      seedMoney: 0,
      totalValue: 0,
      cashAmount: 0,
      confirmedAt: '',
      items: [],
    };
  }

  const holdings = (data.portfolio_holdings ?? []) as unknown as DbHoldingWithPricesTypes[];
  const items: BaselineItemTypes[] = holdings.map((h) => {
    const prices = h.assets.asset_prices ?? [];
    const currentPrice = prices.find((p) => p.range === '1M')?.current_price ?? 0;
    const qty = Number(h.quantity ?? 0);
    const avgPrice = Number(h.avg_price ?? 0);
    return {
      assetId: h.asset_id,
      symbol: h.assets.ticker,
      name: h.assets.name,
      market: h.assets.market,
      quantity: qty,
      avgPrice,
      targetWeightPct: Number(h.target_weight_pct),
      currentPrice,
      currentValue: qty * currentPrice,
      imageUrl: resolveAssetImageUrl(h.assets.market, h.assets.ticker, h.assets.website_domain, h.assets.image_url),
    };
  });

  const totalValue = items.reduce((sum, i) => sum + i.currentValue, 0);
  const cashAmount = Number(data.seed_money) - totalValue;

  return {
    exists: true,
    baselineId: portfolioId,
    portfolioId,
    sourceType: 'MANUAL',
    baseCurrency: data.base_currency ?? 'KRW',
    seedMoney: Number(data.seed_money),
    totalValue,
    cashAmount,
    confirmedAt: '',
    items,
  };
};

export type RebalanceStatusItemTypes = {
  assetId: string;
  symbol: string;
  name: string;
  targetWeightPct: number;
  currentWeightPct: number;
  deviationPct: number;
  overThreshold: boolean;
};

export type RebalanceStatusSummaryTypes = {
  totalAssets: number;
  overThresholdCount: number;
};

export type RebalanceStatusResponseTypes = {
  portfolioId: string;
  hasBaseline: boolean;
  needsRebalancing: boolean;
  checkedAt: string;
  thresholdPct: number;
  baseCurrency: string;
  summary: RebalanceStatusSummaryTypes;
  items: RebalanceStatusItemTypes[];
};

export const getRebalanceStatus = async ({
  portfolioId,
  thresholdPct = 5,
}: {
  portfolioId: string;
  thresholdPct?: number;
}): Promise<RebalanceStatusResponseTypes> => {
  const baseline = await getHoldingBaseline({ portfolioId });

  if (!baseline.exists || baseline.totalValue === 0) {
    return {
      portfolioId,
      hasBaseline: false,
      needsRebalancing: false,
      checkedAt: new Date().toISOString(),
      thresholdPct,
      baseCurrency: baseline.baseCurrency,
      summary: { totalAssets: 0, overThresholdCount: 0 },
      items: [],
    };
  }

  const items: RebalanceStatusItemTypes[] = baseline.items.map((item) => {
    const currentWeightPct =
      baseline.totalValue > 0 ? (item.currentValue / baseline.totalValue) * 100 : 0;
    const deviationPct = Math.abs(currentWeightPct - item.targetWeightPct);
    return {
      assetId: item.assetId,
      symbol: item.symbol,
      name: item.name,
      targetWeightPct: item.targetWeightPct,
      currentWeightPct,
      deviationPct,
      overThreshold: deviationPct > thresholdPct,
    };
  });

  const overThresholdCount = items.filter((i) => i.overThreshold).length;

  return {
    portfolioId,
    hasBaseline: true,
    needsRebalancing: overThresholdCount > 0,
    checkedAt: new Date().toISOString(),
    thresholdPct,
    baseCurrency: baseline.baseCurrency,
    summary: { totalAssets: items.length, overThresholdCount },
    items,
  };
};

export type RebalancingPlanActionTypes = {
  assetId: string;
  symbol: string;
  name: string;
  action: string;
  quantity: number;
  price: number;
  amount: number;
  fromWeightPct: number;
  toWeightPct: number;
};

export type RebalancingPlanSummaryTypes = {
  totalBuyAmount: number;
  totalSellAmount: number;
  netAmount: number;
};

export type RebalancingPlanResponseTypes = {
  portfolioId: string;
  baselineId: string;
  needsRebalancing: boolean;
  thresholdPct: number;
  baseCurrency: string;
  summary: RebalancingPlanSummaryTypes;
  actions: RebalancingPlanActionTypes[];
};

export const getRebalancingPlan = async ({
  portfolioId,
  thresholdPct = 5,
}: {
  portfolioId: string;
  thresholdPct?: number;
}): Promise<RebalancingPlanResponseTypes> => {
  const baseline = await getHoldingBaseline({ portfolioId });

  const actions: RebalancingPlanActionTypes[] = [];

  if (baseline.exists && baseline.totalValue > 0) {
    baseline.items.forEach((item) => {
      const currentWeightPct = (item.currentValue / baseline.totalValue) * 100;
      const targetValue = baseline.totalValue * (item.targetWeightPct / 100);
      const diff = targetValue - item.currentValue;

      if (Math.abs(currentWeightPct - item.targetWeightPct) > thresholdPct && item.currentPrice > 0) {
        const quantity = Math.abs(Math.floor(diff / item.currentPrice));
        if (quantity > 0) {
          actions.push({
            assetId: item.assetId,
            symbol: item.symbol,
            name: item.name,
            action: diff > 0 ? 'BUY' : 'SELL',
            quantity,
            price: item.currentPrice,
            amount: quantity * item.currentPrice,
            fromWeightPct: currentWeightPct,
            toWeightPct: item.targetWeightPct,
          });
        }
      }
    });
  }

  const totalBuyAmount = actions
    .filter((a) => a.action === 'BUY')
    .reduce((sum, a) => sum + a.amount, 0);
  const totalSellAmount = actions
    .filter((a) => a.action === 'SELL')
    .reduce((sum, a) => sum + a.amount, 0);

  return {
    portfolioId,
    baselineId: portfolioId,
    needsRebalancing: actions.length > 0,
    thresholdPct,
    baseCurrency: baseline.baseCurrency,
    summary: { totalBuyAmount, totalSellAmount, netAmount: totalBuyAmount - totalSellAmount },
    actions,
  };
};

export const setMainPortfolio = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<{ mainPortfolioId: string }> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw authError ?? new Error('Not authenticated');

  const { error: resetError } = await supabase
    .from('portfolios')
    .update({ is_main: false })
    .eq('user_id', user.id);
  if (resetError) throw resetError;

  const { error: setError } = await supabase
    .from('portfolios')
    .update({ is_main: true })
    .eq('portfolio_id', portfolioId);
  if (setError) throw setError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ main_portfolio_id: portfolioId })
    .eq('user_id', user.id);
  if (profileError) throw profileError;

  // user_metadata에도 동기화 → 앱 재시작 시 index.tsx 라우팅 조건에 사용됨
  const { error: metaError } = await supabase.auth.updateUser({
    data: { main_portfolio_id: portfolioId },
  });
  if (metaError) throw metaError;

  return { mainPortfolioId: portfolioId };
};

export type TopUpPlanRequestTypes = {
  additionalCash: number;
};

export type TopUpRecommendationTypes = {
  assetId: string;
  symbol: string;
  name: string;
  market: string;
  targetWeightPct: number;
  currentWeightPct: number;
  weightAfterBuy: number;
  currentPrice: number;
  recommendedQuantity: number;
  recommendedAmount: number;
  reason: string;
};

export type TopUpPlanResponseTypes = {
  portfolioId: string;
  additionalCash: number;
  baseCurrency: string;
  currentTotalValue: number;
  newTotalValue: number;
  remainingCash: number;
  recommendations: TopUpRecommendationTypes[];
};

export type TopUpPurchaseItemTypes = {
  assetId: string;
  quantity: number;
  purchasePrice: number;
};

export type TopUpExecuteRequestTypes = {
  additionalCash: number;
  purchases: TopUpPurchaseItemTypes[];
  addRemainingCashToBaseline?: boolean;
};

export type TopUpSummaryTypes = {
  additionalCash: number;
  totalPurchaseAmount: number;
  remainingCash: number;
  previousTotalValue: number;
  newTotalValue: number;
  newCashAmount: number;
};

export type TopUpUpdatedItemTypes = {
  assetId: string;
  symbol: string;
  name: string;
  previousQuantity: number;
  addedQuantity: number;
  newQuantity: number;
  previousAvgPrice: number;
  newAvgPrice: number;
};

export type TopUpExecuteResponseTypes = {
  portfolioId: string;
  baselineId: string;
  baseCurrency: string;
  summary: TopUpSummaryTypes;
  updatedItems: TopUpUpdatedItemTypes[];
};

export const getTopUpPlan = async ({
  portfolioId,
  additionalCash,
}: {
  portfolioId: string;
} & TopUpPlanRequestTypes): Promise<TopUpPlanResponseTypes> => {
  const baseline = await getHoldingBaseline({ portfolioId });
  const newTotal = baseline.totalValue + additionalCash;

  const recommendations: TopUpRecommendationTypes[] = baseline.items
    .map((item) => {
      const currentWeightPct =
        baseline.totalValue > 0 ? (item.currentValue / baseline.totalValue) * 100 : 0;
      const targetValue = newTotal * (item.targetWeightPct / 100);
      const diff = targetValue - item.currentValue;

      if (diff <= 0 || item.currentPrice === 0) return null;

      const recommendedQuantity = Math.floor(diff / item.currentPrice);
      if (recommendedQuantity === 0) return null;

      const recommendedAmount = recommendedQuantity * item.currentPrice;
      const weightAfterBuy =
        ((item.currentValue + recommendedAmount) / (baseline.totalValue + recommendedAmount)) * 100;

      return {
        assetId: item.assetId,
        symbol: item.symbol,
        name: item.name,
        market: item.market,
        targetWeightPct: item.targetWeightPct,
        currentWeightPct,
        weightAfterBuy,
        currentPrice: item.currentPrice,
        recommendedQuantity,
        recommendedAmount,
        reason: '목표 비중 달성',
      } satisfies TopUpRecommendationTypes;
    })
    .filter((r): r is TopUpRecommendationTypes => r !== null);

  const totalRecommended = recommendations.reduce((sum, r) => sum + r.recommendedAmount, 0);

  return {
    portfolioId,
    additionalCash,
    baseCurrency: baseline.baseCurrency,
    currentTotalValue: baseline.totalValue,
    newTotalValue: newTotal,
    remainingCash: additionalCash - totalRecommended,
    recommendations,
  };
};

export type PortfolioChartPointTypes = {
  date: string;
  value: number;
};

export type PortfolioReturnsTypes = {
  totalReturnPct: number;
  return1D: number | null;
  return1W: number | null;
  return1M: number | null;
  return1Y: number | null;
};

export const getPortfolioChart = async ({
  portfolioId,
  range = '1Y',
}: {
  portfolioId: string;
  range?: '1M' | '3M' | '1Y';
}): Promise<PortfolioChartPointTypes[]> => {
  const limitDays: Record<string, number> = { '1M': 30, '3M': 90 };
  let query = supabase
    .from('portfolio_value_history')
    .select('date, index_value')
    .eq('portfolio_id', portfolioId)
    .order('date', { ascending: true });

  if (range !== '1Y') {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - limitDays[range]);
    query = query.gte('date', fromDate.toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    date: row.date,
    value: Number(row.index_value),
  }));
};

export const getPortfolioReturns = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<PortfolioReturnsTypes> => {
  const { data, error } = await supabase
    .from('portfolio_value_history')
    .select('date, index_value, return_pct')
    .eq('portfolio_id', portfolioId)
    .order('date', { ascending: false })
    .limit(366);

  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) {
    return { totalReturnPct: 0, return1D: null, return1W: null, return1M: null, return1Y: null };
  }

  const latest = rows[0];
  const latestIndex = Number(latest.index_value);

  const calcReturn = (daysAgo: number): number | null => {
    const target = rows[daysAgo];
    if (!target) return null;
    const prevIndex = Number(target.index_value);
    return prevIndex > 0 ? (latestIndex / prevIndex) * 100 - 100 : null;
  };

  return {
    totalReturnPct: Number(latest.return_pct),
    return1D: calcReturn(1),
    return1W: calcReturn(7),
    return1M: calcReturn(30),
    return1Y: calcReturn(365),
  };
};

export const executeTopUp = async ({
  portfolioId,
  additionalCash,
  purchases,
  addRemainingCashToBaseline,
}: {
  portfolioId: string;
} & TopUpExecuteRequestTypes): Promise<TopUpExecuteResponseTypes> => {
  const baseline = await getHoldingBaseline({ portfolioId });

  const updatedItems: TopUpUpdatedItemTypes[] = [];
  let totalPurchaseAmount = 0;

  for (const purchase of purchases) {
    const existing = baseline.items.find((i) => i.assetId === purchase.assetId);
    const prevQty = existing?.quantity ?? 0;
    const prevAvg = existing?.avgPrice ?? 0;
    const addedQty = purchase.quantity;
    const newQty = prevQty + addedQty;
    const purchaseAmount = addedQty * purchase.purchasePrice;
    const newAvg = newQty > 0 ? (prevQty * prevAvg + purchaseAmount) / newQty : purchase.purchasePrice;

    totalPurchaseAmount += purchaseAmount;

    const { error } = await supabase
      .from('portfolio_holdings')
      .upsert(
        {
          portfolio_id: portfolioId,
          asset_id: purchase.assetId,
          quantity: newQty,
          avg_price: newAvg,
        },
        { onConflict: 'portfolio_id,asset_id' }
      );

    if (error) throw error;

    updatedItems.push({
      assetId: purchase.assetId,
      symbol: existing?.symbol ?? '',
      name: existing?.name ?? '',
      previousQuantity: prevQty,
      addedQuantity: addedQty,
      newQuantity: newQty,
      previousAvgPrice: prevAvg,
      newAvgPrice: newAvg,
    });
  }

  const newCashAmount = baseline.cashAmount + (additionalCash - totalPurchaseAmount);
  const newTotalValue = baseline.totalValue + totalPurchaseAmount;

  if (addRemainingCashToBaseline) {
    const remaining = additionalCash - totalPurchaseAmount;
    if (remaining > 0) {
      await supabase
        .from('portfolios')
        .update({ seed_money: baseline.seedMoney + remaining })
        .eq('portfolio_id', portfolioId);
    }
  }

  return {
    portfolioId,
    baselineId: portfolioId,
    baseCurrency: baseline.baseCurrency,
    summary: {
      additionalCash,
      totalPurchaseAmount,
      remainingCash: additionalCash - totalPurchaseAmount,
      previousTotalValue: baseline.totalValue,
      newTotalValue,
      newCashAmount,
    },
    updatedItems,
  };
};
