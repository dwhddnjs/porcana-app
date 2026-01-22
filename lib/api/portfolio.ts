//포트폴리오 생성

import { api } from '.';

export const createPortfolio = async ({ name, userId }: { name: string; userId: string }) => {
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
