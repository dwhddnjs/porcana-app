import { HomeChartData } from '@/lib/api/home';
import { THEME } from '@/lib/theme';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useUniwind } from 'uniwind';
import { Text } from '../ui/text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatDateKorean = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'M월d일', { locale: ko });
};

type HomePortfolioChartProps = {
  data: HomeChartData[];
  totalReturnPct?: number;
};

const HomePortfolioChart = ({ data, totalReturnPct = 0 }: HomePortfolioChartProps) => {
  const { theme } = useUniwind();

  // 라벨 표시 간격 (양 끝 제외, 데이터가 많으면 일부만 표시)
  const labelInterval = data.length <= 5 ? 1 : Math.ceil(data.length / 4);
  const isEdge = (i: number) => i === 0 || i === data.length - 1;

  const chartData = data.map((item, i) => ({
    value: item.value ?? 0,
    label: !isEdge(i) && i % labelInterval === 0 ? formatDateKorean(item.date) : '',
  }));

  const values = chartData.map((d) => d.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;

  const isPositive = totalReturnPct >= 0;

  const colors = theme === 'dark' ? THEME.dark : THEME.light;
  const lineColor = isPositive ? colors.success : colors.destructive;
  const gradientColor = isPositive ? colors.successMuted : colors.destructiveMuted;
  const rulesColor = colors.borderMuted;

  if (chartData.length === 0) {
    return (
      <View className="h-[200px] items-center justify-center">
        <Text className="text-muted-foreground">차트 데이터가 없습니다</Text>
      </View>
    );
  }

  // 단순 계산: 화면 너비에 맞게 spacing
  const spacing = chartData.length > 1 ? SCREEN_WIDTH / (chartData.length - 1) : SCREEN_WIDTH;

  return (
    <View className="pb-5">
      <LineChart
        data={chartData}
        width={SCREEN_WIDTH}
        height={200}
        curved
        areaChart
        color={lineColor}
        startFillColor={gradientColor}
        endFillColor="transparent"
        thickness={2}
        hideDataPoints
        hideYAxisText
        yAxisLabelWidth={0}
        hideRules
        xAxisLabelTextStyle={{
          color: colors.mutedForeground,
          fontSize: 10,
        }}
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
          pointerLabelHeight: 30,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: { value: number }[]) => {
            if (!items || items.length === 0) return null;
            return (
              <View
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}>
                <Text
                  style={{
                    color: colors.primaryForeground,
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                  ${items[0].value.toFixed(2)}
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
