import { AssetCandlestickChart } from '@/components/portfolio/asset-candlestick-chart';
import { Text } from '@/components/ui/text';
import { useGetAssetChartQuery, useGetAssetQuery } from '@/lib/hooks/query/asset';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from '@/components/ui/image';
import { Spacer } from '@/components/ui/spacer';
import { ChartRangeTypes } from '@/lib/api/asset';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SECTOR_KO_MAP } from '@/lib/constant/variables';

export default function AssetDetailScreen() {
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { show, hide } = useLoadingStore();
  const { data, isLoading, isError, error } = useGetAssetQuery(assetId);
  const [chartRange, setChartRange] = useState<ChartRangeTypes>('1M');
  const {
    data: chartData,
    isLoading: isChartLoading,
    isError: isChartError,
    error: chartError,
  } = useGetAssetChartQuery(assetId, chartRange);

  useEffect(() => {
    if (isLoading) {
      show('자산 불러오는 중...');
    } else {
      hide();
    }
  }, [isLoading, show, hide]);

  const goBack = () => {
    router.back();
  };

  const handleSelectRange1M = useCallback(() => setChartRange('1M'), []);
  const handleSelectRange3M = useCallback(() => setChartRange('3M'), []);
  const handleSelectRange1Y = useCallback(() => setChartRange('1Y'), []);

  if (!assetId) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Text className="text-muted-foreground">자산 ID가 없습니다.</Text>
      </View>
    );
  }

  if (isLoading || !data) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-4">
        <Text className="text-destructive mb-2 text-center">자산을 불러오지 못했습니다.</Text>
        <Text className="text-muted-foreground mb-4 text-center text-sm">
          {error?.message ?? '잠시 후 다시 시도해 주세요.'}
        </Text>
        <Pressable onPress={goBack} className="bg-primary rounded-lg px-4 py-2">
          <Text className="text-primary-foreground font-medium">돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="bg-background flex-1" style={{ paddingBottom: insets.bottom }}>
      {/* 커스텀 그리퍼 핸들 */}
      <View className="items-center py-3">
        <View className="bg-muted-foreground/40 h-1 w-10 rounded-full" />
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View>
          <View className="gap-y-[12px] px-[20px]">
            <View className="flex-row items-center gap-3">
              <Image
                source={data.imageUrl}
                className="bg-background border-primary/10 h-12 w-12 rounded-full border"
                contentFit="contain"
              />
              <View className="flex-1">
                <View className="flex-row items-center justify-between gap-2">
                  <Text
                    className="max-w-[250px] text-lg font-semibold"
                    ellipsizeMode="tail"
                    numberOfLines={1}>
                    {data.name}
                  </Text>
                  <Text className="text-success text-sm">{data.market}</Text>
                </View>
                <Text className="text-muted-foreground text-base">{data.ticker}</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {data.sector ? (
                <View className="bg-muted border-primary/10 items-center justify-center rounded-md px-2 py-1">
                  <Text className="text-muted-foreground text-xs">
                    {SECTOR_KO_MAP[data.sector] ?? data.sector}
                  </Text>
                </View>
              ) : null}
              {data.currency ? (
                <View className="bg-background border-primary/10 items-center justify-center rounded-md border-2 px-2 py-1">
                  <Text className="text-muted-foreground text-xs">{data.currency}</Text>
                </View>
              ) : null}
            </View>
            {/* {data.description ? (
              <>
                <Spacer height={8} />
                <Text className="text-muted-foreground text-sm">{data.description}</Text>
              </>
            ) : null} */}
          </View>

          <Spacer height={24} />

          <View className="flex-row items-center justify-between px-[20px]">
            <Text className="text-lg font-semibold">가격 차트</Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                className={cn(
                  'h-8 w-9 items-center justify-center rounded-md',
                  chartRange === '1M' && 'bg-primary/10'
                )}
                onPress={handleSelectRange1M}>
                <Text
                  className={cn(
                    'text-muted-foreground text-sm',
                    chartRange === '1M' && 'text-primary font-semibold'
                  )}>
                  1M
                </Text>
              </Pressable>
              <Pressable
                className={cn(
                  'h-8 w-9 items-center justify-center rounded-md bg-none',
                  chartRange === '3M' && 'bg-primary/10'
                )}
                onPress={handleSelectRange3M}>
                <Text
                  className={cn(
                    'text-muted-foreground text-sm',
                    chartRange === '3M' && 'text-primary font-semibold'
                  )}>
                  3M
                </Text>
              </Pressable>
              <Pressable
                className={cn(
                  'h-8 w-9 items-center justify-center rounded-md bg-none',
                  chartRange === '1Y' && 'bg-primary/10'
                )}
                onPress={handleSelectRange1Y}>
                <Text
                  className={cn(
                    'text-muted-foreground text-sm',
                    chartRange === '1Y' && 'text-primary font-semibold'
                  )}>
                  1Y
                </Text>
              </Pressable>
            </View>
          </View>
          <AssetCandlestickChart
            points={chartData?.points}
            isLoading={isChartLoading}
            currency={data.currency}
          />
        </View>
      </ScrollView>
      <View className="px-[24px]">
        <Button size="lg" variant="default" onPress={goBack}>
          <Text className="font-semibold">차트 닫기</Text>
        </Button>
      </View>
    </View>
  );
}
