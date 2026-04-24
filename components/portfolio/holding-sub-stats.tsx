import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatCurrency } from '@/lib/constant/function';

type HoldingSubStatsPropsTypes = {
  seedMoney: number;
  cashAmount: number;
  currencyUnit: string;
};

export const HoldingSubStats = ({
  seedMoney,
  cashAmount,
  currencyUnit,
}: HoldingSubStatsPropsTypes) => {
  return (
    <View className="flex-row gap-[8px]">
      <View className="border-primary/10 flex-1 gap-[4px] rounded-lg border px-[12px] py-[10px]">
        <Text className="text-muted-foreground text-xs">시드머니</Text>
        <Text className="text-sm font-semibold" adjustsFontSizeToFit numberOfLines={1}>
          {formatCurrency(seedMoney ?? 0)}
          {currencyUnit}
        </Text>
      </View>
      <View className="border-primary/10 flex-1 gap-[4px] rounded-lg border px-[12px] py-[10px]">
        <Text className="text-muted-foreground text-xs">현금 잔고</Text>
        <Text className="text-sm font-semibold" adjustsFontSizeToFit numberOfLines={1}>
          {formatCurrency(cashAmount ?? 0)}
          {currencyUnit}
        </Text>
      </View>
    </View>
  );
};
