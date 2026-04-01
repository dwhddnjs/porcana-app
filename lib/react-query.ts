import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';

// QueryClient 생성
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 데이터가 오래된 것으로 간주되기까지의 시간 (기본값: 0)
      staleTime: 1000 * 60 * 5, // 5분
      // 가비지 컬렉션 시간 (기본값: 5분)
      gcTime: 1000 * 60 * 10, // 10분
      // 실패 시 재시도 횟수 (기본값: 3)
      retry: 2,
      // 윈도우 포커스시 자동 refetch (웹에서만 동작, 모바일은 useAppState로 처리)
      refetchOnWindowFocus: false,
      // 마운트시 자동 refetch
      refetchOnMount: true,
      // 네트워크 재연결시 자동 refetch
      refetchOnReconnect: true,
    },
    mutations: {
      // 뮤테이션 실패 시 재시도 횟수
      retry: 1,
    },
  },
});

// Online status management (네트워크 상태 관리)
// https://tanstack.com/query/v5/docs/framework/react/react-native#online-status-management
if (Platform.OS !== 'web') {
  onlineManager.setEventListener((setOnline) => {
    const eventSubscription = Network.addNetworkStateListener((state) => {
      setOnline(!!state.isConnected);
    });
    return eventSubscription.remove;
  });
}

// App focus 상태 변경 핸들러
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

// Refetch on App focus (앱 포커스시 refetch)
// https://tanstack.com/query/v5/docs/framework/react/react-native#refetch-on-app-focus
export const useAppState = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);
};
