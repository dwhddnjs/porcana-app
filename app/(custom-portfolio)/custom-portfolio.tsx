import {
  View,
  useColorScheme,
  useWindowDimensions,
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Star,
  TriangleAlert,
  Check,
} from 'lucide-react-native';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useGetAssetLibraryInfiniteQuery } from '@/lib/hooks/query/use-get-asset-library-infinite-query';
import { useCustomPortfolioStore } from '@/lib/hooks/zustand/use-custom-portfolio-store';
import { AssetLibraryItemTypes } from '@/lib/api/asset';
import { DropZone } from '@/components/custom-portfolio/drop-zone';
import { getRiskStarColor } from '@/lib/constant/function';
import { sectorLabels } from '@/lib/constant/variables';
import { THEME } from '@/lib/theme';

const logoBlack = require('@/assets/images/logo-black.png');
const logoWhite = require('@/assets/images/logo-white.png');

const CARD_WIDTH = 128;
const CARD_HEIGHT = 192;
const CARD_GAP = 28;

export default function CustomPortfolio() {
  const colorScheme = useColorScheme() ?? 'light';
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    portfolioName,
    setPortfolioName,
    selectedAssets,
    filters,
    quickMode,
    addAsset,
    removeAsset,
    clearAssets,
  } = useCustomPortfolioStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const isInitialRender = useRef(true);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // 드래그 상태 — 위치는 shared value로 UI 스레드에서 직접 처리
  const [draggingAsset, setDraggingAsset] = useState<AssetLibraryItemTypes | null>(null);
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);
  const isDragOverSV = useSharedValue(false);
  const dropZoneX = useSharedValue(0);
  const dropZoneY = useSharedValue(0);
  const dropZoneW = useSharedValue(0);
  const dropZoneH = useSharedValue(0);

  // 가로모드 고정
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
    }, [])
  );

  // 포커스 시 에셋 초기화
  useFocusEffect(
    useCallback(() => {
      clearAssets();
    }, [clearAssets])
  );

  // Infinite query
  const queryFilters = useMemo(
    () => ({
      query: debouncedQuery || undefined,
      market: filters.market,
      type: filters.type,
      sectors: filters.sectors.length > 0 ? filters.sectors : undefined,
      riskLevels: filters.riskLevels.length > 0 ? filters.riskLevels : undefined,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
    }),
    [debouncedQuery, filters]
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetAssetLibraryInfiniteQuery(queryFilters);

  const assets = useMemo(() => data?.pages.flatMap((page) => page.assets) ?? [], [data]);

  const selectedAssetIds = useMemo(
    () => new Set(selectedAssets.map((a) => a.assetId)),
    [selectedAssets]
  );

  const isMaxReached = selectedAssets.length >= 10;
  const numColumns = 3;

  // 첫 진입 시 플립 애니메이션 — 초기 카드 렌더 후 비활성화
  useEffect(() => {
    if (assets.length > 0 && isInitialRender.current) {
      const timer = setTimeout(() => {
        isInitialRender.current = false;
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [assets.length]);

  // 검색 디바운스
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 300);
  };

  const handleBack = () => {
    router.back();
  };

  const handleOpenFilter = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleRemoveAsset = useCallback(
    (assetId: string) => {
      removeAsset(assetId);
    },
    [removeAsset]
  );

  const handleDropZoneLayout = useCallback(
    (event: LayoutChangeEvent) => {
      event.target.measureInWindow((x, y, width, height) => {
        dropZoneX.value = x;
        dropZoneY.value = y;
        dropZoneW.value = width;
        dropZoneH.value = height;
      });
    },
    [dropZoneX, dropZoneY, dropZoneW, dropZoneH]
  );

  // 드래그 핸들러 — start/end만 JS 스레드, move는 UI 스레드
  const handleDragStart = useCallback((asset: AssetLibraryItemTypes) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDraggingAsset(asset);
  }, []);

  const handleDragEnd = useCallback(
    (dropped: boolean) => {
      if (dropped && draggingAsset) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addAsset(draggingAsset);
      }
      setDraggingAsset(null);
    },
    [draggingAsset, addAsset]
  );

  // 탭으로 에셋 추가/제거 (퀵모드에서만 동작)
  const handleTapAsset = useCallback(
    (asset: AssetLibraryItemTypes) => {
      if (!quickMode) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (selectedAssetIds.has(asset.assetId)) {
        removeAsset(asset.assetId);
      } else {
        addAsset(asset);
      }
    },
    [quickMode, selectedAssetIds, addAsset, removeAsset]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ghostAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: ghostX.value,
    top: ghostY.value,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    opacity: ghostOpacity.value,
    zIndex: 9999,
  }));

  const renderAssetCard = useCallback(
    ({ item, index }: { item: AssetLibraryItemTypes; index: number }) => {
      const isSelected = selectedAssetIds.has(item.assetId);
      const disabled = isMaxReached && !isSelected;
      const flipDelay = isInitialRender.current ? index * 80 : undefined;
      return (
        <View style={{ alignItems: 'center', paddingBottom: CARD_GAP }}>
          <DraggableAssetCard
            asset={item}
            isSelected={isSelected}
            disabled={disabled}
            quickMode={quickMode}
            ghostX={ghostX}
            ghostY={ghostY}
            ghostOpacity={ghostOpacity}
            isDragOverSV={isDragOverSV}
            dropZoneX={dropZoneX}
            dropZoneY={dropZoneY}
            dropZoneW={dropZoneW}
            dropZoneH={dropZoneH}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTap={handleTapAsset}
            flipDelay={flipDelay}
            colorScheme={colorScheme}
          />
        </View>
      );
    },
    [
      selectedAssetIds,
      isMaxReached,
      quickMode,
      ghostX,
      ghostY,
      ghostOpacity,
      isDragOverSV,
      dropZoneX,
      dropZoneY,
      dropZoneW,
      dropZoneH,
      handleDragStart,
      handleDragEnd,
      handleTapAsset,
      colorScheme,
    ]
  );

  const keyExtractor = useCallback((item: AssetLibraryItemTypes) => item.assetId, []);

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
      {/* 상단바 */}
      <View className="border-border flex-row items-center gap-3  pt-3 pr-4 pb-2 pl-3">
        <Pressable onPress={handleBack} className="p-1">
          <Icon as={ChevronLeft} size={24} className="text-primary" />
        </Pressable>

        <View className="bg-muted border-muted flex-1 flex-row items-center rounded-full border-2 pl-3">
          <Icon as={Search} size={20} className="text-primary mr-2" />
          <Input
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="자산 종목 검색"
            className="native:h-10 dark:bg-background ml-2 flex-1 rounded-full border-0 bg-transparent p-0 pl-3 text-sm"
          />
        </View>

        <Pressable onPress={handleOpenFilter} className="p-1">
          <Icon as={SlidersHorizontal} size={24} className="text-primary" />
        </Pressable>

        <Pressable
          onPress={handleBack}
          className="bg-primary h-8 w-8 items-center justify-center rounded-full">
          <Icon as={Check} size={20} className="text-primary-foreground" />
        </Pressable>
       
      </View>

      {/* 메인 영역: 7:3 */}
      <View className="flex-1 flex-row">
        {/* 좌측: 에셋 그리드 */}
        <View style={{ flex: 7, overflow: 'hidden' }} className="px-3">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={THEME[colorScheme].mutedForeground} />
            </View>
          ) : (
            <FlashList
              data={assets}
              renderItem={renderAssetCard}
              keyExtractor={keyExtractor}
              numColumns={numColumns}
              contentContainerStyle={{ paddingTop: 8 }}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="items-center py-4">
                    <ActivityIndicator color={THEME[colorScheme].mutedForeground} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center pt-20">
                  <Text className="text-muted-foreground text-base">검색 결과가 없습니다</Text>
                </View>
              }
            />
          )}
        </View>

        {/* 우측: 이름 입력 + 드롭존 */}
        <View style={{ flex: 3 }} className="gap-2 pt-1 py-3 ">
          <Input
            value={portfolioName}
            onChangeText={setPortfolioName}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
            placeholder="포트폴리오 이름"
            className={`native:h-9 border-border rounded-lg border text-sm ${!isNameFocused && portfolioName ? 'bg-card dark:bg-card' : 'bg-background dark:bg-background'}`}
          />
          <DropZone
            selectedAssets={selectedAssets}
            onRemoveAsset={handleRemoveAsset}
            isDragOverSV={isDragOverSV}
            onLayout={handleDropZoneLayout}
          />
        </View>
      </View>

      {/* 드래그 고스트 카드 */}
      <Animated.View style={ghostAnimatedStyle} pointerEvents="none">
        {draggingAsset && <GhostCard asset={draggingAsset} colorScheme={colorScheme} />}
      </Animated.View>
    </View>
  );
}

// 드래그 가능한 에셋 카드 (FlatList 아이템용)
interface DraggableAssetCardProps {
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

const DraggableAssetCard = ({
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
}: DraggableAssetCardProps) => {
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

// 고스트 카드 (드래그 중 표시)
const GhostCard = ({
  asset,
  colorScheme,
}: {
  asset: AssetLibraryItemTypes;
  colorScheme: 'light' | 'dark';
}) => {
  return (
    <View className="bg-card border-primary h-full w-full rounded-xl border-[1.5px] px-[11px] py-[7px] opacity-80 shadow-xl shadow-black/40">
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
  );
};
