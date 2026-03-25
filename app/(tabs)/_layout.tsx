import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs, useRouter } from 'expo-router';
import {
  PieChartIcon,
  PlusIcon,
  UserIcon,
  SwordsIcon,
  SlidersHorizontalIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useUniwind } from 'uniwind';
import { PressableScale } from 'pressto';

export default function TabLayout() {
  const { theme } = useUniwind();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const rotation = useSharedValue(0);
  const router = useRouter();

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleAddButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (overlayOpen) {
      rotation.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      setOverlayOpen(false);
    } else {
      rotation.value = withTiming(45, { duration: 300, easing: Easing.out(Easing.cubic) });
      setOverlayOpen(true);
    }
  };

  const handleOverlayPress = () => {
    rotation.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    setOverlayOpen(false);
  };

  const handleArenaMode = () => {
    rotation.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    setOverlayOpen(false);
    router.push('/add-modal');
  };

  const handleCustomMode = () => {
    rotation.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    setOverlayOpen(false);
    router.push('/(custom-portfolio)/(select-assets)/custom-portfolio');
  };

  return (
    <>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: theme === 'dark' ? THEME.dark.foreground : THEME.light.foreground,
          tabBarInactiveTintColor:
            theme === 'dark' ? THEME.dark.mutedForeground : THEME.light.mutedForeground,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor:
              Platform.OS === 'android'
                ? theme === 'dark'
                  ? THEME.dark.background
                  : THEME.light.background
                : 'transparent',
            borderTopColor: theme === 'dark' ? THEME.dark.border : THEME.light.border,
            zIndex: 100,
          },
          ...(Platform.OS !== 'android' && {
            tabBarBackground: () => (
              <BlurView
                intensity={80}
                tint={theme === 'dark' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ),
          }),
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="(portfolio)"
          options={{
            title: '포트폴리오',
            tabBarIcon: ({ color, size }) => <Icon as={PieChartIcon} size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="add-button"
          options={{
            title: '',
            tabBarButton: () => (
              <PressableScale
                onPress={handleAddButtonPress}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View
                  className="bg-card border-primary/20 items-center justify-center rounded-full border-[1.6px]"
                  style={{ width: 48, height: 48, marginTop: -12 }}>
                  <Animated.View style={iconAnimatedStyle}>
                    <Icon as={PlusIcon} size={32} className="text-primary" />
                  </Animated.View>
                </View>
              </PressableScale>
            ),
          }}
        />
        <Tabs.Screen
          name="(mypage)"
          options={{
            title: '마이페이지',
            tabBarIcon: ({ color, size }) => <Icon as={UserIcon} size={size} color={color} />,
          }}
        />
      </Tabs>
      {overlayOpen && (
        <ModeSelectOverlay
          onOverlayPress={handleOverlayPress}
          onArenaMode={handleArenaMode}
          onCustomMode={handleCustomMode}
        />
      )}
    </>
  );
}

const SPREAD_X = 60;
const SPREAD_Y = 50;

const ModeSelectOverlay = ({
  onOverlayPress,
  onArenaMode,
  onCustomMode,
}: {
  onOverlayPress: () => void;
  onArenaMode: () => void;
  onCustomMode: () => void;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.back(1.4)) });
  }, []);

  const arenaStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: (1 - progress.value) * SPREAD_X },
      { translateY: (1 - progress.value) * SPREAD_Y },
      { scale: 0.2 + progress.value * 0.8 },
    ],
  }));

  const customStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: -(1 - progress.value) * SPREAD_X },
      { translateY: (1 - progress.value) * SPREAD_Y },
      { scale: 0.2 + progress.value * 0.8 },
    ],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <Pressable onPress={onOverlayPress} style={StyleSheet.absoluteFill} className="bg-black/50" />
      <View
        style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 110 }}
        pointerEvents="box-none">
        <View className="flex-row items-center gap-x-8">
          <Animated.View style={arenaStyle}>
            <PressableScale onPress={onArenaMode}>
              <View className="items-center gap-y-1">
                <View className="border-primary h-[48px] w-[48px] items-center justify-center rounded-full border-[1.6px]">
                  <Icon as={SwordsIcon} className="text-primary size-6" />
                </View>
                <Text className="text-primary text-xs font-semibold">아레나 모드</Text>
              </View>
            </PressableScale>
          </Animated.View>
          <Animated.View style={customStyle}>
            <PressableScale onPress={onCustomMode}>
              <View className="items-center gap-y-1">
                <View className="border-primary h-[48px] w-[48px] items-center justify-center rounded-full border-[1.6px]">
                  <Icon as={SlidersHorizontalIcon} className="text-primary size-6" />
                </View>
                <Text className="text-primary text-xs font-semibold">커스텀 모드</Text>
              </View>
            </PressableScale>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};
