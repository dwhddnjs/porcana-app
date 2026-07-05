import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useSession } from '@/lib/hooks/query/use-session';
import { useUserStoreHydrated } from '@/lib/hooks/use-store-hydration';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isLoading } = useSession();
  const user = useUserStore((s) => s.user);
  const hasCompletedInstall = useUserStore((s) => s.hasCompletedInstall);

  // AsyncStorage 리하이드레이션 완료 전엔 hasCompletedInstall이 초기값(false)이라,
  // 완료 대기 후 분기해야 이미 설치한 유저가 설치화면으로 잘못 튕기지 않는다.
  const isHydrated = useUserStoreHydrated();

  if (isLoading || !isHydrated) return null;

  // 최초 설치: 프리패칭 설치 화면부터 (1회)
  if (!hasCompletedInstall) {
    return <Redirect href="/install" />;
  }

  // 영구 회원이면 홈으로
  if (user && !user.isAnonymous) {
    return <Redirect href="/(tabs)" />;
  }

  // 그 외(익명/포트폴리오 없음): 랜딩 화면부터
  return <Redirect href="/(common)/landing" />;
}
