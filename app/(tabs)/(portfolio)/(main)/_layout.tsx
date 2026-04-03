import { Stack } from 'expo-router';

export default function PortfolioMainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: true,
      }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
