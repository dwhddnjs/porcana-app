import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, accessToken, refreshToken } = useUserStore();

  // if (user) return <Redirect href="/(tabs)" />;

  return <Redirect href="/enter-password" />;
}
