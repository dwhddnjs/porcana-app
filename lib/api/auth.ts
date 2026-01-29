import { api } from './client';

type SignupRequestTypes = {
  nickname: string;
  email: string;
  password: string;
};

type SignupResponseTypes = {
  accessToken: string;
  refreshToken: string;
};

export const signup = async ({
  nickname,
  email,
  password,
}: SignupRequestTypes): Promise<SignupResponseTypes> => {
  try {
    // 디버깅용 - 문제 해결 후 삭제
    console.log('Signup request to:', api.defaults.baseURL + 'auth/signup');

    const response = await api.post('/auth/signup', {
      nickname,
      email,
      password,
    });

    // TODO: 실제 API 연동 시 아래 mock 데이터 제거
    return response.data;
  } catch (error: any) {
    // 더 자세한 에러 정보 출력
    console.error('Signup Error Details:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    });
    throw error;
  }
};

export type ProviderTypes = 'EMAIL' | 'GOOGLE' | 'APPLE';

type LoginRequestTypes = {
  email?: string;
  password?: string;
  provider?: ProviderTypes;
  code?: string;
};

type LoginResponseTypes = {
  accessToken: string;
  refreshToken: string;
};

export const login = async ({
  email,
  password,
  provider = 'EMAIL',
  code,
}: LoginRequestTypes): Promise<LoginResponseTypes> => {
  try {
    const response = await api.post('auth/login', {
      provider,
      email,
      password,
      code,
    });
    return response.data;
  } catch (error: any) {
    console.error('Login Error:', error);
    throw error;
  }
};

type AppleLoginRequestTypes = {
  identityToken: string;
  user: string;
  email?: string | null;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
};

export const appleLogin = async ({
  identityToken,
  user,
  email,
  fullName,
}: AppleLoginRequestTypes): Promise<LoginResponseTypes> => {
  try {
    const response = await api.post('auth/login', {
      provider: 'APPLE' as ProviderTypes,
      identityToken,
      user,
      email,
      fullName,
    });
    return response.data;
  } catch (error: any) {
    console.error('Apple Login Error:', error);
    throw error;
  }
};

export type GuestSessionResponseTypes = {
  guestSessionId: string;
};

export const createGuestSession = async (): Promise<GuestSessionResponseTypes> => {
  try {
    const response = await api.post('guest-sessions');
    return response.data;
  } catch (error: any) {
    console.error('Create Guest Session Error:', error);
    throw error;
  }
};

export const getRefreshToken = async ({ refreshToken }: { refreshToken: string }) => {
  try {
    const response = await api.post('auth/refresh', {
      refreshToken,
    });
    return response.data;
  } catch (error: any) {
    console.error('Get Refresh Token Error:', error);
    throw error;
  }
};

type CheckEmailResponseTypes = {
  available: boolean;
};

export const checkEmail = async ({ email }: { email: string }) => {
  try {
    const response = await api.get<CheckEmailResponseTypes>(`auth/check-email?email=${email}`);
    return response.data;
  } catch (error: any) {
    console.error('Check Email Error:', error);
    throw error;
  }
};
