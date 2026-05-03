import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { AssetImage } from '@/components/portfolio/asset-image';
import { cn } from '@/lib/utils';
import { roundToTwoDecimals } from '@/lib/constant/function';
import { useRef } from 'react';

export type AssetItemDataTypes = {
  assetId: string;
  imageUrl: string | string[];
  name: string;
  ticker: string;
  weightPct: number;
  targetWeightPct: number;
  returnPct: number;
};

type AssetItemProps = {
  item: AssetItemDataTypes;
  showTopBorder?: boolean;
  showBottomBorder?: boolean;
  onPress?: () => void;
  className?: string;
  isEditMode?: boolean;
  weightValue?: string;
  onWeightChange?: (value: string) => void;
};

export const AssetItem = ({
  item,
  showTopBorder = false,
  showBottomBorder = true,
  onPress,
  className,
  isEditMode = false,
  weightValue,
  onWeightChange,
}: AssetItemProps) => {
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable
      onPress={isEditMode ? undefined : onPress}
      disabled={isEditMode || !onPress}
      className={cn(
        'flex-row items-center justify-between gap-4 rounded-md px-[4px] py-[8px]',
        showTopBorder && 'border-primary/10 border-t',
        showBottomBorder && 'border-primary/10 border-b',
        className
      )}
      style={({ pressed }) => (onPress && !isEditMode && pressed ? { opacity: 0.8 } : undefined)}>
      <View className="flex-1 flex-row items-center gap-3">
        <AssetImage
          imageUrl={item.imageUrl ?? ''}
          name={item.name}
          size={40}
          className="border-primary/10 border"
        />
        <View className="flex-1 gap-[2px]">
          <View className="flex-row items-center gap-[4px]">
            <Text
              className="max-w-[150px] min-w-[150px] text-base font-semibold text-ellipsis"
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.name}
            </Text>
            {isEditMode ? (
              <Pressable
                className="flex-row items-center"
                onPress={() => inputRef.current?.focus()}>
                <TextInput
                  ref={inputRef}
                  value={weightValue}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    const formatted =
                      parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
                    onWeightChange?.(formatted);
                  }}
                  keyboardType="decimal-pad"
                  className="text-weight border-b-primary/40 min-w-[40px] border-b px-2 pb-1 text-center text-sm font-semibold"
                  selectTextOnFocus
                />
              </Pressable>
            ) : (
              <Text className="text-weight text-sm font-semibold">
                {' '}
                {item.weightPct} / {item.targetWeightPct}%
              </Text>
            )}
          </View>
          <Text className="text-muted-foreground text-md line-clamp-1 max-w-[200px] text-ellipsis">
            {item.ticker}
          </Text>
        </View>
      </View>
      <View>
        <Text
          className={cn(
            'text-md font-semibold',
            item.returnPct >= 0 ? 'text-stock-up' : 'text-stock-down'
          )}>
          {item.returnPct >= 0 ? '+' : ''}
          {roundToTwoDecimals(item.returnPct)}%
        </Text>
      </View>
    </Pressable>
  );
};
