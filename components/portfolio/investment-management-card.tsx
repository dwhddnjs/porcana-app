import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Briefcase, ClipboardList, Plus } from 'lucide-react-native';
import { cn } from '@/lib/utils';

type InvestmentManagementCardPropsTypes = {
  seedMoney: number;
  totalValue: number;
  baseCurrency: string;
  onPressHolding: () => void;
  onPressDeposit: () => void;
};

const formatCurrency = (value: number): string => {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const InvestmentManagementCard = ({
  seedMoney,
  totalValue,
  baseCurrency,
  onPressHolding,
  onPressDeposit,
}: InvestmentManagementCardPropsTypes) => {
  const profit = totalValue - seedMoney;
  const isPositive = profit >= 0;
  const currencySymbol = baseCurrency === 'USD' ? '$' : '₩';

  return (
    <Card className="mb-[16px] gap-4 py-4">
      <CardContent className="gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Icon as={Briefcase} size={18} className="text-primary" />
            <Text className="text-base font-bold">투자 관리</Text>
          </View>
          <View className="bg-primary/10 rounded-full px-[10px] py-[3px]">
            <Text className="text-primary text-xs font-semibold">운용중</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="bg-muted/50 flex-1 items-center rounded-lg px-2 py-3">
            <Text className="text-muted-foreground mb-1 text-xs">원금</Text>
            <Text className="text-sm font-bold" numberOfLines={1} adjustsFontSizeToFit>
              {currencySymbol}
              {formatCurrency(seedMoney)}
            </Text>
          </View>
          <View className="bg-muted/50 flex-1 items-center rounded-lg px-2 py-3">
            <Text className="text-muted-foreground mb-1 text-xs">평가금액</Text>
            <Text className="text-primary text-sm font-bold" numberOfLines={1} adjustsFontSizeToFit>
              {currencySymbol}
              {formatCurrency(totalValue)}
            </Text>
          </View>
          <View className="bg-muted/50 flex-1 items-center rounded-lg px-2 py-3">
            <Text className="text-muted-foreground mb-1 text-xs">수익</Text>
            <Text
              className={cn('text-sm font-bold', isPositive ? 'text-stock-up' : 'text-stock-down')}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {isPositive ? '+' : ''}
              {currencySymbol}
              {formatCurrency(Math.abs(profit))}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={onPressHolding}
            className="border-muted-foreground flex-1 flex-row items-center justify-center gap-1 rounded-full border py-[12px]"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Icon as={ClipboardList} size={16} className="text-primary" />
            <Text className="text-primary text-sm font-bold">보유 현황</Text>
          </Pressable>
          <Pressable
            onPress={onPressDeposit}
            className="bg-primary flex-1 flex-row items-center justify-center gap-1 rounded-full py-[12px]"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Icon as={Plus} size={16} className="text-primary-foreground font-bold" />
            <Text className="text-primary-foreground text-sm font-bold">추가 입금</Text>
          </Pressable>
        </View>
      </CardContent>
    </Card>
  );
};
