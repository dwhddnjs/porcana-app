import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { ActivityIndicator, View } from 'react-native';
import { Text } from './text';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export function LoadingOverlay() {
  const { isLoading, message } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="absolute inset-0 z-50 items-center justify-center bg-black/50">
      {/* <View className="bg-card items-center gap-3 rounded-2xl px-8 py-6"> */}
      <ActivityIndicator size="large" />
      {/* {message && <Text className="text-muted-foreground">{message}</Text>} */}
      {/* </View> */}
    </Animated.View>
  );
}
