import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';

export interface ApiResponse<T> {
  result_code: number;
  result_msg: string;
  result_data: T;
}

export type ResolverTypes<T> = {
  onSuccess?: (data?: any) => void;
  onFailure?: (error?: any) => void;
} & T;

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: envUrl ? `${envUrl}/api/v1/` : 'http://localhost:3000/app/v1/',
});

// 요청 인터셉터 - 매 요청마다 토큰 자동 주입
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useUserStore.getState();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리 및 갱신
api.interceptors.response.use(
  (response) => response,
  async (err: AxiosError) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(err);
    }

    const httpStatus = err.response?.status;

    // refresh 요청은 토큰 갱신 로직에서 제외 (무한 루프 방지)
    const isRefreshRequest = originalRequest.url?.includes('auth/refresh');

    // HTTP 401 토큰 만료 에러이고 아직 재시도하지 않은 경우
    if (httpStatus === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;

      // 이미 갱신 중이면 큐에 넣고 대기
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((queueErr) => Promise.reject(queueErr));
      }

      isRefreshing = true;
      const { refreshToken, setTokens, clearTokens } = useUserStore.getState();

      if (!refreshToken) {
        clearTokens();
        isRefreshing = false;
        return Promise.reject(new Error('No refresh token available'));
      }

      try {
        const res = await api.post<{ accessToken: string; refreshToken: string }>('auth/refresh', {
          refreshToken,
        });

        const newAccessToken = res.data.accessToken;
        const newRefreshToken = res.data.refreshToken;

        // 새 토큰 저장
        setTokens(newAccessToken, newRefreshToken);

        // 대기 중인 요청들에 새 토큰 전달
        processQueue(null, newAccessToken);

        // 원래 요청에 새 토큰 설정 후 재시도
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        clearTokens();
        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // 디버깅용 - 실제 에러 정보 출력
    console.log('Axios Error Debug:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      code: err.code,
    });

    // 기타 에러 처리
    const errorObj: { message: string; status?: number } = { message: 'Unknown error' };

    if (err.response) {
      errorObj.status = err.response.status;
      const data = err.response.data as any;
      if (data) {
        // message 필드가 있으면 사용, 없으면 JSON 문자열로 변환
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
