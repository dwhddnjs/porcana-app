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

type DbHoldingBasicTypes = {
  target_weight_pct: number;
  assets: DbAssetBasicTypes;
};

type DbHoldingDetailTypes = {
  asset_id: string;
  target_weight_pct: number;
  assets: DbAssetDetailTypes;
};

export type PositionTypes = {
  assetId: string;
  currentRiskLevel: number;
  imageUrl: string | string[];
  name: string;
  returnPct: number;
  contributionPct: number;
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
        asset_id, target_weight_pct,
        assets ( asset_id, ticker, name, market, current_risk_level, image_url, website_domain, sector )
      )`
    )
    .eq('portfolio_id', portfolioId)
    .single();

  if (error) throw error;

  const holdings = (data.portfolio_holdings ?? []) as unknown as DbHoldingDetailTypes[];

  const { data: holdingReturnsRows } = await supabase
    .from('portfolio_holding_returns')
    .select('asset_id, cumulative_return_pct, contribution_pct, base_price, latest_price')
    .eq('portfolio_id', portfolioId);

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

  const sectors = new Set(holdings.map((h) => h.assets.sector).filter(Boolean));
  const diversityLevel: DiversityLevelTypes =
    sectors.size >= 4 ? 'HIGH' : sectors.size >= 2 ? 'MEDIUM' : 'LOW';

  const riskDistribution: RiskDistributionTypes = {};
  holdings.forEach((h) => {
    const level = String(h.assets.current_risk_level);
    riskDistribution[level] = (riskDistribution[level] ?? 0) + Number(h.target_weight_pct);
  });

  // 동적 현재 비중: target_weight × (latest_price / base_price) 로 가격 변화 반영
  const currentValues = holdings.map((h) => {
    const r = returnsByAsset.get(h.asset_id);
    const weight = Number(h.target_weight_pct);
    return r && r.base_price > 0 && r.latest_price > 0
      ? weight * (r.latest_price / r.base_price)
      : weight;
  });
  const totalValue = currentValues.reduce((s, v) => s + v, 0);

  const positions: PositionTypes[] = holdings.map((h, i) => {
    const returns = returnsByAsset.get(h.asset_id);
    const currentWeightPct = (currentValues[i] / totalValue) * 100;
    return {
      assetId: h.assets.asset_id,
      currentRiskLevel: h.assets.current_risk_level,
      imageUrl: resolveAssetImageUrl(h.assets.market, h.assets.ticker, h.assets.website_domain, h.assets.image_url),
      name: h.assets.name,
      returnPct: returns?.cumulative_return_pct ?? 0,
      contributionPct: returns?.contribution_pct ?? 0,
      ticker: h.assets.ticker,
      weightPct: currentWeightPct,
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
  const { data, error } = await supabase.functions.invoke('portfolio-set-seed', {
    body: { portfolioId, seedMoney, baseCurrency: baseCurrency ?? 'KRW' },
  });
  if (error) throw error;
  return data as BaselineResponseTypes;
};

export const getSeedPreview = async ({
  portfolioId,
  seedMoney,
  baseCurrency,
}: {
  portfolioId: string;
} & SetSeedRequestTypes): Promise<BaselineResponseTypes> => {
  const { data, error } = await supabase.functions.invoke('portfolio-seed-preview', {
    body: { portfolioId, seedMoney, baseCurrency: baseCurrency ?? 'KRW' },
  });
  if (error) throw error;
  return data as BaselineResponseTypes;
};

export const getHoldingBaseline = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<BaselineResponseTypes> => {
  const { data, error } = await supabase.functions.invoke('portfolio-holding-baseline', {
    body: { portfolioId },
  });
  if (error) throw error;
  return data as BaselineResponseTypes;
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
  const { data, error } = await supabase.functions.invoke('portfolio-rebalance-status', {
    body: { portfolioId, thresholdPct },
  });
  if (error) throw error;
  return data as RebalanceStatusResponseTypes;
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
  imageUrl?: string | string[] | null;
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
  const { data, error } = await supabase.functions.invoke('portfolio-topup-plan', {
    body: { portfolioId, additionalCash },
  });
  if (error) throw error;
  return data as TopUpPlanResponseTypes;
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
  const { data, error } = await supabase.functions.invoke('portfolio-execute-topup', {
    body: { portfolioId, additionalCash, purchases, addRemainingCashToBaseline },
  });
  if (error) throw error;
  return data as TopUpExecuteResponseTypes;
};

export const triggerRecalc = async ({ portfolioId }: { portfolioId: string }): Promise<void> => {
  await supabase.functions.invoke('recalc-portfolio-returns', {
    body: { portfolioId },
  });
};
