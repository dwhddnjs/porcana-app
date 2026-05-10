import Animated, { FadeInDown } from 'react-native-reanimated';

type AnimatedListItemPropsTypes = {
  index: number;
  children: React.ReactNode;
};

export const AnimatedListItem = ({ index, children }: AnimatedListItemPropsTypes) => (
  <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>{children}</Animated.View>
);
