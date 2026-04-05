import '@/global.css';

import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { queryClient, useAppState } from '@/lib/react-query';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Toaster } from 'sonner-native';
import { useUniwind } from 'uniwind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  fade: true,
  duration: 500,
});

export default function RootLayout() {
  const { theme } = useUniwind();

  // React Query - 앱 포커스시 refetch 활성화
  useAppState();

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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

              <Stack.Screen name="portfolio/[id]" options={{ headerShown: false }} />
              <Stack.Screen
                name="asset/[assetId]"
                options={{
                  presentation: Platform.OS === 'ios' ? 'modal' : 'formSheet',
                  headerShown: false,
                  gestureEnabled: true,
                  sheetAllowedDetents: [0.96],
                  sheetCornerRadius: 36,
                  sheetGrabberVisible: false,
                }}
              />
              <Stack.Screen
                name="(custom-portfolio)"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="(arena)"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen name="component-preview" options={{ headerShown: false }} />
              <Stack.Screen name="(settings)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(common)"
                options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
              />
              <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen
                name="modal/login-sheet"
                options={{
                  presentation: 'formSheet',
                  headerShown: false,
                  gestureEnabled: true,
                  sheetAllowedDetents: [0.32],
                  sheetCornerRadius: 36,
                  sheetGrabberVisible: false,
                }}
              />
              <Stack.Screen
                name="modal/pick-preferences"
                options={{
                  presentation: Platform.OS === 'ios' ? 'modal' : 'formSheet',
                  headerShown: false,
                  gestureEnabled: true,
                  sheetAllowedDetents: [0.96],
                  sheetCornerRadius: 36,
                  sheetGrabberVisible: false,
                }}
              />
            </Stack>
            <PortalHost />
            <Toaster
              theme={theme ?? 'light'}
              positionerStyle={{ maxWidth: 400, width: '100%', alignSelf: 'center' }}
            />
            <LoadingOverlay />
          </ThemeProvider>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
