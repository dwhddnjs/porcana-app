import { api } from '.';

export type HomeChartData = {
  date?: string;
  value?: number;
  [key: string]: any;
};

export type HomeMainPortfolio = {
  name: string;
  portfolioId: string;
  startedAt: string;
  totalReturnPct: number;
};

export type HomePosition = {
  assetId: string;
  imageUrl: string | null;
  name: string;
  returnPct: number;
  ticker: string;
  weightPct: number;
};

export type HomeResponse = {
  chart: HomeChartData[];
  hasMainPortfolio: boolean;
  mainPortfolio: HomeMainPortfolio | null;
  positions: HomePosition[];
};

export const getHome = async (): Promise<HomeResponse> => {
  try {
    const response = await api.get<HomeResponse>('/home');
    return response.data;
  } catch (error) {
    console.error('Error fetching home:', error);
    throw error;
  }
};
