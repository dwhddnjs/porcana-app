import { LargeHeader } from '@/components/large-header';
import { Text } from '@/components/ui/text';
import { Pressable, View } from 'react-native';
import { MenuIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Spacer } from '@/components/spacer';
import { useGetHomeQuery } from '@/lib/hooks/query/home';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import HomePortfolioChart from '@/components/portfolio/home-portfolio-chart';
import { cn } from '@/lib/utils';
import { Image } from '@/components/ui/image';
import { roundToTwoDecimals } from '@/lib/constant/function';
import { useEffect } from 'react';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';

export default function PortfolioScreen() {
  const navigation = useNavigation();
  const { show, hide } = useLoadingStore();
  const { user } = useUserStore();

  const { data, isLoading } = useGetHomeQuery();

  useEffect(() => {
    if (isLoading) {
      show('데이터 불러오는 중...');
    } else {
      hide();
    }
  }, [isLoading]);

  if (isLoading || !data) {
    return null;
  }

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View className="flex-1">
      <LargeHeader
        title={data?.mainPortfolio?.name as string}
        headerRight={
          <Pressable onPress={openDrawer} hitSlop={8}>
            <Icon as={MenuIcon} size={24} className="text-foreground" />
          </Pressable>
        }>
        <View className="relative">
          {/* 주식 스타일 라인 차트 */}
          <HomePortfolioChart
            data={data?.chart ?? []}
            totalReturnPct={data?.mainPortfolio?.totalReturnPct}
          />

          <Spacer height={12} />
          {/* 스크롤 테스트용 카드들 */}

          <View className="px-[12px]">
            <Text className="text-muted-foreground text-md mb-[12px] font-bold">주요 자산</Text>
            {data?.positions.map((item, index) => (
              <Pressable
                key={item.assetId}
                className={cn(
                  'border-primary/10 flex-row items-center justify-between gap-4 rounded-md border-b px-[4px] py-[8px]',
                  index === 0 && 'border-t'
                )}>
                <View className="flex-row items-center gap-4">
                  <Image
                    source={item.imageUrl}
                    className="bg-background border-primary/10 h-10 w-10 rounded-full border"
                    contentFit="contain"
                  />
                  <View>
                    <View className="g flex-row items-center gap-[4px]">
                      <Text className="text-lg font-semibold">{item.ticker}</Text>
                      <Text className="text-success text-sm font-semibold"> {item.weightPct}%</Text>
                    </View>
                    <Text className="text-muted-foreground line-clamp-1 max-w-[200px] text-ellipsis">
                      {item.name}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text
                    className={cn(
                      'text-destructive font-semibold',
                      item.returnPct > 0 ? 'text-link' : 'text-destructive'
                    )}>
                    {roundToTwoDecimals(item.returnPct)}%
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </LargeHeader>
    </View>
  );
}
