import { api } from './client';
import { supabase } from '@/lib/supabase/client';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({ nickname })
    .eq('user_id', user.id)
    .select('user_id, nickname')
    .single();

  if (error) {
    console.error('Update Profile Error:', error);
    throw error;
  }

  return { userId: data.user_id, nickname: data.nickname };
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
