import { THEME } from '@/lib/theme';
import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useUniwind } from 'uniwind';
import { Text } from '../ui/text';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const generateSampleData = () => {
  // 더 다이나믹한 고정 데이터
  const values = [
    100,
    105,
    98,
    115,
    108,
    125,
    140, // 초반 상승
    135,
    120,
    95,
    85,
    90, // 급락
    105,
    130,
    155,
    170,
    165, // 급등
    145,
    135,
    150,
    175,
    190, // 변동 후 상승
    180,
    165,
    185,
    210,
    205,
    220,
    235, // 마무리 상승
  ];

  return values.map((value, i) => ({
    value,
    label: i % 7 === 0 ? `${i + 1}일` : '',
  }));
};

const HomePortfolioChart = () => {
  const { theme } = useUniwind();

  const chartData = generateSampleData();
  const maxValue = Math.max(...chartData.map((d) => d.value));
  const minValue = Math.min(...chartData.map((d) => d.value));

  // 테마별 색상 (lib/theme.ts 참조)
  const colors = theme === 'dark' ? THEME.dark : THEME.light;
  const lineColor = colors.success;
  const gradientColor = colors.successMuted;
  const rulesColor = colors.borderMuted;

  return (
    <View className="overflow-hidden">
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
        showXAxisIndices={false}
        xAxisLabelTextStyle={{
          color: colors.mutedForeground,
          fontSize: 10,
          width: 40,
          textAlign: 'center',
        }}
        xAxisLabelsVerticalShift={0}
        backgroundColor="transparent"
        noOfSections={4}
        maxValue={maxValue + 10}
        yAxisOffset={minValue - 10}
        initialSpacing={0}
        endSpacing={0}
        spacing={SCREEN_WIDTH / (chartData.length - 1)}
        xAxisColor="transparent"
        xAxisThickness={0}
        yAxisColor="transparent"
        yAxisThickness={0}
        pointerConfig={{
          pointerStripHeight: 200,
          pointerStripColor: rulesColor,
          pointerStripWidth: 1,
          pointerColor: lineColor,
          radius: 5,

          pointerLabelHeight: 40,
          activatePointersOnLongPress: true,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: { value: number }[]) => (
            <View className="bg-primary rounded-md px-2 py-1">
              <Text className="text-primary-foreground text-sm font-semibold">
                ${items[0].value.toFixed(2)}
              </Text>
            </View>
          ),
        }}
      />
    </View>
  );
};

export default HomePortfolioChart;
