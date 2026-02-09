import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, accessToken, refreshToken } = useUserStore();

  if (user && accessToken && refreshToken) return <Redirect href="/(tabs)" />;
  if (user && !accessToken && !refreshToken) return <Redirect href="/login" />;

  return <Redirect href="/complete" />;
}
