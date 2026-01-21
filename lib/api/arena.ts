// 아레나 세션 생성

import { api } from '.';

export const createArenaSessions = async () => {
  try {
    const response = await api.post('/api/arena/session');
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
