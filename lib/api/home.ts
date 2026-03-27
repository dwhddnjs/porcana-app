import { api } from '.';

export type HomeChartDataTypes = {
  date?: string;
  value?: number;
  [key: string]: any;
};

export type HomeMainPortfolioTypes = {
  name: string;
  portfolioId: string;
  startedAt: string;
  totalReturnPct: number;
};

export type HomePositionTypes = {
  assetId: string;
  imageUrl: string | null;
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

export const getHome = async (): Promise<HomeResponseTypes> => {
  try {
    const response = await api.get<HomeResponseTypes>('/home');
    return response.data;
  } catch (error) {
    console.error('Error fetching home:', error);
    throw error;
  }
};
