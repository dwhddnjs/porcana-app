import { useCallback, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const THUMB_SIZE = 20;
const TRACK_HEIGHT = 4;

interface CustomSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const CustomSlider = ({ value, onValueChange, min = 0, max = 100 }: CustomSliderProps) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const startX = useSharedValue(0);

  const clampedValue = Math.min(Math.max(value, min), max);
  const ratio = trackWidth > 0 ? (clampedValue - min) / (max - min) : 0;
  const thumbPosition = ratio * trackWidth;

  const handleValueChange = useCallback(
    (newValue: number) => {
      onValueChange(newValue);
    },
    [onValueChange]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width - THUMB_SIZE);
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startX.value = thumbPosition;
    })
    .onUpdate((e) => {
      'worklet';
      const newX = Math.min(Math.max(startX.value + e.translationX, 0), trackWidth);
      const newRatio = trackWidth > 0 ? newX / trackWidth : 0;
      const newValue = Math.round(newRatio * (max - min) + min);
      runOnJS(handleValueChange)(newValue);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbPosition }],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    width: thumbPosition + THUMB_SIZE / 2,
  }));

  return (
    <View
      onLayout={handleLayout}
      className="justify-center"
      style={{ height: THUMB_SIZE, paddingHorizontal: THUMB_SIZE / 2 }}>
      {/* 트랙 배경 */}
      <View
        className="bg-muted absolute rounded-full"
        style={{
          height: TRACK_HEIGHT,
          left: THUMB_SIZE / 2,
          right: THUMB_SIZE / 2,
        }}
      />

      {/* 활성 트랙 */}
      <Animated.View
        className="bg-success absolute rounded-full"
        style={[
          {
            height: TRACK_HEIGHT,
            left: THUMB_SIZE / 2,
          },
          activeTrackStyle,
        ]}
      />

      {/* 썸 */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              position: 'absolute',
              left: 0,
            },
            thumbStyle,
          ]}
          className="bg-success shadow-sm shadow-black/25"
        />
      </GestureDetector>
    </View>
  );
};
