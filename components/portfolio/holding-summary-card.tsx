import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  getReturnColorClass,
  roundToTwoDecimals,
} from '@/lib/constant/function';
import { cn } from '@/lib/utils';

type HoldingSummaryCardPropsTypes = {
  totalValue: number;
  cashAmount: number;
  seedMoney: number;
  currencyUnit: string;
};

export const HoldingSummaryCard = ({
  totalValue,
  cashAmount,
  seedMoney,
  currencyUnit,
}: HoldingSummaryCardPropsTypes) => {
  const totalAsset = (totalValue ?? 0) + (cashAmount ?? 0);
  const profitLoss = totalAsset - (seedMoney ?? 0);
  const returnPct = seedMoney > 0 ? (profitLoss / seedMoney) * 100 : 0;
  const hasSeed = seedMoney > 0;
  const colorClass = getReturnColorClass(profitLoss);

  return (
    <View className="bg-primary/5 gap-[8px] rounded-xl px-[18px] py-[16px]">
      <Text className="text-muted-foreground text-xs">총 평가금액</Text>
      <Text className="text-2xl font-bold" adjustsFontSizeToFit numberOfLines={1}>
        {formatCurrency(totalAsset)}
        {currencyUnit}
      </Text>
      <View className="mt-[4px] flex-row items-baseline gap-[8px]">
        <Text className={cn('text-base font-semibold', colorClass)}>
          {hasSeed ? formatSignedCurrency(profitLoss) : '-'}
          {hasSeed && currencyUnit}
        </Text>
        <Text className={cn('text-sm font-semibold', colorClass)}>
          {hasSeed ? formatSignedPercent(roundToTwoDecimals(returnPct)) : ''}
        </Text>
      </View>
    </View>
  );
};
