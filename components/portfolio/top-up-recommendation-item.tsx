import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { type TopUpRecommendationTypes } from '@/lib/api/portfolio';
import { formatCurrency } from '@/lib/constant/function';

type TopUpRecommendationItemPropsTypes = {
  item: TopUpRecommendationTypes;
  currencyUnit: string;
  imageUrl?: string | null;
};

export const TopUpRecommendationItem = ({
  item,
  currencyUnit,
  imageUrl,
}: TopUpRecommendationItemPropsTypes) => {
  return (
    <View className="bg-card mb-[12px] rounded-xl px-[16px] py-[14px]">
      <View className="flex-row items-center gap-[12px]">
        <Image
          source={imageUrl}
          className="bg-background border-primary/10 h-10 w-10 rounded-full border"
          contentFit="contain"
        />
        <View className="flex-1 gap-[2px]">
          <Text className="text-base font-semibold">{item.name}</Text>
          <Text className="text-muted-foreground text-sm">{item.symbol}</Text>
        </View>
      </View>

      <View className="mt-[12px] flex-row items-center">
        <Text className="text-muted-foreground text-sm">
          현재 {item.currentWeightPct.toFixed(1)}%
        </Text>
        <Text className="text-muted-foreground mx-[6px] text-sm">→</Text>
        <Text className="text-success text-sm font-semibold">
          매수 후 {item.weightAfterBuy.toFixed(1)}%
        </Text>
      </View>

      <View className="bg-secondary mt-[12px] flex-row rounded-lg px-[14px] py-[10px]">
        <View className="flex-1 gap-[2px]">
          <Text className="text-muted-foreground text-xs">추천 수량</Text>
          <Text className="text-success text-base font-bold">{item.recommendedQuantity}주</Text>
        </View>
        <View className="flex-1 items-end gap-[2px]">
          <Text className="text-muted-foreground text-xs">추천 금액</Text>
          <Text className="text-success text-base font-bold">
            {currencyUnit}
            {formatCurrency(item.recommendedAmount)}
          </Text>
        </View>
      </View>

      {item.reason && (
        <View className="mt-[10px] flex-row items-start gap-[4px]">
          <Text className="text-muted-foreground text-xs">💡 {item.reason}</Text>
        </View>
      )}
    </View>
  );
};
