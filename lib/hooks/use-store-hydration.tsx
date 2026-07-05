import { useEffect, useState } from 'react';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';

/**
 * useUserStore의 AsyncStorage 리하이드레이션 완료 여부.
 * persist된 값(themeMode, hasCompletedInstall)에 의존해 분기하기 전 이 값이 true인지 확인해야
 * 초기값으로 잘못 분기하지 않는다.
 */
export const useUserStoreHydrated = (): boolean => {
  const [isHydrated, setIsHydrated] = useState(() => useUserStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useUserStore.persist.onFinishHydration(() => setIsHydrated(true));
    if (useUserStore.persist.hasHydrated()) setIsHydrated(true);
    return unsubscribe;
  }, []);

  return isHydrated;
};
