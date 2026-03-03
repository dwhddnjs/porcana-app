import '@/global.css';

import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { SplashScreen as CustomSplashScreen } from '@/components/splash-screen';
import { queryClient, useAppState } from '@/lib/react-query';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Toaster } from 'sonner-native';
import { useUniwind } from 'uniwind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { theme } = useUniwind();
  const [showSplash, setShowSplash] = useState(true);

  // React Query - 앱 포커스시 refetch 활성화
  useAppState();

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider value={NAV_THEME[theme ?? 'light']}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="add-modal"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen name="portfolio/[id]" options={{ headerShown: false }} />
              <Stack.Screen
                name="asset/[assetId]"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                  gestureEnabled: true,
                  sheetGrabberVisible: false,
                }}
              />
              <Stack.Screen name="component-preview" options={{ headerShown: false }} />
              <Stack.Screen name="color-mode" options={{ headerShown: false }} />
              <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
              <Stack.Screen
                name="withdraw"
                options={{
                  headerShown: false,
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="login-sheet"
                options={{
                  presentation: 'formSheet',
                  headerShown: false,
                  sheetAllowedDetents: [0.3],
                  sheetGrabberVisible: false,
                }}
              />
            </Stack>
            <PortalHost />
            <Toaster theme={theme ?? 'light'} />
            <LoadingOverlay />
            {showSplash && (
              <CustomSplashScreen
                onFinish={() => {
                  setShowSplash(false);
                  SplashScreen.hideAsync();
                }}
              />
            )}
          </ThemeProvider>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
