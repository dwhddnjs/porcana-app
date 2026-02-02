import { api } from '.';

export type Position = {
  assetId: string;
  currentRiskLevel: number;
  imageUrl: string | null;
  name: string;
  returnPct: number;
  ticker: string;
  weightPct: number;
};

export type RiskDistribution = Record<string, number>;

export type DiversityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type Portfolio = {
  portfolioId: string;
  name: string;
  status: string;
  isMain: boolean;
  totalReturnPct: number;
  createdAt?: string;
  averageRiskLevel: number;
  diversityLevel?: DiversityLevel;
  positions?: Position[];
  riskDistribution?: RiskDistribution;
  startedAt?: string;
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

export const getPortfolios = async (): Promise<Portfolio[]> => {
  try {
    const response = await api.get<Portfolio[]>(`/portfolios`);
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
}): Promise<Portfolio> => {
  try {
    const response = await api.get<Portfolio>(`/portfolios/${portfolioId}`);
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
