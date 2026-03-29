import { Pressable, View, useColorScheme } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { memo, useEffect, useState } from 'react';
import { AssetTypes } from '@/lib/hooks/zustand/use-arena-store';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { Star, TriangleAlert } from 'lucide-react-native';
import { getRiskStarColor } from '@/lib/constant/function';
import { sectorLabels } from '@/lib/constant/variables';

const logoBlack = require('@/assets/images/logo-black.png');
const logoWhite = require('@/assets/images/logo-white.png');

interface FlipCardProps {
  index: number;
  onSelect: () => void;
  isFlipped: boolean;
  asset: AssetTypes;
  disabled?: boolean;
  isSelected?: boolean;
  /** 카드 너비 (기본값: 128) */
  width?: number;
  /** 카드 높이 (기본값: 192) */
  height?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FlipCard = memo(function FlipCard({
  index,
  onSelect,
  isFlipped,
  asset,
  disabled = false,
  isSelected = false,
  width = 128,
  height = 192,
}: FlipCardProps) {
  const colorScheme = useColorScheme();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (isFlipped) {
      // 각 카드에 약간의 딜레이를 줘서 동시에 뒤집히는 느낌을 줌
      rotation.value = withDelay(
        index * 100,
        withTiming(180, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        })
      );
    } else {
      rotation.value = withTiming(0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [isFlipped, index]);

  // scale 애니메이션 통합 관리 - 우선순위: isSelected > isPressed > default
  useEffect(() => {
    const springConfig = { damping: 15, stiffness: 800 };

    if (isSelected) {
      scale.value = withSpring(1.08, springConfig);
    } else if (isPressed) {
      scale.value = withSpring(1.04, springConfig);
    } else {
      scale.value = withSpring(1, springConfig);
    }
  }, [isSelected, isPressed]);

  const handlePressIn = () => {
    if (!disabled && isFlipped && !isSelected) {
      setIsPressed(true);
    }
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }, { scale: scale.value }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }, { scale: scale.value }],
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <AnimatedPressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !isFlipped}
      style={{ width, height, position: 'relative' }}>
      {/* 카드 뒷면 (처음 보이는 면) */}
      <Animated.View
        style={frontAnimatedStyle}
        className="bg-card absolute h-full w-full items-center justify-center rounded-xl shadow-lg shadow-black/25">
        <View className="border-primary h-full w-full items-center justify-center rounded-xl border-4 p-2">
          <Image
            source={colorScheme === 'dark' ? logoWhite : logoBlack}
            className="h-12 w-12"
            contentFit="contain"
          />
          <View className="border-primary absolute top-2 right-2 bottom-2 left-2 rounded-lg border opacity-30" />
        </View>
      </Animated.View>

      {/* 카드 앞면 (뒤집히면 보이는 면) */}
      <Animated.View
        style={backAnimatedStyle}
        className="bg-card absolute h-full w-full rounded-xl shadow-lg shadow-black/25">
        <View className="border-primary h-full w-full rounded-xl border-[1.5px] px-[11px] py-[7px]">
          {/* 상단: 이미지 + 티커 */}

          <View className="flex-row items-center gap-[6px]">
            <Image
              source={asset.imageUrl}
              className="bg-background h-9 w-9 rounded-full"
              contentFit="contain"
            />
            <View className="flex-1">
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="text-primary text-sm font-bold text-ellipsis">
                {asset.name}
              </Text>
              <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                {asset.ticker}
              </Text>
            </View>
          </View>

          {/* 중앙: 섹터 + 마켓 */}
          {(asset.sector || asset.market) && (
            <View className="mt-1.5 flex-row flex-wrap gap-1">
              {asset.sector && (
                <View className="bg-primary/10 items-center justify-center rounded px-1.5 py-0.5">
                  <Text className="text-primary text-xs font-semibold">
                    {sectorLabels[asset.sector] || asset.sector}
                  </Text>
                </View>
              )}
              {asset.market && (
                <View className="border-primary/10 rounded border px-1.5 py-0.5">
                  <Text className="text-muted-foreground text-xs font-semibold">
                    {asset.market}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="flex-1 items-center justify-center">
            <Text className="text-primary text-center text-xs" numberOfLines={2}>
              {asset.impactHint}
            </Text>
          </View>

          {/* 리스크 레벨 */}
          <View className="mt-auto items-center justify-start gap-1.5">
            <View className="flex-row items-center gap-1">
              <Icon as={TriangleAlert} size={14} className="text-muted-foreground" />
              <Text className="text-muted-foreground text-xs font-bold">리스크</Text>
            </View>
            <View className="flex-row items-center gap-1.5 pb-[3px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  as={Star}
                  size={18}
                  color={getRiskStarColor(asset.currentRiskLevel, colorScheme ?? 'light')}
                  fill={
                    i < asset.currentRiskLevel
                      ? getRiskStarColor(asset.currentRiskLevel, colorScheme ?? 'light')
                      : 'transparent'
                  }
                />
              ))}
            </View>
          </View>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
});
