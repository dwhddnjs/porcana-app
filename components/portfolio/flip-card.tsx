import { Pressable, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useEffect, useState } from "react";

interface FlipCardProps {
  index: number;
  onSelect: () => void;
  isFlipped: boolean;
  cardNumber: number;
  disabled?: boolean;
  isSelected?: boolean;
  /** 카드 너비 (기본값: 128) */
  width?: number;
  /** 카드 높이 (기본값: 192) */
  height?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FlipCard({
  index,
  onSelect,
  isFlipped,
  cardNumber,
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
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: scale.value },
      ],
      backfaceVisibility: "hidden",
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [180, 360]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: scale.value },
      ],
      backfaceVisibility: "hidden",
    };
  });

  return (
    <AnimatedPressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !isFlipped}
      style={{ width, height, position: "relative" }}
    >
      {/* 카드 뒷면 (처음 보이는 면) */}
      <Animated.View
        style={frontAnimatedStyle}
        className="absolute h-full w-full items-center justify-center rounded-xl bg-card shadow-lg"
      >
        <View className="h-full w-full items-center justify-center rounded-xl border-4 border-primary p-2">
          <Text className="text-2xl font-bold text-primary">?</Text>
          <View className="absolute bottom-2 left-2 right-2 top-2 rounded-lg border border-primary opacity-30" />
        </View>
      </Animated.View>

      {/* 카드 앞면 (뒤집히면 보이는 면) */}
      <Animated.View
        style={backAnimatedStyle}
        className="absolute h-full w-full items-center justify-center rounded-xl bg-primary shadow-lg"
      >
        <View className="h-full w-full items-center justify-center rounded-xl border-2 border-primary p-2">
          <Text className="text-4xl font-bold text-background">
            {cardNumber}
          </Text>
          <Text className="mt-2 text-sm text-background">선택하세요</Text>
          <View className="absolute bottom-2 left-2 right-2 top-2 rounded-lg border border-background opacity-50" />
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}
