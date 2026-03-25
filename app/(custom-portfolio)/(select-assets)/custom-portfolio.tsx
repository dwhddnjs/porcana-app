import {
  View,
  useColorScheme,
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, Search, SlidersHorizontal } from 'lucide-react-native';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useGetAssetLibraryInfiniteQuery } from '@/lib/hooks/query/use-get-asset-library-infinite-query';
import { useCustomPortfolioStore } from '@/lib/hooks/zustand/use-custom-portfolio-store';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { AssetLibraryItemTypes } from '@/lib/api/asset';
import { DropZone } from '@/components/custom-portfolio/drop-zone';
import {
  DraggableAssetCard,
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_GAP,
} from '@/components/custom-portfolio/draggable-asset-card';
import { GhostCard } from '@/components/custom-portfolio/ghost-card';
import { THEME } from '@/lib/theme';
import { toast } from 'sonner-native';

export default function CustomPortfolio() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    selectedAssets,
    filters,
    quickMode,
    skipNextClear,
    addAsset,
    removeAsset,
    clearAssets,
    setSkipNextClear,
  } = useCustomPortfolioStore();

  const { user } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const isInitialRender = useRef(true);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // 디바운스 타이머 클린업
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

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

  // 포커스 시 에셋 초기화 (디테일 화면에서 복귀 시 스킵)
  useFocusEffect(
    useCallback(() => {
      if (skipNextClear) {
        setSkipNextClear(false);
        return;
      }
      clearAssets();
    }, [skipNextClear, setSkipNextClear, clearAssets])
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
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 300);
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleComplete = () => {
    if (!user?.userId) {
      router.push('/login-sheet');
      return;
    }
    if (selectedAssets.length !== 10) {
      toast.error('종목을 10개 선택해주세요');
      return;
    }
    setSkipNextClear(true);
    router.push('/(custom-portfolio)/custom-portfolio-detail');
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
        if (isMaxReached) {
          toast.error('최대 10개까지 선택할 수 있습니다');
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          addAsset(draggingAsset);
        }
      }
      setDraggingAsset(null);
    },
    [draggingAsset, addAsset, isMaxReached]
  );

  // 탭으로 에셋 추가/제거 (퀵모드에서만 동작)
  const handleTapAsset = useCallback(
    (asset: AssetLibraryItemTypes) => {
      if (!quickMode) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (selectedAssetIds.has(asset.assetId)) {
        removeAsset(asset.assetId);
      } else if (isMaxReached) {
        toast.error('최대 10개까지 선택할 수 있습니다');
      } else {
        addAsset(asset);
      }
    },
    [quickMode, selectedAssetIds, addAsset, removeAsset, isMaxReached]
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

        <Button onPress={handleComplete} size="sm" className="bg-primary rounded-lg ">
          <Text className="text-primary-foreground text-sm font-semibold">다음</Text>
        </Button>
       
      </View>

      {/* 메인 영역: 6.5:4.5 */}
      <View className="flex-1 flex-row">
        {/* 좌측: 에셋 그리드 */}
        <View style={{ flex: 6.5, overflow: 'hidden' }} className="px-3">
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

        {/* 우측: 드롭존 */}
        <View style={{ flex: 3.5 }} className="pt-1 py-3">
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

