import { View } from 'react-native';
import { useEffect } from 'react';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { Icon } from '@/components/ui/icon';
import { Star, TriangleAlert, Check } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { AssetLibraryItemTypes } from '@/lib/api/asset';
import { getRiskStarColor } from '@/lib/constant/function';
import { sectorLabels } from '@/lib/constant/variables';

const logoBlack = require('@/assets/images/logo-black.png');
const logoWhite = require('@/assets/images/logo-white.png');

export const CARD_WIDTH = 128;
export const CARD_HEIGHT = 192;
export const CARD_GAP = 24;

interface DraggableAssetCardPropsTypes {
  asset: AssetLibraryItemTypes;
  isSelected: boolean;
  quickMode: boolean;
  ghostX: SharedValue<number>;
  ghostY: SharedValue<number>;
  ghostOpacity: SharedValue<number>;
  isDragOverSV: SharedValue<boolean>;
  dropZoneX: SharedValue<number>;
  dropZoneY: SharedValue<number>;
  dropZoneW: SharedValue<number>;
  dropZoneH: SharedValue<number>;
  onDragStart: (asset: AssetLibraryItemTypes) => void;
  onDragEnd: (dropped: boolean) => void;
  onTap: (asset: AssetLibraryItemTypes) => void;
  disabled?: boolean;
  flipDelay?: number;
  colorScheme: 'light' | 'dark';
}

export const DraggableAssetCard = ({
  asset,
  isSelected,
  disabled = false,
  quickMode,
  ghostX,
  ghostY,
  ghostOpacity,
  isDragOverSV,
  dropZoneX,
  dropZoneY,
  dropZoneW,
  dropZoneH,
  onDragStart,
  onDragEnd,
  onTap,
  flipDelay,
  colorScheme,
}: DraggableAssetCardPropsTypes) => {
  const scale = useSharedValue(1);
  const isDragActive = useSharedValue(false);
  const flipProgress = useSharedValue(flipDelay !== undefined ? 0 : 1);

  useEffect(() => {
    if (flipDelay !== undefined) {
      const timer = setTimeout(() => {
        flipProgress.value = withTiming(1, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        });
      }, flipDelay);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = () => onTap(asset);
  const handleStart = () => onDragStart(asset);
  const handleEnd = (dropped: boolean) => onDragEnd(dropped);

  // 150ms 롱프레스로 드래그 모드 진입 — ghost 카드 즉시 표시
  const longPress = Gesture.LongPress()
    .enabled(!quickMode && !disabled)
    .minDuration(150)
    .onStart((e) => {
      'worklet';
      isDragActive.value = true;
      scale.value = withSpring(0.9, { damping: 15, stiffness: 800 });
      ghostX.value = e.absoluteX - CARD_WIDTH / 2;
      ghostY.value = e.absoluteY - CARD_HEIGHT / 2;
      ghostOpacity.value = withSpring(1);
      runOnJS(handleStart)();
    });

  // 롱프레스 후 자유 Pan — 상하좌우 제한 없음
  const pan = Gesture.Pan()
    .enabled(!quickMode && !disabled)
    .manualActivation(true)
    .onTouchesMove((_e, state) => {
      'worklet';
      if (isDragActive.value) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((e) => {
      'worklet';
      ghostX.value = e.absoluteX - CARD_WIDTH / 2;
      ghostY.value = e.absoluteY - CARD_HEIGHT / 2;
      const isOver =
        e.absoluteX >= dropZoneX.value &&
        e.absoluteX <= dropZoneX.value + dropZoneW.value &&
        e.absoluteY >= dropZoneY.value &&
        e.absoluteY <= dropZoneY.value + dropZoneH.value;
      isDragOverSV.value = isOver;
    })
    .onEnd((e) => {
      'worklet';
      isDragActive.value = false;
      scale.value = withSpring(1, { damping: 15, stiffness: 800 });
      ghostOpacity.value = withSpring(0);
      isDragOverSV.value = false;
      const dropped =
        e.absoluteX >= dropZoneX.value &&
        e.absoluteX <= dropZoneX.value + dropZoneW.value &&
        e.absoluteY >= dropZoneY.value &&
        e.absoluteY <= dropZoneY.value + dropZoneH.value;
      runOnJS(handleEnd)(dropped);
    })
    .onFinalize(() => {
      'worklet';
      isDragActive.value = false;
      scale.value = withSpring(1, { damping: 15, stiffness: 800 });
      ghostOpacity.value = withSpring(0);
      isDragOverSV.value = false;
    });

  const tap = Gesture.Tap().enabled(!disabled).onEnd(() => {
    runOnJS(handleTap)();
  });

  const dragGesture = Gesture.Simultaneous(longPress, pan);
  const gesture = Gesture.Exclusive(dragGesture, tap);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const frontFaceStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
  }));

  const backFaceStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width: CARD_WIDTH, height: CARD_HEIGHT }, scaleStyle]}>
        {/* 카드 뒷면 */}
        <Animated.View
          style={[
            { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT },
            backFaceStyle,
          ]}
          className="bg-card items-center justify-center rounded-xl shadow-lg shadow-black/25">
          <View className="border-primary h-full w-full items-center justify-center rounded-xl border-4 p-2">
            <Image
              source={colorScheme === 'dark' ? logoWhite : logoBlack}
              className="h-12 w-12"
              contentFit="contain"
            />
            <View className="border-primary absolute top-2 right-2 bottom-2 left-2 rounded-lg border opacity-30" />
          </View>
        </Animated.View>

        {/* 카드 앞면 */}
        <Animated.View
          style={[
            { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT },
            frontFaceStyle,
          ]}>
          <View
            className={`bg-card border-primary h-full w-full rounded-xl border px-[11px] py-[7px] shadow-lg shadow-black/25 ${disabled ? 'opacity-40' : isSelected ? 'opacity-50' : ''}`}>
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
                  {asset.symbol}
                </Text>
              </View>
            </View>

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
                  <View className="border-primary/10 rounded border-2 px-1.5 py-0.5">
                    <Text className="text-muted-foreground text-xs font-semibold">
                      {asset.market}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View className="flex-1" />

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
                    color={getRiskStarColor(asset.currentRiskLevel, colorScheme)}
                    fill={
                      i < asset.currentRiskLevel
                        ? getRiskStarColor(asset.currentRiskLevel, colorScheme)
                        : 'transparent'
                    }
                  />
                ))}
              </View>
            </View>
          </View>

          {isSelected && (
            <View className="bg-background/60 absolute inset-0 items-center justify-center rounded-xl">
              <View className="bg-primary h-8 w-8 items-center justify-center rounded-full">
                <Icon as={Check} size={18} className="text-primary-foreground" />
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};
