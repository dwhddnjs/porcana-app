// 아레나 세션 생성

import { api } from '.';

export const createArenaSessions = async ({ portfolioId }: { portfolioId: string }) => {
  try {
    const response = await api.post('arena/sessions', {
      portfolioId,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const pickArenaSessionPreference = async ({
  sessionId,
  riskProfile,
  sectors,
}: {
  sessionId: string;
  riskProfile: string;
  sectors: string[];
}) => {
  try {
    const response = await api.post(`arena/sessions/${sessionId}/rounds/current/pick-preferences`, {
      riskProfile,
      sectors,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getArenaSessionRounds = async ({ sessionId }: { sessionId: string }) => {
  try {
    const response = await api.get(`arena/sessions/${sessionId}/rounds/current`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const pickArenaSessionAsset = async ({
  sessionId,
  pickedAssetId,
}: {
  sessionId: string;
  pickedAssetId: string;
}) => {
  try {
    const response = await api.post(`arena/sessions/${sessionId}/rounds/current/pick-asset`, {
      pickedAssetId,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
