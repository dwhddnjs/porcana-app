import { api } from '.';

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

export const getPortfolios = async () => {
  try {
    const response = await api.get(`/portfolios`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
