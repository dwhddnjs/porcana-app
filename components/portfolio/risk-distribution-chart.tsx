import type { RiskDistribution } from '@/lib/api/portfolio';
import { THEME } from '@/lib/theme';
import { Dimensions, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useUniwind } from 'uniwind';
import { Text } from '../ui/text';
import { ChartNoAxesColumn } from 'lucide-react-native';
import { Icon } from '../ui/icon';

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
      labelComponent: () => (
        <View className="border-success h-8 w-8 items-center justify-center rounded-full border">
          <Text className="text-success font-semibold">{level}</Text>
        </View>
      ),
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
  const barWidth = 32;
  const barGap = 24;
  const spacing = barGap;
  const totalBarsWidth = barWidth * 5 + spacing * 4;
  const initialSpacing = 0;
  const endSpacing = Math.max(0, chartWidth - totalBarsWidth - initialSpacing);
  const segmentWidth = spacing + barWidth;
  const labelColor = isDark ? THEME.dark.foreground : THEME.light.foreground;

  return (
    <View className="gap-[8px]">
      <View className="flex-row items-center gap-2">
        <Icon as={ChartNoAxesColumn} size={16} className="text-primary" />
        <Text className="text-foreground font-semibold">위험 분포</Text>
      </View>
      <View className="items-start">
        <View style={{ width: chartWidth, height: 220 }}>
          <BarChart
            stackData={stackData}
            barWidth={barWidth}
            spacing={spacing}
            initialSpacing={initialSpacing}
            endSpacing={endSpacing}
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
            xAxisLabelsHeight={32}
            labelWidth={segmentWidth}
            xAxisLabelTextStyle={{ color: labelColor, fontSize: 12 }}
            labelsExtraHeight={24}
            labelsDistanceFromXaxis={16}
          />
        </View>
      </View>
    </View>
  );
};

export default RiskDistributionChart;
