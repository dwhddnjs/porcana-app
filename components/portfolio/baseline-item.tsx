import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { type BaselineItemTypes } from '@/lib/api/portfolio';
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  getReturnColorClass,
  roundToTwoDecimals,
} from '@/lib/constant/function';

type BaselineItemPropsTypes = {
  item: BaselineItemTypes;
  currencyUnit?: string;
  showTopBorder?: boolean;
  showBottomBorder?: boolean;
  onPress?: (assetId: string) => void;
};

export const BaselineItem = ({
  item,
  currencyUnit = '원',
  showTopBorder = false,
  showBottomBorder = true,
  onPress,
}: BaselineItemPropsTypes) => {
  const profitLoss = (item.currentPrice - item.avgPrice) * item.quantity;
  const returnPct =
    item.avgPrice > 0 ? ((item.currentPrice - item.avgPrice) / item.avgPrice) * 100 : 0;
  const hasBasis = item.avgPrice > 0 && item.quantity > 0 && Math.abs(profitLoss) > 0.001;
  const colorClass = getReturnColorClass(profitLoss);

  const handlePress = () => {
    onPress?.(item.assetId);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      className={cn(
        'flex-row items-center justify-between gap-4 rounded-md px-[4px] py-[10px]',
        showTopBorder && 'border-primary/10 border-t',
        showBottomBorder && 'border-primary/10 border-b'
      )}>
      <View className="flex-1 flex-row items-center gap-3">
        <Image
          source={item.imageUrl}
          className="bg-background border-primary/10 h-10 w-10 rounded-full border"
          contentFit="contain"
        />
        <View className="flex-1 gap-[2px]">
          <View className="flex-row items-center gap-[4px]">
            <Text
              className="max-w-[160px] min-w-[160px] text-base font-semibold"
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.name}
            </Text>
            <Text className="text-weight text-sm font-semibold">{item.targetWeightPct}%</Text>
          </View>
          <View className="flex-row items-center gap-[4px]">
            <Text className="text-muted-foreground text-md">{item.symbol} ·</Text>
            <Text className="text-muted-foreground border-muted rounded-full border-[1.5px] px-1.5 text-xs">
              {item.market}
            </Text>
          </View>
        </View>
      </View>
      <View className="items-end gap-[4px]">
        <Text className="text-md font-semibold">
          {formatCurrency(item.currentValue)}
          {currencyUnit}
        </Text>
        {hasBasis && (
          <View className="flex-row items-center gap-[4px]">
            <Text className={cn('text-xs font-semibold', colorClass)}>
              {formatSignedCurrency(profitLoss)}
              {currencyUnit}
            </Text>
            <Text className={cn('text-xs font-semibold', colorClass)}>
              {formatSignedPercent(roundToTwoDecimals(returnPct))}
            </Text>
          </View>
        )}
        <Text className="text-muted-foreground text-xs">
          {item.quantity}주 · {formatCurrency(item.avgPrice)}
          {currencyUnit}
        </Text>
      </View>
    </Pressable>
  );
};
