import type { RiskDistribution } from '@/lib/api/portfolio';
import { THEME } from '@/lib/theme';
import { Dimensions, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useUniwind } from 'uniwind';
import { Text } from '../ui/text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MAX_VALUE = 100;
const FILL_COLOR_LIGHT = '#22c55e';
const FILL_COLOR_DARK = 'hsl(142 71% 45%)';

type RiskDistributionChartProps = {
  data?: RiskDistribution;
};

const RISK_LEVELS = [1, 2, 3, 4, 5] as const;

const RiskDistributionChart = ({ data }: RiskDistributionChartProps) => {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const fillColor = isDark ? THEME.dark.mutedForeground : THEME.light.mutedForeground;
  const bgColor = isDark ? THEME.dark.background : THEME.light.background;

  const stackData = RISK_LEVELS.map((level) => {
    const rawValue = data?.[String(level)] ?? 0;
    const value = rawValue <= 1 ? rawValue * MAX_VALUE : rawValue;
    const filledValue = Math.min(value, MAX_VALUE);
    const emptyValue = MAX_VALUE - filledValue;

    return {
      stacks: [
        { value: filledValue, color: fillColor },
        { value: emptyValue, color: bgColor },
      ],
      label: String(level),
      // labelComponents: () => (
      //   <View className="border-2">
      //     <Text>{level}</Text>
      //   </View>
      // ),
    };
  });

  const hasData = stackData.some((d) => d.stacks[0].value > 0);

  if (!hasData) {
    return (
      <View className="h-[180px] items-center justify-center">
        <Text className="text-muted-foreground">위험 분포 데이터가 없습니다</Text>
      </View>
    );
  }

  const chartWidth = Math.min(SCREEN_WIDTH - 48, 320);
  const barWidth = 28;
  const spacing = (chartWidth - barWidth * 5) / 6;
  const segmentWidth = spacing + barWidth;
  const labelColor = isDark ? THEME.dark.foreground : THEME.light.foreground;

  return (
    <View className="gap-[8px]">
      <Text className="text-foreground">위험 분포</Text>
      <View>
        <View style={{ width: chartWidth, height: 180 }}>
          <BarChart
            stackData={stackData}
            barWidth={barWidth}
            spacing={spacing}
            initialSpacing={spacing}
            endSpacing={spacing}
            width={chartWidth}
            height={160}
            noOfSections={5}
            maxValue={MAX_VALUE}
            hideRules
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisLabelWidth={0}
            hideYAxisText
            backgroundColor="transparent"
            isAnimated
            disableScroll
            stackBorderRadius={40}
          />
        </View>
        {/* x축 라벨: 라이브러리 기본 라벨이 잘려서 직접 렌더링 */}
      </View>
    </View>
  );
};

export default RiskDistributionChart;
