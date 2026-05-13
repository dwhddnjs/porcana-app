import { supabase } from '@/lib/supabase/client';

export type SimulationBaselineItemTypes = {
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

export type SimulationBaselineResponseTypes = {
  exists: boolean;
  simulationId: string;
  portfolioId: string;
  sourceType: string;
  baseCurrency: string;
  seedMoney: number;
  totalValue: number;
  cashAmount: number;
  confirmedAt: string;
  items: SimulationBaselineItemTypes[];
};

export type SimulationSeedRequestTypes = {
  seedMoney: number;
  baseCurrency?: string;
};

export const getSimulationPreview = async ({
  portfolioId,
  seedMoney,
  baseCurrency,
}: {
  portfolioId: string;
} & SimulationSeedRequestTypes): Promise<SimulationBaselineResponseTypes> => {
  const { data, error } = await supabase.functions.invoke('simulation-preview', {
    body: { portfolioId, seedMoney, baseCurrency: baseCurrency ?? 'KRW' },
  });
  if (error) throw error;
  return data as SimulationBaselineResponseTypes;
};

export const startSimulation = async ({
  portfolioId,
  seedMoney,
  baseCurrency,
}: {
  portfolioId: string;
} & SimulationSeedRequestTypes): Promise<SimulationBaselineResponseTypes> => {
  const { data, error } = await supabase.functions.invoke('simulation-start', {
    body: { portfolioId, seedMoney, baseCurrency: baseCurrency ?? 'KRW' },
  });
  if (error) throw error;
  return data as SimulationBaselineResponseTypes;
};

export const getSimulationHoldingBaseline = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<SimulationBaselineResponseTypes> => {
  const { data, error } = await supabase.functions.invoke('simulation-holding-baseline', {
    body: { portfolioId },
  });
  if (error) throw error;
  return data as SimulationBaselineResponseTypes;
};

export const resetSimulation = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<{ ok: boolean; deleted: boolean }> => {
  const { data, error } = await supabase.functions.invoke('simulation-reset', {
    body: { portfolioId },
  });
  if (error) throw error;
  return data as { ok: boolean; deleted: boolean };
};

export type SimulationChartPointTypes = {
  date: string;
  value: number;
};

export type SimulationReturnsTypes = {
  totalReturnPct: number;
  return1D: number | null;
  return1W: number | null;
  return1M: number | null;
  return1Y: number | null;
};

const getSimulationIdByPortfolio = async (portfolioId: string): Promise<string | null> => {
  const { data } = await supabase
    .from('simulations')
    .select('simulation_id')
    .eq('portfolio_id', portfolioId)
    .maybeSingle();
  return data?.simulation_id ?? null;
};

export const getSimulationChart = async ({
  portfolioId,
  range = '1Y',
}: {
  portfolioId: string;
  range?: '1M' | '3M' | '1Y';
}): Promise<SimulationChartPointTypes[]> => {
  const simulationId = await getSimulationIdByPortfolio(portfolioId);
  if (!simulationId) return [];

  const limitDays: Record<string, number> = { '1M': 30, '3M': 90 };
  let query = supabase
    .from('simulation_value_history')
    .select('date, index_value')
    .eq('simulation_id', simulationId)
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

export const getSimulationReturns = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<SimulationReturnsTypes> => {
  const simulationId = await getSimulationIdByPortfolio(portfolioId);
  if (!simulationId) {
    return { totalReturnPct: 0, return1D: null, return1W: null, return1M: null, return1Y: null };
  }

  const { data, error } = await supabase
    .from('simulation_value_history')
    .select('date, index_value, return_pct')
    .eq('simulation_id', simulationId)
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

export type SimulationHoldingReturnTypes = {
  assetId: string;
  cumulativeReturnPct: number;
  contributionPct: number;
  basePrice: number;
  latestPrice: number;
};

export const getSimulationHoldingReturns = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<SimulationHoldingReturnTypes[]> => {
  const simulationId = await getSimulationIdByPortfolio(portfolioId);
  if (!simulationId) return [];

  const { data, error } = await supabase
    .from('simulation_holding_returns')
    .select('asset_id, cumulative_return_pct, contribution_pct, base_price, latest_price')
    .eq('simulation_id', simulationId);
  if (error) throw error;

  return (data ?? []).map((r) => ({
    assetId: r.asset_id,
    cumulativeReturnPct: Number(r.cumulative_return_pct ?? 0),
    contributionPct: Number(r.contribution_pct ?? 0),
    basePrice: Number(r.base_price ?? 0),
    latestPrice: Number(r.latest_price ?? 0),
  }));
};

export const triggerSimulationRecalc = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<void> => {
  await supabase.functions.invoke('recalc-portfolio-returns', {
    body: { portfolioId },
  });
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
  reason?: string;
  imageUrl?: string | string[] | null;
};

export type TopUpPlanResponseTypes = {
  portfolioId: string;
  simulationId: string;
  additionalCash: number;
  baseCurrency: string;
  currentTotalValue: number;
  newTotalValue: number;
  remainingCash: number;
  recommendations: TopUpRecommendationTypes[];
};

export type TopUpExecuteResponseTypes = {
  portfolioId: string;
  simulationId: string;
  baseCurrency: string;
  summary: {
    additionalCash: number;
    totalPurchaseAmount: number;
    remainingCash: number;
  };
  updatedItems: {
    assetId: string;
    symbol: string;
    name: string;
    previousQuantity: number;
    addedQuantity: number;
    newQuantity: number;
    previousAvgPrice: number;
    newAvgPrice: number;
  }[];
};

export const getSimulationTopUpPlan = async ({
  portfolioId,
  additionalCash,
}: {
  portfolioId: string;
  additionalCash: number;
}): Promise<TopUpPlanResponseTypes> => {
  const { data, error } = await supabase.functions.invoke('simulation-topup-plan', {
    body: { portfolioId, additionalCash },
  });
  if (error) throw error;
  return data as TopUpPlanResponseTypes;
};

export const executeSimulationTopUp = async ({
  portfolioId,
  additionalCash,
  purchases,
  addRemainingCashToBaseline,
}: {
  portfolioId: string;
  additionalCash: number;
  purchases: { assetId: string; quantity: number; purchasePrice: number }[];
  addRemainingCashToBaseline?: boolean;
}): Promise<TopUpExecuteResponseTypes> => {
  const { data, error } = await supabase.functions.invoke('simulation-execute-topup', {
    body: { portfolioId, additionalCash, purchases, addRemainingCashToBaseline },
  });
  if (error) throw error;
  return data as TopUpExecuteResponseTypes;
};
