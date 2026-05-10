import {
  ActivityIndicator,
  Platform,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { FlipCard } from '@/components/portfolio/flip-card';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import * as ScreenOrientation from 'expo-screen-orientation';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/button';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useRecommendArenaCardsQuery } from '@/lib/hooks/query/arena';
import { useArenaStore, AssetTypes } from '@/lib/hooks/zustand/use-arena-store';
import { THEME } from '@/lib/theme';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { recommendArenaCards } from '@/lib/api/arena';

const MAX_ROUNDS = 10;

export default function Arena() {
  const colorScheme = useColorScheme() ?? 'light';
  const { height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation();
  const { selectedCards, addCard, addShown, clearCards, resetArena } = useArenaStore();
  const picked = useArenaStore((state) => state.picked);
  const shownAssetIds = useArenaStore((state) => state.shownAssetIds);
  const queryClient = useQueryClient();

  const [round, setRound] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showCards, setShowCards] = useState(true);
  const [hasInitialFlip, setHasInitialFlip] = useState(false);

  // 타이머 정리를 위한 ref (React Native에서는 setTimeout이 number 반환)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const waitingForNewCardsRef = useRef(false);

  const { data: recommendedAssets, refetch, isLoading, isPending } = useRecommendArenaCardsQuery();

  // 추천된 assets (3장) - useMemo로 불필요한 재생성 방지
  const currentAssets: AssetTypes[] = useMemo(
    () => recommendedAssets ?? [],
    [recommendedAssets]
  );

  // 타이머 정리 함수
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const openDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleBack = useCallback(async () => {
    clearAllTimers();
    resetArena();
    queryClient.removeQueries({ queryKey: ['arena-recommend'] });
    setHasInitialFlip(false);
    setRound(1);
    setIsFlipped(false);
    setShowCards(true);
    setIsTransitioning(false);
    setSelectedCardIndex(null);

    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    router.back();
  }, [clearAllTimers, resetArena, queryClient, router]);

  // 화면 높이 기준으로 카드 크기 계산 (가로모드)
  // 상단 제목(~60px) + 하단 라운드 표시(~80px) 제외
  // Android는 시스템 네비게이션 바로 가용 높이가 더 작음
  const heightOffset = Platform.OS === 'android' ? 60 : 40;
  const maxCardHeight = Platform.OS === 'android' ? 220 : 240;
  const availableHeight = screenHeight - heightOffset;
  const cardHeight = Math.min(availableHeight * 0.72, maxCardHeight);
  const cardWidth = cardHeight * (2 / 3); // 2:3 비율 유지

  // 화면 진입 시 가로모드로 고정 + 상태 초기화
  // cleanup에서 orientation 복원하지 않음 (handleBack, complete 이동 시 명시적으로 처리)
  useFocusEffect(
    useCallback(() => {
      // ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      clearAllTimers();
      clearCards();
      setHasInitialFlip(false);
      setRound(1);
      setIsFlipped(false);
      setShowCards(true);
      setIsTransitioning(false);
      setSelectedCardIndex(null);
      refetch();
    }, [clearAllTimers, clearCards, refetch])
  );

  // 첫 로드 시에만 카드 뒤집기 (이후 라운드는 handleCardSelect에서 처리)
  useEffect(() => {
    if (!hasInitialFlip && currentAssets.length > 0) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
        setHasInitialFlip(true);
      }, 500);
      timersRef.current.push(timer);
      return () => clearTimeout(timer);
    }
  }, [currentAssets.length, hasInitialFlip]);

  // 추천된 카드들을 shownAssetIds에 누적 → 같은 라운드에 보여진 3장 모두 다음에 제외
  useEffect(() => {
    if (recommendedAssets && recommendedAssets.length > 0) {
      addShown(recommendedAssets.map((a) => a.assetId));
    }
  }, [recommendedAssets, addShown]);

  // 새 라운드 카드 데이터 도착 감지: recommendedAssets 참조가 바뀔 때 반응
  // length 기반이 아닌 참조 기반으로 감지 → prefetch 캐시 히트(3→3) 상황도 정확히 처리
  useEffect(() => {
    if (!waitingForNewCardsRef.current || !recommendedAssets || recommendedAssets.length === 0) return;
    waitingForNewCardsRef.current = false;
    setRound((prev) => prev + 1);
    setShowCards(true);
    const timer = setTimeout(() => {
      setIsFlipped(true);
      setIsTransitioning(false);
    }, 500);
    timersRef.current.push(timer);
  }, [recommendedAssets]);

  const handleCardSelect = useCallback(
    (cardIndex: number) => {
      if (round > MAX_ROUNDS || isTransitioning || currentAssets.length === 0) return;

      const selectedAsset = currentAssets[cardIndex];

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedCardIndex(cardIndex);
      setIsTransitioning(true);

      // 선택 즉시 다음 라운드 카드 prefetch (1초 확대 애니메이션 동안 데이터 준비)
      if (picked && round < MAX_ROUNDS) {
        const nextExcludeIds = [...shownAssetIds, selectedAsset.assetId];
        queryClient.prefetchQuery({
          queryKey: ['arena-recommend', picked.riskProfile, picked.sectors, selectedCards.length + 1],
          queryFn: () => recommendArenaCards({
            riskProfile: picked.riskProfile,
            sectors: picked.sectors,
            excludeIds: nextExcludeIds,
          }),
          staleTime: Infinity,
        });
      }

      // 1단계: 1초 동안 선택된 카드 확대 표시
      const timer1 = setTimeout(() => {
        // 2단계: 카드 뒤집기 복원 + 페이드 아웃
        setIsFlipped(false);
        setShowCards(false);
        setSelectedCardIndex(null);

        // 3단계: 카드가 사라진 후 addCard → query 자동 refetch, 데이터 도착 시 useEffect가 카드 표시
        const timer2 = setTimeout(() => {
          if (round >= MAX_ROUNDS) {
            addCard(selectedAsset);
            clearAllTimers();
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).then(
              () => {
                router.replace('/(arena)/complete');
              }
            );
            return;
          }

          waitingForNewCardsRef.current = true;
          addCard(selectedAsset);
        }, 350);
        timersRef.current.push(timer2);
      }, 1000);
      timersRef.current.push(timer1);
    },
    [round, currentAssets, isTransitioning, addCard, clearAllTimers]
  );

  return (
    <View className="bg-background flex-1">
      <View className="items-center justify-center pt-[20px]">
        <Text className="text-primary text-xl font-bold">포트폴리오 생성</Text>
      </View>

      {/* 카드 영역 */}
      <View className="flex-1 items-center justify-center">
        {(isLoading || isPending) && !isTransitioning ? (
          <ActivityIndicator size="large" color={THEME[colorScheme].mutedForeground} />
        ) : (
          showCards &&
          currentAssets.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              layout={Layout.springify()}
              className="flex-row gap-[48px]">
              {currentAssets.map((asset, index) => (
                <FlipCard
                  key={`${round}-${asset.assetId}`}
                  index={index}
                  asset={asset}
                  isFlipped={isFlipped}
                  onSelect={() => handleCardSelect(index)}
                  disabled={isTransitioning}
                  isSelected={selectedCardIndex === index}
                  width={cardWidth}
                  height={cardHeight}
                />
              ))}
            </Animated.View>
          )
        )}
      </View>
      <View className="flex-row items-center justify-center gap-[18px] pb-[20px]">
        <Button variant="outline" size="default" onPress={handleBack} className="shadow-none">
          <Text className="text-md">돌아가기</Text>
        </Button>
        <View className="items-center justify-center">
          <Text className="text-muted-foreground text-xl font-semibold">
            {round} / {MAX_ROUNDS}
          </Text>
          <Text className="text-md text-muted-foreground">라운드</Text>
        </View>

        <Button size="default" onPress={openDrawer}>
          <Text className="text-md">덱 보기</Text>
        </Button>
      </View>
    </View>
  );
}
