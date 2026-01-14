import { Text } from '@/components/ui/text';
import { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_HEIGHT = 44;
const LARGE_HEADER_HEIGHT = 52;

interface LargeHeaderProps {
  title: string;
  children: ReactNode;
  headerRight?: ReactNode;
}

export function LargeHeader({ title, children, headerRight }: LargeHeaderProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, LARGE_HEADER_HEIGHT], [0, 1], 'clamp');

    return {
      opacity,
    };
  });

  const largeTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, LARGE_HEADER_HEIGHT], [1, 0], 'clamp');
    const translateY = interpolate(scrollY.value, [0, LARGE_HEADER_HEIGHT], [0, -10], 'clamp');

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View className="bg-background flex-1">
      {/* Fixed Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-background absolute top-0 right-0 left-0 z-10">
        <View style={{ height: HEADER_HEIGHT }} className="flex-row items-center justify-center">
          <Animated.View style={headerAnimatedStyle}>
            <Text className="text-base font-semibold">{title}</Text>
          </Animated.View>
          {headerRight && <View className="absolute right-4">{headerRight}</View>}
        </View>
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_HEIGHT,
          paddingBottom: insets.bottom,
        }}>
        {/* Large Title */}
        <Animated.View style={largeTitleAnimatedStyle} className="px-4 pt-2 pb-2">
          <Text className="text-3xl font-bold">{title}</Text>
        </Animated.View>

        {/* Content */}
        {children}
      </Animated.ScrollView>
    </View>
  );
}
