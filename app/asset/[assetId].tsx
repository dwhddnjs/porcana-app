import { AssetCandlestickChart } from '@/components/portfolio/asset-candlestick-chart';
import { Text } from '@/components/ui/text';
import { useGetAssetChartQuery, useGetAssetQuery } from '@/lib/hooks/query/asset';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetImage } from '@/components/portfolio/asset-image';
import { Spacer } from '@/components/ui/spacer';
import { ChartRangeTypes } from '@/lib/api/asset';
import { Button } from '@/components/ui/button';
import { SECTOR_KO_MAP } from '@/lib/constant/variables';
import { GrabberHandle } from '@/components/ui/grabber-handle';
import { ChartRangeSelector } from '@/components/portfolio/chart-range-selector';
import { ScreenError, ScreenLoading, ScreenMessage } from '@/components/ui/screen-state';

export default function AssetDetailScreen() {
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { show, hide } = useLoadingStore();
  const { data, isLoading, isError, error } = useGetAssetQuery(assetId);
  const [chartRange, setChartRange] = useState<ChartRangeTypes>('1M');
  const { data: chartData, isLoading: isChartLoading } = useGetAssetChartQuery(assetId, chartRange);

  useEffect(() => {
    if (isLoading) {
      show('자산 불러오는 중...');
    } else {
      hide();
    }
  }, [isLoading, show, hide]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!assetId) {
    return <ScreenMessage message="자산 ID가 없습니다." />;
  }

  if (isLoading || !data) {
    return <ScreenLoading />;
  }

  if (isError) {
    return (
      <ScreenError
        title="자산을 불러오지 못했습니다."
        description={error?.message}
        onRetry={goBack}
      />
    );
  }

  return (
    <View className="bg-background flex-1" style={{ paddingBottom: insets.bottom }}>
      {/* 커스텀 그리퍼 핸들 */}
      <GrabberHandle />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View>
          <View className="gap-y-[12px] px-[20px]">
            <View className="flex-row items-center gap-3">
              <AssetImage imageUrl={data.imageUrl} name={data.name} size={48} />
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
            {(data.impactHint ?? data.description) ? (
              <Text className="text-muted-foreground text-sm leading-relaxed">
                {data.impactHint ?? data.description}
              </Text>
            ) : null}
          </View>

          <Spacer height={24} />

          <View className="flex-row items-center justify-between px-[20px]">
            <Text className="text-lg font-semibold">가격 차트</Text>
            <ChartRangeSelector value={chartRange} onSelect={setChartRange} />
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
