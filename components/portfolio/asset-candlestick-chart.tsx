import { THEME } from '@/lib/theme';
import { ActivityIndicator, Dimensions, LayoutChangeEvent, View } from 'react-native';
import { CandlestickChart } from 'react-native-wagmi-charts';
import { useMemo, useState } from 'react';
import { useUniwind } from 'uniwind';
import { Text } from '../ui/text';
import { Spacer } from '../spacer';
import { ChartPointTypes } from '@/lib/api/asset';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTAINER_HEIGHT = SCREEN_HEIGHT * 0.4;
const LEGEND_PADDING = 80;
const CHART_HEIGHT = CONTAINER_HEIGHT - LEGEND_PADDING;

// wagmi 캔들스틱 차트에서 요구하는 데이터 타입
type CandleDataTypes = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type AssetCandlestickChartProps = {
  points?: ChartPointTypes[];
  isLoading?: boolean;
};

export const AssetCandlestickChart = ({ points, isLoading }: AssetCandlestickChartProps) => {
  const { theme } = useUniwind();
  const colors = theme === 'dark' ? THEME.dark : THEME.light;
  const [width, setWidth] = useState(0);

  // API points 데이터를 wagmi 캔들스틱 포맷으로 변환
  const chartData: CandleDataTypes[] = useMemo(
    () =>
      (points ?? []).map((point) => ({
        timestamp: new Date(point.date).getTime(),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      })),
    [points]
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setWidth((prev) => (prev === w ? prev : w));
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center" style={{ height: CONTAINER_HEIGHT }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View className="items-center justify-center" style={{ height: CONTAINER_HEIGHT }}>
        <Text className="text-muted-foreground">차트 데이터가 없습니다</Text>
      </View>
    );
  }

  const hasSize = width > 0;

  return (
    <View className="w-full py-4" style={{ height: CONTAINER_HEIGHT }} onLayout={onLayout}>
      <Spacer height={12} />
      {hasSize && (
        <CandlestickChart.Provider data={chartData}>
          <CandlestickChart width={width} height={CHART_HEIGHT}>
            <CandlestickChart.Candles
              positiveColor={colors.link}
              negativeColor={colors.destructive}
            />
            <CandlestickChart.Crosshair>
              <CandlestickChart.Tooltip
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  alignItems: 'center',
                  minWidth: 80,
                }}>
                <CandlestickChart.DatetimeText
                  style={{
                    color: colors.mutedForeground,
                    fontSize: 11,
                    fontWeight: '500',
                    minWidth: 80,
                    textAlign: 'center',
                  }}
                  options={{
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }}
                />
                <CandlestickChart.PriceText
                  type="close"
                  style={{
                    color: colors.foreground,
                    fontSize: 13,
                    fontWeight: '700',
                    marginTop: 2,
                    minWidth: 80,
                    textAlign: 'center',
                  }}
                />
              </CandlestickChart.Tooltip>
            </CandlestickChart.Crosshair>
          </CandlestickChart>
          <View className="mt-2 flex-row justify-between px-[32px]">
            <View className="items-center">
              <Text className="text-muted-foreground text-xs">시가</Text>
              <CandlestickChart.PriceText
                type="open"
                style={{ color: colors.foreground, fontSize: 12, fontWeight: '600', minWidth: 42 }}
              />
            </View>
            <View className="items-center">
              <Text className="text-muted-foreground text-xs">고가</Text>
              <CandlestickChart.PriceText
                type="high"
                style={{ color: colors.success, fontSize: 12, fontWeight: '600', minWidth: 42 }}
              />
            </View>
            <View className="items-center">
              <Text className="text-muted-foreground text-xs">저가</Text>
              <CandlestickChart.PriceText
                type="low"
                style={{ color: colors.destructive, fontSize: 12, fontWeight: '600', minWidth: 42 }}
              />
            </View>
            <View className="items-center">
              <Text className="text-muted-foreground text-xs">종가</Text>
              <CandlestickChart.PriceText
                type="close"
                style={{
                  color: colors.foreground,
                  fontSize: 12,
                  fontWeight: '600',

                  minWidth: 42,
                }}
              />
            </View>
          </View>
        </CandlestickChart.Provider>
      )}
    </View>
  );
};
