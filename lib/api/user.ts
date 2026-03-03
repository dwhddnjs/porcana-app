import { api } from './client';

type UpdateProfileRequestTypes = {
  nickname?: string;
};

type UpdateProfileResponseTypes = {
  userId: string;
  nickname: string;
};

export const updateProfile = async ({
  nickname,
}: UpdateProfileRequestTypes): Promise<UpdateProfileResponseTypes> => {
  try {
    const response = await api.patch<UpdateProfileResponseTypes>('me', {
      nickname,
    });
    return response.data;
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    throw error;
  }
};

export const getProfile = async (): Promise<UpdateProfileResponseTypes> => {
  try {
    const response = await api.get<UpdateProfileResponseTypes>('me');
    return response.data;
  } catch (error: any) {
    console.error('Get Profile Error:', error);
    throw error;
  }
};

export const deleteAccount = async () => {
  const response = await api.delete('me');
  return response.data;
};
