import { View, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { FlipCard } from "@/components/portfolio/flip-card";
import { useState, useEffect, useCallback } from "react";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import * as ScreenOrientation from "expo-screen-orientation";
import { router, useFocusEffect } from "expo-router";
import { Button } from "@/components/ui/button";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useSelectedCardsStore } from "@/lib/hooks/zustand/use-selected-cards-store";

const MAX_SELECTIONS = 20;

export default function CreatePortfolio() {
  const { height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation();
  const { selectedCards, setSelectedCards } = useSelectedCardsStore();
  
  const [round, setRound] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCards, setCurrentCards] = useState<number[]>([1, 2, 3]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const [showCards, setShowCards] = useState(true);
  
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
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );

      // cleanup: 화면 떠날 때 기본 방향으로 복원
      return () => {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      };
    }, [])
  );

  // 화면 진입 시 카드 뒤집기
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipped(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const generateNewCards = useCallback(() => {
    // 랜덤 카드 번호 생성 (1-100 사이)
    const cards = Array.from(
      { length: 3 },
      () => Math.floor(Math.random() * 100) + 1
    );
    return cards;
  }, []);

  const handleCardSelect = useCallback(
    (cardIndex: number) => {
      if (selectedCards.length >= MAX_SELECTIONS || isTransitioning) return;

      const selectedValue = currentCards[cardIndex];
      setSelectedCards((prev: number[]) => [...prev, selectedValue]);
      setSelectedCardIndex(cardIndex);
      setIsTransitioning(true);

      // 1초 동안 선택된 카드가 커진 상태 유지 후 새 카드 표시
      setTimeout(() => {
        setShowCards(false);
        setSelectedCardIndex(null);

        // 카드가 사라진 후 새 카드 생성 및 표시
        setTimeout(() => {
          if (selectedCards.length + 1 < MAX_SELECTIONS) {
            setCurrentCards(generateNewCards());
            setRound((prev) => prev + 1);
            setIsFlipped(false);
            setShowCards(true);

            // 새 카드가 나타난 후 뒤집기
            setTimeout(() => {
              setIsFlipped(true);
              setIsTransitioning(false);
            }, 300);
          } else {
            setIsTransitioning(false);
          }
        }, 300);
      }, 1000);
    },
    [selectedCards, currentCards, generateNewCards, isTransitioning]
  );

  const isComplete = selectedCards.length >= MAX_SELECTIONS;

  return (
    
    <View className="flex-1 bg-background ]">
      <View className="items-center justify-center pt-[20px]">
        <Text className="text-2xl font-bold text-primary">
          포트폴리오 생성
        </Text>
      </View>

      {/* 카드 영역 */}
      <View className="flex-1 items-center justify-center ">
        {!isComplete ? (
          showCards && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              layout={Layout.springify()}
              className="flex-row gap-[48px]"
            >
              {currentCards.map((cardNumber, index) => (
                <FlipCard
                  key={`${round}-${index}`}
                  index={index}
                  cardNumber={cardNumber}
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
        ) : (
          <Animated.View
            entering={FadeIn.duration(500)}
            className="items-center px-8"
          >
            <Text className="text-3xl font-bold text-indigo-600">
              🎉 완료!
            </Text>
            <Text className="mt-4 text-center text-lg text-gray-600">
              {MAX_SELECTIONS}개의 카드를 모두 선택했습니다
            </Text>
            <Button onPress={() => router.replace("/(tabs)/(portfolio)")}>
              <Text>
                메인으로 가기
              </Text>
            </Button>
          </Animated.View>
        )}
      </View>
      <View className="pb-[20px] items-center justify-center flex-row gap-[18px]">
        <View className="items-center justify-center">
        <Text className="text-xl font-semibold text-muted-foreground">
          {round} / {MAX_SELECTIONS}
        </Text>
        <Text className="text-md text-muted-foreground">
          카드
        </Text>
        </View>
        <Button onPress={openDrawer}>
          <Text>
            덱 보기
          </Text>
        </Button>
      </View>
    </View>
  );
}
