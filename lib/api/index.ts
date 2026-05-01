import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from '@/lib/supabase/client';
import { api } from './client';

export interface ApiResponseTypes<T> {
  result_code: number;
  result_msg: string;
  result_data: T;
}

export type ResolverTypes<T> = {
  onSuccess?: (data?: any) => void;
  onFailure?: (error?: any) => void;
} & T;

// Supabase 익명 인증으로 통합되어 더 이상 별도 게스트 헤더가 필요 없음.
// 5단계에서 axios 자체가 제거되면 같이 사라질 호환용 no-op.
export const setGuestSessionId = (_id: string | null) => {};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (err: AxiosError) => {
    const errorObj: { message: string; status?: number } = { message: 'Unknown error' };
    if (err.response) {
      errorObj.status = err.response.status;
      const data = err.response.data as any;
      if (data) {
        errorObj.message = data.message || (typeof data === 'string' ? data : JSON.stringify(data));
      } else {
        errorObj.message = err.response.statusText;
      }
    } else {
      errorObj.message = err.message || 'Network error';
    }
    return Promise.reject(errorObj);
  }
);

export { api };
