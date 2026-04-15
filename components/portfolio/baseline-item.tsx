import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { type BaselineItemTypes } from '@/lib/api/portfolio';

type BaselineItemPropsTypes = {
  item: BaselineItemTypes;
  currencyUnit?: string;
  showTopBorder?: boolean;
  showBottomBorder?: boolean;
};

const formatCurrency = (value: number): string => {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const BaselineItem = ({
  item,
  currencyUnit = '원',
  showTopBorder = false,
  showBottomBorder = true,
}: BaselineItemPropsTypes) => {
  return (
    <View
      className={cn(
        'flex-row items-center justify-between gap-4 rounded-md px-[4px] py-[8px]',
        showTopBorder && 'border-primary/10 border-t',
        showBottomBorder && 'border-primary/10 border-b'
      )}>
      <View className="flex-1 flex-row items-center gap-3">
        <View className="bg-primary/10 h-10 w-10 items-center justify-center rounded-full">
          <Text className="text-primary text-base font-bold">{item.symbol.charAt(0)}</Text>
        </View>
        <View className="flex-1 gap-[2px]">
          <View className="flex-row items-center gap-[4px]">
            <Text
              className="max-w-[150px] text-base font-semibold"
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.name}
            </Text>
            <Text className="text-weight text-sm font-semibold">{item.targetWeightPct}%</Text>
          </View>
          <View className="flex-row items-center gap-[4px]">
            <Text className="text-muted-foreground text-md">{item.symbol}</Text>
            <Text className="text-muted-foreground text-xs">· {item.market}</Text>
          </View>
        </View>
      </View>
      <View className="items-end gap-[2px]">
        <Text className="text-md font-semibold">{formatCurrency(item.currentValue)}{currencyUnit}</Text>
        <Text className="text-muted-foreground text-xs">
          {item.quantity}주 · {formatCurrency(item.avgPrice)}{currencyUnit}
        </Text>
      </View>
    </View>
  );
};
