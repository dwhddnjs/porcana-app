import { Stack } from 'expo-router';

export default function CustomPortfolioGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(select-assets)" />
      <Stack.Screen name="custom-portfolio-detail" />
    </Stack>
  );
}
