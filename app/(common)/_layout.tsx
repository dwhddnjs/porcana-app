import { Stack } from 'expo-router';

export default function CommonLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen options={{ animation: 'fade' }} name="landing" />
    </Stack>
  );
}
