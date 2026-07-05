import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="color-mode" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="withdraw" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
