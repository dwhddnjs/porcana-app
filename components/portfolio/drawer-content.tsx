import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Text } from '@/components/ui/text';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetPortfoliosQuery } from '@/lib/hooks/query/portfolio';
import { useSetMainPortfolioMutation } from '@/lib/hooks/mutation/portfolio';
import { Search } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useQueryClient } from '@tanstack/react-query';
import { PortfolioTypes } from '@/lib/api/portfolio';
import { PortfolioListItem } from '@/components/portfolio/portfolio-list-item';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Spacer } from '@/components/ui/spacer';
export function PortfolioDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: portfolios, isLoading } = useGetPortfoliosQuery();
  const { mutate: setMainPortfolio } = useSetMainPortfolioMutation();

  const handleSelectPortfolio = (portfolioId: string) => {
    props.navigation.closeDrawer();
    // 드로어 닫힌 뒤 이동해 전환 시 버벅임 방지
    const DRAWER_CLOSE_DELAY_MS = 600;
    setTimeout(() => {
      router.push(`/portfolio/${portfolioId}`);
    }, DRAWER_CLOSE_DELAY_MS);
  };

  // isMain이 true인 아이템을 맨 위로 정렬
  const sortedPortfolios = portfolios
    ? [...portfolios].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
    : [];

  const filteredPortfolios = sortedPortfolios.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSetMain = (portfolioId: string, isMain: boolean) => {
    if (isMain) return;

    // 이전 데이터 저장 (롤백용)
    const previousData = queryClient.getQueryData<PortfolioTypes[]>(['portfolios']);

    // 낙관적 업데이트: 먼저 UI 업데이트
    queryClient.setQueryData<PortfolioTypes[]>(['portfolios'], (old) => {
      if (!old) return old;
      return old.map((p) => ({
        ...p,
        isMain: p.portfolioId === portfolioId,
      }));
    });

    // API 요청
    setMainPortfolio(portfolioId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['home'] });
      },
      onError: () => {
        // 실패 시 롤백
        queryClient.setQueryData(['portfolios'], previousData);
      },
    });
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      {/* 고정 헤더 + 검색바 */}
      <View className="p-[12px] pb-0">
        <Text className="mb-3 text-lg font-bold">포트폴리오 목록</Text>
        <View className="mb-3 flex-row items-center">
          <View className="relative flex-1">
            <View className="absolute left-3 z-10 h-full justify-center">
              <Icon as={Search} size={16} className="text-muted-foreground" />
            </View>
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="포트폴리오 검색"
              className="bg-card dark:bg-background h-10 pl-9 shadow-none"
            />
          </View>
        </View>
      </View>

      {/* 스크롤 가능한 포트폴리오 목록 */}
      <ScrollView
        className="flex-1 px-[12px]"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-8">
            <ActivityIndicator />
          </View>
        ) : filteredPortfolios.length > 0 ? (
          <Animated.View className="gap-3" layout={LinearTransition.springify()}>
            {filteredPortfolios.map((portfolio) => (
              <Animated.View key={portfolio.portfolioId} layout={LinearTransition.springify()}>
                <PortfolioListItem
                  portfolio={portfolio}
                  onSelect={handleSelectPortfolio}
                  onSetMain={handleSetMain}
                />
              </Animated.View>
            ))}
            <Spacer height={120} />
          </Animated.View>
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-muted-foreground">
              {search ? '검색 결과가 없습니다' : '포트폴리오가 없습니다'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
