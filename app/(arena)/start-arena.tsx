import { View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { FlipCard } from '@/components/portfolio/flip-card';
import { useState, useEffect, useCallback } from 'react';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import * as ScreenOrientation from 'expo-screen-orientation';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/button';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useGetArenaSessionRoundsQuery } from '@/lib/hooks/query/arena';
import { usePickArenaSessionAssetMutation } from '@/lib/hooks/mutation/arena';
import { useArenaStore, Asset } from '@/lib/hooks/zustand/use-arena-store';

const MAX_ROUNDS = 10;

export default function CreatePortfolio() {
  const { height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation();
  const { sessionId, selectedCards, addCard, clearCards } = useArenaStore();

  const [round, setRound] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showCards, setShowCards] = useState(true);
  const [hasInitialFlip, setHasInitialFlip] = useState(false);

  const { data: arenaSessionRounds, refetch, isLoading } = useGetArenaSessionRoundsQuery();
  const { mutate: pickAsset } = usePickArenaSessionAssetMutation();

  // 서버에서 받아온 assets (3장)
  const currentAssets: Asset[] = arenaSessionRounds?.assets || [];

  const openDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  // 화면 높이 기준으로 카드 크기 계산 (가로모드)
  // 상단 제목(~60px) + 하단 라운드 표시(~80px) 제외
  const availableHeight = screenHeight - 40;
  const cardHeight = Math.min(availableHeight * 0.75, 240); // 최대 240px 제한
  const cardWidth = cardHeight * (2 / 3); // 2:3 비율 유지

  // 화면 진입 시 가로모드로 고정, 떠날 때 원래대로 복원
  useFocusEffect(
    useCallback(() => {
      // 가로모드로 고정
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

      // cleanup: 화면 떠날 때 기본 방향으로 복원
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
    }, [])
  );

  // 화면 진입 시 초기화
  useEffect(() => {
    clearCards();
    setHasInitialFlip(false);
    setRound(1);
    setIsFlipped(false);
  }, []);

  // 첫 로드 시에만 카드 뒤집기 (이후 라운드는 handleCardSelect에서 처리)
  useEffect(() => {
    if (!hasInitialFlip && currentAssets.length > 0) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
        setHasInitialFlip(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentAssets.length, hasInitialFlip]);

  const handleCardSelect = useCallback(
    (cardIndex: number) => {
      if (round > MAX_ROUNDS || isTransitioning || currentAssets.length === 0) return;

      const selectedAsset = currentAssets[cardIndex];

      addCard(selectedAsset);
      setSelectedCardIndex(cardIndex);
      setIsTransitioning(true);

      // 서버에 선택 전송
      pickAsset(
        { sessionId, pickedAssetId: selectedAsset.assetId },
        {
          onSuccess: async () => {
            // 1초 동안 선택된 카드가 커진 상태 유지
            setTimeout(async () => {
              setShowCards(false);
              setSelectedCardIndex(null);

              if (round < MAX_ROUNDS) {
                // 새 데이터를 먼저 fetch
                await refetch();

                // 데이터 로드 후 카드 표시
                setTimeout(() => {
                  setRound((prev) => prev + 1);
                  setIsFlipped(false);
                  setShowCards(true);

                  // 새 카드가 나타난 후 뒤집기
                  setTimeout(() => {
                    setIsFlipped(true);
                    setIsTransitioning(false);
                  }, 300);
                }, 100);
              } else {
                // 10라운드 완료 - 세로 모드로 전환 후 완료 페이지로 이동
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                router.replace('/(arena)/complete');
              }
            }, 1000);
          },
          onError: (error) => {
            console.error('Asset pick failed:', error);
            setIsTransitioning(false);
            setSelectedCardIndex(null);
          },
        }
      );
    },
    [round, currentAssets, isTransitioning, sessionId, pickAsset, addCard, refetch]
  );

  return (
    <View className="bg-background flex-1">
      <View className="items-center justify-center pt-[20px]">
        <Text className="text-primary text-2xl font-bold">포트폴리오 생성</Text>
      </View>

      {/* 카드 영역 */}
      <View className="flex-1 items-center justify-center">
        {isLoading ? (
          <Text className="text-muted-foreground">로딩 중...</Text>
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
        <View className="items-center justify-center">
          <Text className="text-muted-foreground text-xl font-semibold">
            {round} / {MAX_ROUNDS}
          </Text>
          <Text className="text-md text-muted-foreground">라운드</Text>
        </View>
        <Button onPress={openDrawer}>
          <Text>덱 보기</Text>
        </Button>
      </View>
    </View>
  );
}
