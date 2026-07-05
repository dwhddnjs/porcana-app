import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

/**
 * 타이틀 → 입력 영역 순으로 페이드 인 되는 애니메이션 스타일을 제공하는 훅.
 * 금액 입력 화면(시뮬레이션/입금)에서 공통으로 사용합니다.
 */
export const useFadeInSequence = () => {
  const titleOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 400 });
    inputOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const inputAnimatedStyle = useAnimatedStyle(() => ({ opacity: inputOpacity.value }));

  return { titleAnimatedStyle, inputAnimatedStyle };
};
