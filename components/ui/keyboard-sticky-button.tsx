import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Platform, Pressable, ViewStyle, StyleProp } from 'react-native';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { buttonTextVariants, buttonVariants, ButtonProps } from './button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type KeyboardStickyButtonProps = ButtonProps & {
  containerStyle?: StyleProp<ViewStyle>;
};

export const KeyboardStickyButton = ({
  className,
  variant,
  size,
  containerStyle,
  children,
  ...props
}: KeyboardStickyButtonProps) => {
  const { height, progress } = useReanimatedKeyboardAnimation();
  const insets = useSafeAreaInsets();

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const paddingHorizontal = interpolate(
      progress.value,
      [0, 1],
      [20, 0],
      Extrapolation.CLAMP
    );

    // 키보드가 열리면 bottom을 0으로, 닫히면 insets.bottom으로
    const bottomValue = interpolate(
      progress.value,
      [0, 1],
      [insets.bottom, 0],
      Extrapolation.CLAMP
    );

    return {
      paddingHorizontal,
      paddingBottom: Platform.OS === 'ios' ? 0 : insets.bottom,
      bottom: bottomValue,
      transform: [{ translateY: height.value }],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      progress.value,
      [0, 1],
      [8, 0],
      Extrapolation.CLAMP
    );

    return {
      borderRadius,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
        },
        containerAnimatedStyle,
        containerStyle,
      ]}
    >
      <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
        <AnimatedPressable
          className={cn(
            props.disabled && 'opacity-50',
            buttonVariants({ variant, size }),
            className
          )}
          style={buttonAnimatedStyle}
          role="button"
          {...props}
        >
          {children}
        </AnimatedPressable>
      </TextClassContext.Provider>
    </Animated.View>
  );
};
