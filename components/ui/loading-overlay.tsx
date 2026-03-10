import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { ActivityIndicator, View } from 'react-native';
import { Text } from './text';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export function LoadingOverlay() {
  const { isLoading, message } = useLoadingStore();

  return (
    <Animated.View
      pointerEvents={isLoading ? 'auto' : 'none'}
      style={{ opacity: isLoading ? 1 : 0 }}
      className="absolute inset-0 z-50 items-center justify-center bg-black/50">
      <ActivityIndicator size="large" />
    </Animated.View>
  );
}
