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
import { AssetItem } from '@/components/portfolio/asset-item';
import { useEffect } from 'react';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useRouter } from 'expo-router';

export default function PortfolioScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { show, hide } = useLoadingStore();
  const { user, accessToken } = useUserStore();

  console.log(accessToken);

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
