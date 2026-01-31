import { api } from '.';

export type Portfolio = {
  portfolioId: string;
  name: string;
  status: string;
  isMain: boolean;
  totalReturnPct: number;
  createdAt: string;
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
