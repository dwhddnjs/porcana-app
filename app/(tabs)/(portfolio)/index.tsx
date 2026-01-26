import { LargeHeader } from '@/components/large-header';
import { Text } from '@/components/ui/text';
import { Dimensions, Pressable, View } from 'react-native';
import { PressableScale } from 'pressto';
import { ArrowRight, MenuIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { RoundAddButton } from '@/components/portfolio/round-add-button';
import { useRouter } from 'expo-router';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import { useUniwind } from 'uniwind';
import { THEME } from '@/lib/theme';
import { Spacer } from '@/components/spacer';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useGetHomeQuery } from '@/lib/hooks/query/home';
import HomePortfolioChart from '@/components/portfolio/home-portfolio-chart';
import { Building2 } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { Image } from '@/components/ui/image';

// 샘플 주식 데이터 (나중에 실제 데이터로 교체)

export default function PortfolioScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { accessToken, refreshToken } = useUserStore();

  const { data, isLoading } = useGetHomeQuery();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  console.log('data', data);

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
          <HomePortfolioChart />

          <Spacer height={24} />
          {/* 스크롤 테스트용 카드들 */}
          <View className="px-[12px]">
            {data?.positions.map((item, index) => (
              <View
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
                  <Text className="text-link font-semibold">{item.returnPct}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </LargeHeader>
      {/* <RoundAddButton onPress={() => router.push('/(tabs)/(portfolio)/add-modal')} /> */}
    </View>
  );
}
