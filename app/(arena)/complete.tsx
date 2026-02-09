import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { router } from 'expo-router';
import { useArenaStore } from '@/lib/hooks/zustand/use-arena-store';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Building2, CheckCircle, TrendingUp } from 'lucide-react-native';
import Container from '@/components/container';
import { Image } from '@/components/ui/image';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function ArenaComplete() {
  const { name, selectedCards, resetArena } = useArenaStore();
  const { user, accessToken, refreshToken, reset } = useUserStore();
  const queryClient = useQueryClient();

  const handleOpenLoginSheet = () => {
    if (!user) {
      router.push('/login-sheet');
      return;
    }
    resetArena();
    queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    router.replace('/(tabs)/(portfolio)/(main)');
  };

  return (
    <Container>
      {/* 헤더 */}
      <Animated.View
        entering={FadeIn.duration(500)}
        className="items-center justify-center pt-[48px] pb-6">
        <View className="bg-primary/10 mb-4 h-20 w-20 items-center justify-center rounded-full">
          <Icon as={CheckCircle} className="text-primary size-12" />
        </View>
        <Text className="text-primary text-2xl font-bold"> {name} 포트폴리오 완성!</Text>
      </Animated.View>
      {/* 선택한 카드 목록 */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)} className="flex-1 px-4">
        <View className="mb-4 flex-row items-center gap-2">
          <Icon as={TrendingUp} className="text-primary size-5" />
          <Text className="text-foreground text-base font-semibold">
            선택한 자산 ({selectedCards.length}개)
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="gap-y-2">
            {selectedCards.map((card, index) => (
              <Animated.View
                key={card.assetId}
                entering={FadeInDown.duration(300).delay(300 + index * 50)}
                className="bg-card border-border flex-row items-center gap-3 rounded-lg border px-4 py-3">
                {/* 이미지 */}
                <Image
                  source={card.imageUrl}
                  className="bg-background h-10 w-10 rounded-full"
                  contentFit="contain"
                />

                {/* 정보 */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      className="text-foreground max-w-[150px] min-w-[150px] font-semibold text-ellipsis">
                      {card.name}
                    </Text>
                    <View className="bg-muted rounded px-1.5 py-0.5">
                      <Text className="text-muted-foreground text-xs">{card.market}</Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                    {card.ticker}
                  </Text>
                </View>

                {/* 리스크 */}
                <View className="items-center">
                  <Text className="text-muted-foreground text-xs">리스크</Text>
                  <Text
                    className={`font-bold ${
                      card.currentRiskLevel <= 2
                        ? 'text-green-500'
                        : card.currentRiskLevel <= 4
                          ? 'text-yellow-500'
                          : 'text-red-500'
                    }`}>
                    {card.currentRiskLevel}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* 하단 버튼 */}
      <Animated.View entering={FadeInDown.duration(500).delay(500)} className="gap-3 px-4 pt-4">
        <Button onPress={handleOpenLoginSheet} className="w-full" size="lg">
          <Text className="font-semibold">{user ? '포트폴리오 보러가기' : '로그인 하러가기'}</Text>
        </Button>
      </Animated.View>
    </Container>
  );
}
