import { useMemo } from 'react';
import { View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useUniwind } from 'uniwind';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { type BaselineItemTypes } from '@/lib/api/portfolio';
import { roundToTwoDecimals } from '@/lib/constant/function';

type AllocationDonutPropsTypes = {
  items: BaselineItemTypes[];
  totalValue: number;
  cashAmount: number;
};

type SliceTypes = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

const SLICE_COLORS = [
  '#E53935', // 빨
  '#FB8C00', // 주
  '#FDD835', // 노
  '#43A047', // 초
  '#1E88E5', // 파
  '#3949AB', // 남
  '#8E24AA', // 보
  '#00ACC1', // 청록
  '#F06292', // 분홍
  '#6D4C41', // 갈
  '#00897B', // 민트
  '#7CB342', // 연두
  '#039BE5', // 하늘
  '#5E35B1', // 보라
  '#E91E63', // 핫핑크
  '#FF7043', // 다홍
  '#26A69A', // 틸
  '#EC407A', // 장미
  '#AB47BC', // 라벤더
  '#78909C', // 슬레이트 (현금 포함 20번째)
];

export const AllocationDonut = ({ items, totalValue, cashAmount }: AllocationDonutPropsTypes) => {
  const { theme } = useUniwind();
  const colors = theme === 'dark' ? THEME.dark : THEME.light;

  const slices = useMemo<SliceTypes[]>(() => {
    const base = totalValue + cashAmount;
    if (base <= 0) return [];

    const assetSlices = items.map((item, index) => ({
      label: item.name,
      value: item.currentValue ?? 0,
      percent: ((item.currentValue ?? 0) / base) * 100,
      color: SLICE_COLORS[index % SLICE_COLORS.length],
    }));

    if (cashAmount > 0) {
      assetSlices.push({
        label: '현금 잔고',
        value: cashAmount,
        percent: (cashAmount / base) * 100,
        color: '#90A4AE',
      });
    }

    return assetSlices;
  }, [items, totalValue, cashAmount]);

  if (slices.length === 0) {
    return null;
  }

  const pieData = slices.map((s) => ({ value: s.value, color: s.color }));

  return (
    <View className="border-primary/10 rounded-xl border px-[16px] py-[16px]">
      <View className="flex-row items-center gap-[24px]">
        <PieChart
          data={pieData}
          donut
          radius={72}
          innerRadius={40}
          backgroundColor="transparent"
          innerCircleColor={colors.background}
        />
        <View className="flex-1 gap-[6px]">
          {slices.map((s) => (
            <View key={s.label} className="flex-row items-center gap-[8px]">
              <View
                className="h-[10px] w-[10px] rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <Text className="flex-1 text-sm font-medium" numberOfLines={1}>
                {s.label}
              </Text>
              <Text className="text-muted-foreground text-sm font-semibold">
                {roundToTwoDecimals(s.percent)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
