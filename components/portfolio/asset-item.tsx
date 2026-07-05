import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { AssetImage } from '@/components/portfolio/asset-image';
import { cn } from '@/lib/utils';
import { roundToTwoDecimals } from '@/lib/constant/function';
import { useCallback, useRef } from 'react';

export type AssetItemDataTypes = {
  assetId: string;
  imageUrl: string | string[];
  name: string;
  ticker: string;
  weightPct: number;
  targetWeightPct: number;
  returnPct: number;
  contributionPct?: number;
};

type AssetItemProps = {
  item: AssetItemDataTypes;
  showTopBorder?: boolean;
  showBottomBorder?: boolean;
  onPress?: (assetId: string) => void;
  className?: string;
  isEditMode?: boolean;
  showContribution?: boolean;
  weightValue?: string;
  onWeightChange?: (assetId: string, value: string) => void;
};

export const AssetItem = ({
  item,
  showTopBorder = false,
  showBottomBorder = true,
  onPress,
  className,
  isEditMode = false,
  showContribution = false,
  weightValue,
  onWeightChange,
}: AssetItemProps) => {
  const inputRef = useRef<TextInput>(null);

  const handlePress = useCallback(() => {
    onPress?.(item.assetId);
  }, [onPress, item.assetId]);

  const handleFocusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
      onWeightChange?.(item.assetId, formatted);
    },
    [onWeightChange, item.assetId]
  );

  return (
    <Pressable
      onPress={isEditMode ? undefined : handlePress}
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
              <Pressable className="flex-row items-center" onPress={handleFocusInput}>
                <TextInput
                  ref={inputRef}
                  value={weightValue}
                  onChangeText={handleChangeText}
                  keyboardType="decimal-pad"
                  className="text-weight border-b-primary/40 min-w-[40px] border-b px-2 pb-1 text-center text-sm font-semibold"
                  selectTextOnFocus
                />
              </Pressable>
            ) : (
              <Text className="text-weight max-w-[120px] text-sm font-semibold">
                {' '}
                {+item.weightPct.toFixed(1)} / {+item.targetWeightPct.toFixed(1)}%
              </Text>
            )}
          </View>
          <Text className="text-muted-foreground text-md line-clamp-1 max-w-[200px] text-ellipsis">
            {item.ticker}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text
          className={cn(
            'text-md font-semibold',
            roundToTwoDecimals(item.returnPct) === 0
              ? 'text-foreground'
              : item.returnPct > 0
                ? 'text-stock-up'
                : 'text-stock-down'
          )}>
          {item.returnPct > 0 ? '+' : ''}
          {roundToTwoDecimals(item.returnPct)}%
        </Text>
        {!isEditMode && showContribution && (
          <Text className="text-muted-foreground text-xs">
            ({(item.contributionPct ?? 0) > 0 ? '+' : ''}
            {roundToTwoDecimals(item.contributionPct ?? 0)}%)
          </Text>
        )}
      </View>
    </Pressable>
  );
};
