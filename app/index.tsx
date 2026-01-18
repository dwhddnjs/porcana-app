import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: 로그인 상태 확인 후 분기 처리
  // if (isLoggedIn) return <Redirect href="/(tabs)" />;

  return <Redirect href="/(auth)/login" />;
}
