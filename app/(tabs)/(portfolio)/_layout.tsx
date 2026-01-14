import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function PortfolioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="add-modal"
        options={{
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetAllowedDetents: Platform.OS === 'android' ? [0.96] : undefined,
          sheetCornerRadius: Platform.OS === 'android' ? 30 : undefined,
        }}
      />
    </Stack>
  );
}
