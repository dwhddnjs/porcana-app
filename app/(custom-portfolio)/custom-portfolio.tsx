import {
  View,
  FlatList,
  useColorScheme,
  useWindowDimensions,
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Search, SlidersHorizontal, Star, TriangleAlert, Check } from 'lucide-react-native';
import { useState, useCallback, useRef, useMemo } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import * as ScreenOrientation from 'expo-screen-orientation';
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

const CARD_WIDTH = 128;
const CARD_HEIGHT = 192;
const CARD_GAP = 12;

export default function CustomPortfolio() {
  const colorScheme = useColorScheme() ?? 'light';
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { selectedAssets, filters, quickMode, addAsset, removeAsset, clearAssets } =
    useCustomPortfolioStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

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

  // 좌측 영역의 70% 기준으로 numColumns 계산
  const leftAreaWidth = screenWidth * 0.7;
  const numColumns = Math.max(1, Math.floor((leftAreaWidth - CARD_GAP) / (CARD_WIDTH + CARD_GAP)));

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
  const handleDragStart = useCallback(
    (asset: AssetLibraryItemTypes) => {
      setDraggingAsset(asset);
    },
    []
  );

  const handleDragEnd = useCallback(
    (dropped: boolean) => {
      if (dropped && draggingAsset) {
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
    ({ item }: { item: AssetLibraryItemTypes }) => {
      const isSelected = selectedAssetIds.has(item.assetId);
      return (
        <DraggableAssetCard
          asset={item}
          isSelected={isSelected}
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
          colorScheme={colorScheme}
        />
      );
    },
    [selectedAssetIds, quickMode, ghostX, ghostY, ghostOpacity, isDragOverSV, dropZoneX, dropZoneY, dropZoneW, dropZoneH, handleDragStart, handleDragEnd, handleTapAsset, colorScheme]
  );

  const keyExtractor = useCallback((item: AssetLibraryItemTypes) => item.assetId, []);

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingLeft: insets.left }}>
      {/* 상단바 */}
      <View className="border-border flex-row items-center gap-3 border-b px-4 pb-2 pt-3">
        <Pressable onPress={handleBack} className="p-1">
          <Icon as={ArrowLeft} size={22} className="text-primary" />
        </Pressable>

        <View className="bg-muted flex-1 flex-row items-center rounded-lg px-3 py-1.5">
          <Icon as={Search} size={16} className="text-muted-foreground mr-2" />
          <Input
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="종목 검색"
            className="native:h-8 flex-1 border-0 bg-transparent p-0 text-sm"
          />
        </View>

        <Pressable onPress={handleOpenFilter} className="p-1">
          <Icon as={SlidersHorizontal} size={22} className="text-primary" />
        </Pressable>

        <Button size="sm" onPress={handleBack}>
          <Text className="text-sm font-bold">완료</Text>
        </Button>
      </View>

      {/* 메인 영역: 7:3 */}
      <View className="flex-1 flex-row">
        {/* 좌측: 에셋 그리드 */}
        <View style={{ flex: 7 }} className="p-3">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={THEME[colorScheme].mutedForeground} />
            </View>
          ) : (
            <FlatList
              data={assets}
              renderItem={renderAssetCard}
              keyExtractor={keyExtractor}
              numColumns={numColumns}
              key={`grid-${numColumns}`}
              contentContainerStyle={{ gap: CARD_GAP }}
              columnWrapperStyle={numColumns > 1 ? { gap: CARD_GAP } : undefined}
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

        {/* 우측: 드롭존 */}
        <View style={{ flex: 3 }} className="py-3 pr-3">
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
  colorScheme: 'light' | 'dark';
}

const DraggableAssetCard = ({
  asset,
  isSelected,
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
  colorScheme,
}: DraggableAssetCardProps) => {
  const scale = useSharedValue(1);
  const isDragActive = useSharedValue(false);

  const handleTap = () => onTap(asset);
  const handleStart = () => onDragStart(asset);
  const handleEnd = (dropped: boolean) => onDragEnd(dropped);

  // 150ms 롱프레스로 드래그 모드 진입 — ghost 카드 즉시 표시
  const longPress = Gesture.LongPress()
    .enabled(!quickMode)
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
    .enabled(!quickMode)
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

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(handleTap)();
  });

  const dragGesture = Gesture.Simultaneous(longPress, pan);
  const gesture = Gesture.Exclusive(dragGesture, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width: CARD_WIDTH, height: CARD_HEIGHT }, animatedStyle]}>
        <View
          className={`bg-card border-primary h-full w-full rounded-xl border-[1.5px] px-[11px] py-[7px] shadow-lg shadow-black/25 ${isSelected ? 'opacity-50' : ''}`}>
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
