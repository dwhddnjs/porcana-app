import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";
import { Dimensions, FlatList, Image, View, type ImageSourcePropType, type ViewToken } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ImageCarouselProps = {
  images: ImageSourcePropType[];
  width?: number;
  height?: number;
  className?: string;
  dotClassName?: string;
  activeDotClassName?: string;
  imageClassName?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
};

type CarouselItemProps = {
  item: ImageSourcePropType;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  height: number;
  imageClassName?: string;
};

const CarouselItem = ({ item, index, scrollX, width, height, imageClassName }: CarouselItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolation.CLAMP);

    const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[{ width, height }, animatedStyle]} className="items-center justify-center">
      <Image
        source={item}
        className={cn("h-full w-full", imageClassName)}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

type DotIndicatorProps = {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  dotClassName?: string;
  activeDotClassName?: string;
};

const DotIndicator = ({ index, scrollX, width, dotClassName, activeDotClassName }: DotIndicatorProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);

    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);

    return {
      width: withSpring(dotWidth, { damping: 15, stiffness: 150 }),
      opacity: withSpring(opacity, { damping: 15, stiffness: 150 }),
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        "mx-1 h-2 rounded-full bg-primary",
        dotClassName,
        activeDotClassName
      )}
    />
  );
};

export const ImageCarousel = ({
  images,
  width = SCREEN_WIDTH,
  height = 300,
  className,
  dotClassName,
  activeDotClassName,
  imageClassName,
}: ImageCarouselProps) => {
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index ?? 0;
        scrollX.value = withSpring(index * width, { damping: 15, stiffness: 150 });
      }
    },
    [width]
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      scrollX.value = event.nativeEvent.contentOffset.x;
    },
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ImageSourcePropType; index: number }) => (
      <CarouselItem
        item={item}
        index={index}
        scrollX={scrollX}
        width={width}
        height={height}
        imageClassName={imageClassName}
      />
    ),
    [width, height, imageClassName]
  );

  const keyExtractor = useCallback((_: ImageSourcePropType, index: number) => index.toString(), []);

  return (
    <View className={cn("items-center", className)}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      <View className="mt-6 flex-row items-center justify-center">
        {images.map((_, index) => (
          <DotIndicator
            key={index}
            index={index}
            scrollX={scrollX}
            width={width}
            dotClassName={dotClassName}
            activeDotClassName={activeDotClassName}
          />
        ))}
      </View>
    </View>
  );
};
