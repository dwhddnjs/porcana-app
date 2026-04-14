import { api } from '.';

export type PositionTypes = {
  assetId: string;
  currentRiskLevel: number;
  imageUrl: string | null;
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
  imageUrl: string | null;
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

export const createPortfolio = async ({ name }: { name: string }) => {
  try {
    const response = await api.post('/portfolios', {
      name,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getPortfolios = async (): Promise<PortfolioTypes[]> => {
  try {
    const response = await api.get<PortfolioTypes[]>(`/portfolios`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getPortfolio = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<PortfolioTypes> => {
  try {
    const response = await api.get<PortfolioTypes>(`/portfolios/${portfolioId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
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
  try {
    const response = await api.put<PortfolioTypes>(`/portfolios/${portfolioId}/weights`, {
      weights,
    });

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deletePortfolio = async ({ portfolioId }: { portfolioId: string }) => {
  try {
    const response = await api.delete(`/portfolios/${portfolioId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
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
  try {
    const response = await api.post<DirectCreatePortfolioResponseTypes>('/portfolios/direct', {
      name,
      assets,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
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
  try {
    const response = await api.put<BaselineResponseTypes>(
      `/portfolios/${portfolioId}/seed`,
      { seedMoney, baseCurrency }
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getHoldingBaseline = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<BaselineResponseTypes> => {
  try {
    const response = await api.get<BaselineResponseTypes>(
      `/portfolios/${portfolioId}/holding-baseline`
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
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
  thresholdPct,
}: {
  portfolioId: string;
  thresholdPct?: number;
}): Promise<RebalanceStatusResponseTypes> => {
  try {
    const response = await api.get<RebalanceStatusResponseTypes>(
      `/portfolios/${portfolioId}/rebalance-status`,
      { params: thresholdPct !== undefined ? { thresholdPct } : undefined }
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
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
  thresholdPct,
}: {
  portfolioId: string;
  thresholdPct?: number;
}): Promise<RebalancingPlanResponseTypes> => {
  try {
    const response = await api.post<RebalancingPlanResponseTypes>(
      `/portfolios/${portfolioId}/rebalancing-plan`,
      thresholdPct !== undefined ? { thresholdPct } : undefined
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const setMainPortfolio = async ({
  portfolioId,
}: {
  portfolioId: string;
}): Promise<{ mainPortfolioId: string }> => {
  try {
    const response = await api.put(`/portfolios/${portfolioId}/main`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
