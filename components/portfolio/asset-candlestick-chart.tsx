import { THEME } from '@/lib/theme';
import { Dimensions, LayoutChangeEvent, View } from 'react-native';
import { CandlestickChart } from 'react-native-wagmi-charts';
import { useMemo, useState } from 'react';
import { useUniwind } from 'uniwind';
import { Text } from '../ui/text';
import { Spacer } from '../spacer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTAINER_HEIGHT = SCREEN_HEIGHT * 0.4;
const LEGEND_PADDING = 80;
const CHART_HEIGHT = CONTAINER_HEIGHT - LEGEND_PADDING;

// 캔들스틱 데이터 타입
type CandleData = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

// 목업 데이터 생성
const generateMockCandleData = (): CandleData[] => {
  const data: CandleData[] = [];
  let basePrice = 150;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.5) * 10;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;

    data.push({
      timestamp: now - (30 - i) * dayMs,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });

    basePrice = close;
  }

  return data;
};

type AssetCandlestickChartProps = {
  data?: CandleData[];
};

export const AssetCandlestickChart = ({ data }: AssetCandlestickChartProps) => {
  const { theme } = useUniwind();
  const colors = theme === 'dark' ? THEME.dark : THEME.light;
  const [width, setWidth] = useState(0);

  const mockData = useMemo(() => generateMockCandleData(), []);
  const chartData = data ?? mockData;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setWidth((prev) => (prev === w ? prev : w));
  };

  if (chartData.length === 0) {
    return (
      <View className="flex-1 items-center justify-center" style={{ height: CONTAINER_HEIGHT }}>
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
              <CandlestickChart.Tooltip />
            </CandlestickChart.Crosshair>
          </CandlestickChart>
          <View className="mt-2 flex-row justify-between px-[32px]">
            <View className="items-center">
              <Text className="text-muted-foreground text-xs">시가</Text>
              <CandlestickChart.PriceText
                type="open"
                style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}
              />
            </View>
            <View className="items-center">
              <Text className="text-muted-foreground text-xs">고가</Text>
              <CandlestickChart.PriceText
                type="high"
                style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}
              />
            </View>
            <View className="items-center">
              <Text className="text-muted-foreground text-xs">저가</Text>
              <CandlestickChart.PriceText
                type="low"
                style={{ color: colors.destructive, fontSize: 12, fontWeight: '600' }}
              />
            </View>
            <View className="items-center">
              <Text className="text-muted-foreground text-xs">종가</Text>
              <CandlestickChart.PriceText
                type="close"
                style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}
              />
            </View>
          </View>
        </CandlestickChart.Provider>
      )}
    </View>
  );
};
