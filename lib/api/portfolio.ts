import { api } from '.';

export type PositionTypes = {
  assetId: string;
  currentRiskLevel: number;
  imageUrl: string | null;
  name: string;
  returnPct: number;
  ticker: string;
  weightPct: number;
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
    console.log(portfolioId);
    console.log(weights);
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
  console.log('portfolioId', portfolioId);
  try {
    const response = await api.delete(`/portfolios/${portfolioId}`);

    console.log('response', response);

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
