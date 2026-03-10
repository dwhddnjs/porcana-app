import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useCreatePortfolioMutation } from '@/lib/hooks/mutation/portfolio';
import { THEME } from '@/lib/theme';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { PieChartIcon, PlusIcon, UserIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate } = useCreatePortfolioMutation();
  const rotation = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);
  const portfolioNameRef = useRef('');

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleAddButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (dialogOpen) {
      Keyboard.dismiss();
      rotation.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      setDialogOpen(false);
    } else {
      rotation.value = withTiming(45, { duration: 300, easing: Easing.out(Easing.cubic) });
      setDialogOpen(true);
    }
  };

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    rotation.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    setDialogOpen(false);
  };

  const handleChangeText = (text: string) => {
    portfolioNameRef.current = text;
  };

  const handleStart = () => {
    const name = portfolioNameRef.current.trim();
    if (!name) return;
    rotation.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    setDialogOpen(false);
    portfolioNameRef.current = '';
    inputRef.current?.clear();
    mutate(name);
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
      {dialogOpen && (
        <CreatePortfolioOverlay
          onOverlayPress={handleOverlayPress}
          onChangeText={handleChangeText}
          onStart={handleStart}
          inputRef={inputRef}
        />
      )}
    </>
  );
}

const CreatePortfolioOverlay = ({
  onOverlayPress,
  onChangeText,
  onStart,
  inputRef,
}: {
  onOverlayPress: () => void;
  onChangeText: (text: string) => void;
  onStart: () => void;
  inputRef: React.RefObject<TextInput | null>;
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <Pressable onPress={onOverlayPress} style={StyleSheet.absoluteFill} className="bg-black/50" />
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}
        pointerEvents="box-none">
        <Animated.View
          entering={FadeIn.delay(50)}
          className="bg-background border-border w-[320px] gap-4 rounded-lg border p-6 shadow-lg shadow-black/5">
          <Text className="text-foreground text-lg font-semibold">
            새 포트폴리오 이름을 적어주세요
          </Text>
          <Input ref={inputRef} placeholder="포트폴리오 이름" onChangeText={onChangeText} />
          <Button size="lg" onPress={onStart}>
            <Text>시작하기</Text>
          </Button>
        </Animated.View>
      </View>
    </Animated.View>
  );
};
