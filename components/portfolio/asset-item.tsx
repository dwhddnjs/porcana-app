import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { roundToTwoDecimals } from '@/lib/constant/function';

export type AssetItemData = {
  assetId: string;
  imageUrl: string | null;
  name: string;
  ticker: string;
  weightPct: number;
  returnPct: number;
};

type AssetItemProps = {
  item: AssetItemData;
  showTopBorder?: boolean;
  showBottomBorder?: boolean;
  onPress?: () => void;
  className?: string;
};

export const AssetItem = ({
  item,
  showTopBorder = false,
  showBottomBorder = true,
  onPress,
  className,
}: AssetItemProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={cn(
        'flex-row items-center justify-between gap-4 rounded-md px-[4px] py-[8px]',
        showTopBorder && 'border-primary/10 border-t',
        showBottomBorder && 'border-primary/10 border-b',
        className
      )}
      style={({ pressed }) => (onPress && pressed ? { opacity: 0.8 } : undefined)}>
      <View className="flex-row items-center gap-4">
        <Image
          source={item.imageUrl}
          className="bg-background border-primary/10 h-10 w-10 rounded-full border"
          contentFit="contain"
        />
        <View>
          <View className="flex-row items-center gap-[4px]">
            <Text
              className="max-w-[120px] min-w-[120px] text-lg font-semibold text-ellipsis"
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.name}
            </Text>
            <Text className="text-success text-sm font-semibold"> {item.weightPct}%</Text>
          </View>
          <Text className="text-muted-foreground line-clamp-1 max-w-[200px] text-ellipsis">
            {item.ticker}
          </Text>
        </View>
      </View>
      <View>
        <Text
          className={cn('font-semibold', item.returnPct > 0 ? 'text-link' : 'text-destructive')}>
          {roundToTwoDecimals(item.returnPct)}%
        </Text>
      </View>
    </Pressable>
  );
};
