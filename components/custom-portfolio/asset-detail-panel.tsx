import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Dimensions, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { useGetAssetQuery, useGetAssetChartQuery } from '@/lib/hooks/query/asset';
import { ChartRangeTypes } from '@/lib/api/asset';
import { AssetCandlestickChart } from '@/components/portfolio/asset-candlestick-chart';
import { SECTOR_KO_MAP } from '@/lib/constant/variables';
import { getRiskStarColor } from '@/lib/constant/function';
import { cn } from '@/lib/utils';
import { Spacer } from '../spacer';

const PANEL_WIDTH_RATIO = 0.55;
const CHART_CONTAINER_HEIGHT = 200;

interface AssetDetailPanelPropsTypes {
  assetId: string | null;
  onClose: () => void;
}

export const AssetDetailPanel = ({ assetId, onClose }: AssetDetailPanelPropsTypes) => {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');
  const panelWidth = screenWidth * PANEL_WIDTH_RATIO;

  const [chartRange, setChartRange] = useState<ChartRangeTypes>('1M');

  const translateX = useSharedValue(-panelWidth);
  const backdropOpacity = useSharedValue(0);

  const { data, isLoading } = useGetAssetQuery(assetId ?? undefined);
  const { data: chartData, isLoading: isChartLoading } = useGetAssetChartQuery(
    assetId ?? undefined,
    chartRange
  );

  const hasEverOpened = useRef(false);

  useEffect(() => {
    if (assetId) {
      hasEverOpened.current = true;
      translateX.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    } else if (hasEverOpened.current) {
      translateX.value = withTiming(-panelWidth, {
        duration: 400,
        easing: Easing.in(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.cubic),
      });
    } else {
      translateX.value = -panelWidth;
    }
  }, [assetId, panelWidth, translateX, backdropOpacity]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: translateX.value === -panelWidth ? 0 : 1,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSelectRange1M = useCallback(() => setChartRange('1M'), []);
  const handleSelectRange3M = useCallback(() => setChartRange('3M'), []);
  const handleSelectRange1Y = useCallback(() => setChartRange('1Y'), []);

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents={assetId ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: panelWidth,
          },
          panelStyle,
        ]}
        className="bg-background">
        {isLoading || !data ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 20,
              paddingLeft: insets.left + 20,
              paddingRight: 20,
            }}>
            {/* 에셋 헤더 */}
            <View className="flex-row items-center gap-3">
              <Image
                source={data.imageUrl}
                className="bg-background border-primary/10 h-12 w-12 rounded-full border"
                contentFit="contain"
              />
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-semibold" numberOfLines={1}>
                    {data.name}
                  </Text>
                  <Text className="text-success text-sm">{data.exchange}</Text>
                </View>
                <Text className="text-muted-foreground text-base">{data.ticker}</Text>
              </View>
            </View>

            {/* 뱃지 */}
            <View className="mt-3 flex-row flex-wrap gap-2">
              {data.sector ? (
                <View className="border-border rounded-md border px-2 py-1">
                  <Text className="text-muted-foreground text-xs">
                    {SECTOR_KO_MAP[data.sector] ?? data.sector}
                  </Text>
                </View>
              ) : null}
              {data.currency ? (
                <View className="border-border rounded-md border px-2 py-1">
                  <Text className="text-muted-foreground text-xs">{data.currency}</Text>
                </View>
              ) : null}
              {data.country ? (
                <View className="border-border rounded-md border px-2 py-1">
                  <Text className="text-muted-foreground text-xs">{data.country}</Text>
                </View>
              ) : null}
            </View>

            {/* 설명 */}
            {data.description ? (
              <Text className="text-muted-foreground mt-3 text-sm" numberOfLines={4}>
                {data.description}
              </Text>
            ) : null}

            {/* 자산 성격 */}
            {data.personality ? (
              <View className="mt-4">
                <Text className="text-base font-semibold">자산 성격</Text>
                <View className="bg-muted/50 mt-2 gap-2.5 rounded-lg p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted-foreground text-xs">역할</Text>
                    <Text className="text-sm">{data.personality.roleDisplayName}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted-foreground text-xs">설명</Text>
                    <Text className="flex-1 text-right text-sm" numberOfLines={2}>
                      {data.personality.roleDescription}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted-foreground text-xs">리스크</Text>
                    <View className="flex-row items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => {
                        const isFilled = i < data.personality!.riskLevel;
                        return (
                          <View
                            key={i}
                            className={cn(
                              'h-2 w-2 rounded-full',
                              !isFilled && 'bg-muted-foreground/30'
                            )}
                            style={
                              isFilled
                                ? {
                                    backgroundColor: getRiskStarColor(
                                      data.personality!.riskLevel,
                                      colorScheme
                                    ),
                                  }
                                : undefined
                            }
                          />
                        );
                      })}
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted-foreground text-xs">노출 유형</Text>
                    <Text className="text-sm">{data.personality.exposureTypeDisplayName}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted-foreground text-xs">페르소나</Text>
                    <Text className="text-sm">{data.personality.personaDisplayName}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted-foreground text-xs">배당 프로필</Text>
                    <Text className="text-sm">{data.personality.dividendProfileDisplayName}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* 차트 섹션 */}
            <View className="mt-5 flex-row items-center justify-between">
              <Text className="text-base font-semibold">가격 차트</Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={handleSelectRange1M}
                  className={cn(
                    'h-7 w-9 items-center justify-center rounded-md',
                    chartRange === '1M' && 'bg-primary/10'
                  )}>
                  <Text
                    className={cn(
                      'text-muted-foreground text-xs',
                      chartRange === '1M' && 'text-primary font-semibold'
                    )}>
                    1M
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSelectRange3M}
                  className={cn(
                    'h-7 w-9 items-center justify-center rounded-md',
                    chartRange === '3M' && 'bg-primary/10'
                  )}>
                  <Text
                    className={cn(
                      'text-muted-foreground text-xs',
                      chartRange === '3M' && 'text-primary font-semibold'
                    )}>
                    3M
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSelectRange1Y}
                  className={cn(
                    'h-7 w-9 items-center justify-center rounded-md',
                    chartRange === '1Y' && 'bg-primary/10'
                  )}>
                  <Text
                    className={cn(
                      'text-muted-foreground text-xs',
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
              containerHeight={CHART_CONTAINER_HEIGHT}
            />
            <Spacer height={120} />
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};
