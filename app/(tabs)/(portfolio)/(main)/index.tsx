import { Text } from '@/components/ui/text';
import { Pressable, View } from 'react-native';
import { MenuIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { useGetHomeQuery } from '@/lib/hooks/query/home';
import { useGetHoldingBaselineQuery } from '@/lib/hooks/query/portfolio';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import HomePortfolioChart from '@/components/portfolio/home-portfolio-chart';
import { AssetItem } from '@/components/portfolio/asset-item';
import { useEffect } from 'react';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useRouter } from 'expo-router';
import { roundToTwoDecimals } from '@/lib/constant/function';
import { LargeHeader } from '@/components/ui/large-header';
import { Spacer } from '@/components/ui/spacer';

export default function PortfolioScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { show, hide } = useLoadingStore();
  const { user } = useUserStore();

  const { data, isLoading } = useGetHomeQuery();
  const { data: holdingData } = useGetHoldingBaselineQuery(data?.mainPortfolio?.portfolioId);

  useEffect(() => {
    if (isLoading) {
      show('데이터 불러오는 중...');
    } else {
      hide();
    }
  }, [isLoading, show, hide]);

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
        titleRight={
          <View className="flex-1 flex-row items-center justify-between gap-2">
            <Text
              className={`text-lg font-bold ${
                (data?.mainPortfolio?.totalReturnPct ?? 0) >= 0
                  ? 'text-stock-up'
                  : 'text-stock-down'
              }`}>
              {(data?.mainPortfolio?.totalReturnPct ?? 0) >= 0 ? '+' : ''}
              {roundToTwoDecimals(data?.mainPortfolio?.totalReturnPct ?? 0)}%
            </Text>
            {holdingData?.exists && (
              <View className="bg-weight/10 flex-row items-center gap-[4px] rounded-full px-[8px] py-[4px]">
                <View className="bg-weight h-[6px] w-[6px] rounded-full" />
                <Text className="text-weight text-xs font-semibold">모의투자 중</Text>
              </View>
            )}
          </View>
        }
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
          <View className="px-[12px]">
            <Text className="text-muted-foreground text-md mb-[12px] font-bold">주요 자산</Text>
            {data?.positions?.map((item, index) => (
              <AssetItem
                key={item.assetId}
                item={item}
                showTopBorder={index === 0}
                onPress={() => {
                  router.push(`/asset/${item.assetId}`);
                }}
              />
            ))}
          </View>
        </View>
        <Spacer height={120} />
      </LargeHeader>
    </View>
  );
}
