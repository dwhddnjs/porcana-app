import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Text } from '@/components/ui/text';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetPortfoliosQuery } from '@/lib/hooks/query/portfolio';
import { useSetMainPortfolioMutation } from '@/lib/hooks/mutation/portfolio';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useQueryClient } from '@tanstack/react-query';
import { Portfolio } from '@/lib/api/portfolio';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

export function PortfolioDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: portfolios, isLoading } = useGetPortfoliosQuery();
  const { mutate: setMainPortfolio } = useSetMainPortfolioMutation();

  const handleSelectPortfolio = (portfolioId: string) => {
    props.navigation.closeDrawer();
    // 드로어 닫힌 뒤 이동해 전환 시 버벅임 방지
    const DRAWER_CLOSE_DELAY_MS = 600;
    setTimeout(() => {
      router.push(`/(tabs)/(portfolio)/${portfolioId}`);
    }, DRAWER_CLOSE_DELAY_MS);
  };

  // isMain이 true인 아이템을 맨 위로 정렬
  const sortedPortfolios = portfolios
    ? [...portfolios].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
    : [];

  const handleSetMain = (portfolioId: string, isMain: boolean) => {
    if (isMain) return;

    // 이전 데이터 저장 (롤백용)
    const previousData = queryClient.getQueryData<Portfolio[]>(['portfolios']);

    // 낙관적 업데이트: 먼저 UI 업데이트
    queryClient.setQueryData<Portfolio[]>(['portfolios'], (old) => {
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
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top,
      }}>
      <View className="p-[12px]">
        <Text className="mb-4 text-lg font-bold">포트폴리오 목록</Text>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : sortedPortfolios.length > 0 ? (
          <Animated.View className="gap-3" layout={LinearTransition.springify()}>
            {sortedPortfolios.map((portfolio) => (
              <Animated.View
                key={portfolio.portfolioId}
                layout={LinearTransition.springify()}
                className={cn(
                  'flex-row items-center justify-between rounded-md px-[16px] py-[12px]',
                  portfolio.isMain ? 'bg-primary/10' : 'bg-muted/50'
                )}>
                <Pressable
                  className="flex-1"
                  onPress={() => handleSelectPortfolio(portfolio.portfolioId)}>
                  <View className="flex-1">
                    <Text className="font-semibold">{portfolio.name}</Text>
                    <Text
                      className={cn(
                        'text-sm',
                        portfolio.totalReturnPct >= 0 ? 'text-link' : 'text-destructive'
                      )}>
                      {portfolio.totalReturnPct >= 0 ? '+' : ''}
                      {portfolio.totalReturnPct.toFixed(2)}%
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleSetMain(portfolio.portfolioId, portfolio.isMain)}
                  hitSlop={8}>
                  <Icon
                    as={Star}
                    size={20}
                    className={portfolio.isMain ? 'text-yellow-500' : 'text-muted-foreground'}
                    fill={portfolio.isMain ? '#eab308' : 'transparent'}
                  />
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">포트폴리오가 없습니다</Text>
          </View>
        )}
      </View>
    </DrawerContentScrollView>
  );
}
