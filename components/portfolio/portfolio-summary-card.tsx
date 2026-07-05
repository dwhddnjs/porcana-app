import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Split, TrendingUp, TriangleAlert } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { DIVERSITY_LEVEL_LABELS, getDiversityLevelColor } from '@/lib/constant/function';
import RiskDistributionChart from '@/components/portfolio/risk-distribution-chart';
import { RiskStarRating } from '@/components/portfolio/risk-star-rating';
import type {
  DiversityLevelTypes,
  PortfolioReturnsTypes,
  RiskDistributionTypes,
} from '@/lib/api/portfolio';

type PortfolioSummaryCardProps = {
  totalReturnPct: number;
  riskLevel: number;
  diversityLevel?: DiversityLevelTypes;
  riskDistribution?: RiskDistributionTypes;
  returnsData?: PortfolioReturnsTypes;
  colorScheme?: 'light' | 'dark';
};

export const PortfolioSummaryCard = ({
  totalReturnPct,
  riskLevel,
  diversityLevel,
  riskDistribution,
  returnsData,
  colorScheme = 'light',
}: PortfolioSummaryCardProps) => {
  const isPositive = totalReturnPct >= 0;
  const periodReturns = [
    { label: '1일', value: returnsData?.return1D ?? null },
    { label: '1주', value: returnsData?.return1W ?? null },
    { label: '1개월', value: returnsData?.return1M ?? null },
    { label: '1년', value: returnsData?.return1Y ?? null },
  ];
  const hasPeriodReturns = periodReturns.some((item) => item.value !== null);

  return (
    <View className="py-[18px]">
      <View className="gap-y-[24px] px-[8px]">
        <View>
          <View className="flex-row items-center gap-2">
            <Icon as={TrendingUp} size={20} className="text-primary" />
            <Text className="text-lg font-semibold">수익률</Text>
          </View>
          <Text
            className={cn('text-3xl font-bold', isPositive ? 'text-stock-up' : 'text-stock-down')}>
            {isPositive ? '+' : ''}
            {totalReturnPct.toFixed(2)}%
          </Text>
        </View>
        <View className="flex-row justify-between">
          <View className="flex-1 justify-between">
            <View className="flex-row items-center gap-2">
              <Icon as={TriangleAlert} size={16} className="text-primary" />
              <Text className="font-semibold">평균 위험도</Text>
              <Text className="text-muted-foreground text-md">{riskLevel}</Text>
            </View>
            <RiskStarRating riskLevel={riskLevel} colorScheme={colorScheme} />
          </View>
          <View className="flex-1 justify-between">
            <View className="flex-row items-center gap-2">
              <Icon as={Split} size={16} className="text-primary" />
              <Text className="font-semibold">분산도</Text>
            </View>
            <Text className={getDiversityLevelColor(diversityLevel)}>
              {DIVERSITY_LEVEL_LABELS[diversityLevel ?? 'LOW']}
            </Text>
          </View>
        </View>
        <RiskDistributionChart data={riskDistribution} />
        {returnsData && hasPeriodReturns && (
          <View className="flex-row justify-between">
            {periodReturns.map((item) => (
              <View key={item.label} className="items-center gap-[2px]">
                <Text className="text-muted-foreground text-xs">{item.label}</Text>
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    item.value === null
                      ? 'text-muted-foreground'
                      : item.value >= 0
                        ? 'text-stock-up'
                        : 'text-stock-down'
                  )}>
                  {item.value === null
                    ? '-'
                    : `${item.value >= 0 ? '+' : ''}${item.value.toFixed(2)}%`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};
