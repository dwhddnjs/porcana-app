import { Pressable, View } from 'react-native';
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
import { Asset } from '@/lib/hooks/zustand/use-arena-store';
import { Image } from '@/components/ui/image';

interface FlipCardProps {
  index: number;
  onSelect: () => void;
  isFlipped: boolean;
  asset: Asset;
  disabled?: boolean;
  isSelected?: boolean;
  /** 카드 너비 (기본값: 128) */
  width?: number;
  /** 카드 높이 (기본값: 192) */
  height?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// 섹터 한글 매핑
const sectorLabels: Record<string, string> = {
  INFORMATION_TECHNOLOGY: 'IT',
  HEALTH_CARE: '헬스케어',
  FINANCIALS: '금융',
  CONSUMER_DISCRETIONARY: '경기소비재',
  COMMUNICATION_SERVICES: '커뮤니케이션',
  INDUSTRIALS: '산업재',
  CONSUMER_STAPLES: '필수소비재',
  ENERGY: '에너지',
  UTILITIES: '유틸리티',
  REAL_ESTATE: '부동산',
  MATERIALS: '소재',
};

// 리스크 레벨 색상
const getRiskColor = (level: number) => {
  if (level <= 2) return 'text-green-500';
  if (level <= 4) return 'text-yellow-500';
  return 'text-red-500';
};

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
        className="bg-card absolute h-full w-full items-center justify-center rounded-xl shadow-lg">
        <View className="border-primary h-full w-full items-center justify-center rounded-xl border-4 p-2">
          <Text className="text-primary text-2xl font-bold">?</Text>
          <View className="border-primary absolute top-2 right-2 bottom-2 left-2 rounded-lg border opacity-30" />
        </View>
      </Animated.View>

      {/* 카드 앞면 (뒤집히면 보이는 면) */}
      <Animated.View
        style={backAnimatedStyle}
        className="bg-card absolute h-full w-full rounded-xl shadow-lg">
        <View className="border-primary h-full w-full rounded-xl border-2 p-2">
          {/* 상단: 이미지 + 티커 */}
          <View className="flex-row items-center gap-2">
            <Image
              source={asset.imageUrl}
              className="bg-background h-8 w-8 rounded-full"
              contentFit="contain"
              emptyImageClassName="h-8 w-8"
              emptyIconClassName="size-4"
            />
            <Text className="text-primary text-xl font-bold">{asset.ticker}</Text>
          </View>

          {/* 이름 */}
          <Text className="text-muted-foreground mt-1 text-xs" numberOfLines={2}>
            {asset.name}
          </Text>

          {/* 중앙: 섹터 + 마켓 */}
          <View className="mt-2 flex-row flex-wrap gap-1">
            <View className="bg-primary/10 rounded px-1.5 py-0.5">
              <Text className="text-primary text-xs">
                {sectorLabels[asset.sector] || asset.sector}
              </Text>
            </View>
            <View className="bg-muted rounded px-1.5 py-0.5">
              <Text className="text-muted-foreground text-xs">{asset.market}</Text>
            </View>
          </View>

          {/* 리스크 레벨 */}
          <View className="mt-2 flex-row items-center gap-1">
            <Text className="text-muted-foreground text-xs">리스크</Text>
            <Text className={`text-sm font-bold ${getRiskColor(asset.currentRiskLevel)}`}>
              {asset.currentRiskLevel}
            </Text>
          </View>

          {/* 하단: 영향 힌트 */}
          <View className="mt-auto">
            <Text className="text-primary text-center text-xs" numberOfLines={1}>
              {asset.impactHint}
            </Text>
          </View>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
});
