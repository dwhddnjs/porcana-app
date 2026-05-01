import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useSession } from '@/lib/hooks/query/use-session';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isLoading } = useSession();
  const user = useUserStore((s) => s.user);

  if (isLoading) return null;

  // 영구 회원이고 메인 포트폴리오가 있으면 홈으로
  if (user && !user.isAnonymous && user.mainPortfolioId) {
    return <Redirect href="/(tabs)" />;
  }

  // 그 외(익명/포트폴리오 없음): 아레나로 진입해 포트폴리오 생성부터
  return <Redirect href="/(arena)" />;
}
