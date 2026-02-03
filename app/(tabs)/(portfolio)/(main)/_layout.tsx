import { Stack } from 'expo-router';

export default function PortfolioMainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="asset/[assetId]"
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          sheetGrabberVisible: false,
        }}
      />
    </Stack>
  );
}
