import type { RiskDistributionTypes } from '@/lib/api/portfolio';
import { THEME } from '@/lib/theme';
import { View } from 'react-native';
import { useUniwind } from 'uniwind';
import { Text } from '../ui/text';
import { ChartNoAxesColumn } from 'lucide-react-native';
import { Icon } from '../ui/icon';

const BAR_HEIGHT = 160;
const BAR_WIDTH = 36;
const BAR_RADIUS = 16;

type RiskDistributionChartProps = {
  data?: RiskDistributionTypes;
};

const RISK_LEVELS = [1, 2, 3, 4, 5] as const;

type CapsuleBarProps = {
  level: number;
  fillRatio: number;
  fillColor: string;
  bgColor: string;
};

const CapsuleBar = ({ level, fillRatio, fillColor, bgColor }: CapsuleBarProps) => {
  const fillHeight = BAR_HEIGHT * fillRatio;
  const riskValue = (Math.round(fillRatio * 1000) / 10).toFixed(1);

  return (
    <View className="items-center gap-2">
      {/* 캡슐 바 */}
      <View
        className="border-primary/10 rounded-full border"
        style={{
          width: BAR_WIDTH,
          height: BAR_HEIGHT,
          backgroundColor: bgColor,
          borderRadius: BAR_RADIUS,
          overflow: 'hidden',
          justifyContent: 'flex-end',
        }}>
        {/* 채워지는 부분 */}
        {fillRatio > 0 && (
          <View>
            <Text className="text-primary/70 py-2 text-center text-xs font-semibold">
              {riskValue}
            </Text>
            <View
              className="bg-primary/70 rounded-full"
              style={{
                width: '100%',
                height: fillHeight,
                // backgroundColor: fillColor,
              }}
            />
          </View>
        )}
      </View>
      {/* 레벨 라벨 */}
      <View className="border-primary/80 h-7 w-7 items-center justify-center rounded-full border">
        <Text className="text-primary/80 font-semibold">{level}</Text>
      </View>
    </View>
  );
};

const RiskDistributionChart = ({ data }: RiskDistributionChartProps) => {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const fillColor = isDark ? THEME.dark.chart2 : THEME.light.chart2;
  const bgColor = isDark ? THEME.dark.background : THEME.light.background;

  // 각 레벨의 채워진 비율 계산
  const fillRatios = RISK_LEVELS.map((level) => {
    const rawValue = data?.[String(level)] ?? 0;
    const value = rawValue <= 1 ? rawValue * 100 : rawValue;
    return Math.min(value, 100) / 100;
  });

  const hasData = fillRatios.some((ratio) => ratio > 0);

  if (!hasData) {
    return (
      <View className="h-[180px] items-center justify-center">
        <Text className="text-muted-foreground">위험 분포 데이터가 없습니다</Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Icon as={ChartNoAxesColumn} size={16} className="text-primary" />
        <Text className="text-foreground font-semibold">위험 분포</Text>
      </View>
      <View className="flex-row justify-between px-2 py-2">
        {RISK_LEVELS.map((level, index) => (
          <CapsuleBar
            key={level}
            level={level}
            fillRatio={fillRatios[index]}
            fillColor={fillColor}
            bgColor={bgColor}
          />
        ))}
      </View>
    </View>
  );
};

export default RiskDistributionChart;
