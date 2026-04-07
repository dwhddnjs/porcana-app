import { HomeChartDataTypes } from '@/lib/api/home';
import { THEME } from '@/lib/theme';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useUniwind } from 'uniwind';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { ChartSpline } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HomePortfolioChartProps = {
  data: HomeChartDataTypes[];
  totalReturnPct?: number;
};

export const HomePortfolioChart = ({ data, totalReturnPct = 0 }: HomePortfolioChartProps) => {
  const { theme } = useUniwind();

  const chartData = data.map((item) => ({
    value: item.value ?? 0,
    date: item.date,
  }));

  const values = chartData.map((d) => d.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;

  const isPositive = totalReturnPct >= 0;

  const colors = theme === 'dark' ? THEME.dark : THEME.light;
  const lineColor = isPositive ? colors.stockUp : colors.stockDown;
  const rulesColor = colors.borderMuted;

  const formatDateKorean = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'M월d일', { locale: ko });
  };

  if (chartData.length < 3) {
    return (
      <View className="h-[200px] flex-row items-center justify-center gap-2">
        <Icon as={ChartSpline} size={24} className="text-muted-foreground" />
        <Text className="text-muted-foreground text-sm">차트 데이터가 부족합니다</Text>
      </View>
    );
  }

  // 단순 계산: 화면 너비에 맞게 spacing
  const spacing = chartData.length > 1 ? SCREEN_WIDTH / (chartData.length - 1) : SCREEN_WIDTH;

  return (
    <View className="">
      <LineChart
        data={chartData}
        width={SCREEN_WIDTH}
        height={200}
        curved
        areaChart
        color={lineColor}
        startFillColor={lineColor}
        endFillColor={lineColor}
        startOpacity={theme === 'dark' ? 0.5 : 0.3}
        endOpacity={0}
        thickness={2}
        hideDataPoints
        hideYAxisText
        yAxisLabelWidth={0}
        hideRules
        backgroundColor="transparent"
        noOfSections={4}
        yAxisOffset={minValue - 10}
        initialSpacing={0}
        endSpacing={0}
        spacing={spacing}
        xAxisColor="transparent"
        yAxisColor="transparent"
        pointerConfig={{
          pointerStripColor: rulesColor,
          pointerStripWidth: 1,
          pointerColor: lineColor,
          radius: 5,
          pointerLabelWidth: 80,
          pointerLabelHeight: 60,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (
            items: { value: number; date: string }[],
            _secondaryDataItem: unknown,
            pointerIndex: number
          ) => {
            if (!items || items.length === 0) return null;

            const isLastPoint = pointerIndex === chartData.length - 1;
            const isFirstPoint = pointerIndex === 0;

            return (
              <View
                style={{
                  backgroundColor: colors.primary,
                  zIndex: 10000000,
                  // paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  transform: [{ translateX: isLastPoint ? -60 : isFirstPoint ? 10 : 0 }],
                }}>
                <Text
                  style={{
                    color: colors.primaryForeground,
                    fontSize: 11,
                    opacity: 0.8,
                  }}>
                  {formatDateKorean(items[0].date)}
                </Text>
                <Text
                  style={{
                    color: colors.primaryForeground,
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                  {items[0].value.toFixed(2)}%
                </Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
};

export default HomePortfolioChart;
