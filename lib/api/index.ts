import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useUserStore } from "../hooks/use-user-store";

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

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  if (!envUrl) {
    console.warn("EXPO_PUBLIC_API_BASE_URL is not defined");
    return "http://localhost:3000/app/v1/";
  }
  
  // 끝에 슬래시가 없으면 추가
  const normalizedUrl = envUrl.endsWith("/") ? envUrl : `${envUrl}/`;
  return `${normalizedUrl}api/v1/`;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
});

// 디버깅용 - 문제 해결 후 삭제
console.log("API Base URL:", api.defaults.baseURL);

// 요청 인터셉터 - 매 요청마다 토큰 자동 주입
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useUserStore.getState();
    if (accessToken) {
      config.headers["X-Access-Token"] = accessToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리 및 갱신
api.interceptors.response.use(
  (response) => {
    // result_code -1, -2는 토큰 만료
    if (
      response.data &&
      (response.data.result_code === -2 || response.data.result_code === -1)
    ) {
      const error: any = new Error("Token expired");
      error.config = response.config;
      error.response = response;
      return Promise.reject(error);
    }
    return response;
  },
  async (err: AxiosError<ApiResponse<any>>) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(err);
    }

    const resultCode = err.response?.data?.result_code;

    // 토큰 만료 에러이고 아직 재시도하지 않은 경우
    if (
      (resultCode === -1 || resultCode === -2) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // 이미 갱신 중이면 큐에 넣고 대기
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["X-Access-Token"] = token;
            return api(originalRequest);
          })
          .catch((queueErr) => Promise.reject(queueErr));
      }

      isRefreshing = true;
      const { refreshToken, setTokens, clearTokens } = useUserStore.getState();

      if (!refreshToken) {
        clearTokens();
        isRefreshing = false;
        return Promise.reject(new Error("No refresh token available"));
      }

      try {
        const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          "auth/refresh",
          { refreshToken }
        );

        if (res.data.result_code === 0) {
          const newAccessToken = res.data.result_data.accessToken;
          const newRefreshToken = res.data.result_data.refreshToken;

          // 새 토큰 저장
          setTokens(newAccessToken, newRefreshToken);

          // 대기 중인 요청들에 새 토큰 전달
          processQueue(null, newAccessToken);

          // 원래 요청에 새 토큰 설정 후 재시도
          originalRequest.headers["X-Access-Token"] = newAccessToken;
          return api(originalRequest);
        } else {
          // 갱신 실패 - 로그아웃 처리
          clearTokens();
          processQueue(new Error("Token refresh failed"), null);
          return Promise.reject(new Error("Token refresh failed"));
        }
      } catch (refreshErr) {
        clearTokens();
        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // 디버깅용 - 실제 에러 정보 출력
    console.log("Axios Error Debug:", {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      code: err.code,
    });

    // 기타 에러 처리
    const errorObj: { message: string; status?: number } = { message: "Unknown error" };

    if (err.response) {
      errorObj.status = err.response.status;
      if (err.response.data) {
        // result_msg가 있으면 사용, 없으면 JSON 문자열로 변환
        errorObj.message =
          err.response.data.result_msg || 
          (typeof err.response.data === 'string' 
            ? err.response.data 
            : JSON.stringify(err.response.data));
      } else {
        errorObj.message = err.response.statusText;
      }
    } else {
      errorObj.message = err.message || "Network error";
    }

    return Promise.reject(errorObj);
  }
);
