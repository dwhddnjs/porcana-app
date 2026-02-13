import { cn } from '@/lib/utils';
import { useCallback, useRef } from 'react';
import { Dimensions, FlatList, View, type ImageSourcePropType, type ViewToken } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CarouselItemDataTypes = {
  image: ImageSourcePropType;
  title: string;
  description: string;
};

type ImageCarouselPropsTypes = {
  items: CarouselItemDataTypes[];
  width?: number;
  imageHeight?: number;
  className?: string;
  dotClassName?: string;
  activeDotClassName?: string;
  imageClassName?: string;
};

type CarouselItemPropsTypes = {
  item: CarouselItemDataTypes;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  imageHeight: number;
  imageClassName?: string;
};

const CarouselItem = ({
  item,
  index,
  scrollX,
  width,
  imageHeight,
  imageClassName,
}: CarouselItemPropsTypes) => {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollX.value, inputRange, [20, 0, -20], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    return { transform: [{ translateY }], opacity };
  });

  const descriptionAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollX.value, inputRange, [30, 0, -30], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    return { transform: [{ translateY }], opacity };
  });

  return (
    <View style={{ width }}>
      <View className="mb-4 gap-y-2 px-5">
        <Animated.View style={titleAnimatedStyle}>
          <Text className="text-foreground text-2xl font-bold">{item.title}</Text>
        </Animated.View>
        <Animated.View style={descriptionAnimatedStyle}>
          <Text className="text-muted-foreground text-base leading-5">{item.description}</Text>
        </Animated.View>
      </View>
      <Animated.View
        style={[{ width, height: imageHeight }, imageAnimatedStyle]}
        className="items-center justify-center">
        <Image
          source={item.image}
          className={cn('h-full w-full', imageClassName)}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
};

type DotIndicatorProps = {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  dotClassName?: string;
  activeDotClassName?: string;
};

const DotIndicator = ({
  index,
  scrollX,
  width,
  dotClassName,
  activeDotClassName,
}: DotIndicatorProps) => {
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
      className={cn('bg-primary mx-1 h-2 rounded-full', dotClassName, activeDotClassName)}
    />
  );
};

export const ImageCarousel = ({
  items,
  width = SCREEN_WIDTH,
  imageHeight = 300,
  className,
  dotClassName,
  activeDotClassName,
  imageClassName,
}: ImageCarouselPropsTypes) => {
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

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: CarouselItemDataTypes; index: number }) => (
      <CarouselItem
        item={item}
        index={index}
        scrollX={scrollX}
        width={width}
        imageHeight={imageHeight}
        imageClassName={imageClassName}
      />
    ),
    [width, imageHeight, imageClassName]
  );

  const keyExtractor = useCallback(
    (_: CarouselItemDataTypes, index: number) => index.toString(),
    []
  );

  return (
    <View className={cn('items-center', className)}>
      <FlatList
        ref={flatListRef}
        data={items}
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
        {items.map((_, index) => (
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
