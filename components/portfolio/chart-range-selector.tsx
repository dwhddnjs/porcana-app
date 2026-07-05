import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';
import type { ChartRangeTypes } from '@/lib/api/asset';

const CHART_RANGES: ChartRangeTypes[] = ['1M', '3M', '1Y'];

type ChartRangeButtonProps = {
  range: ChartRangeTypes;
  isActive: boolean;
  onSelect: (range: ChartRangeTypes) => void;
};

const ChartRangeButton = ({ range, isActive, onSelect }: ChartRangeButtonProps) => {
  const handlePress = useCallback(() => {
    onSelect(range);
  }, [range, onSelect]);

  return (
    <Pressable
      className={cn('h-8 w-9 items-center justify-center rounded-md', isActive && 'bg-primary/10')}
      onPress={handlePress}>
      <Text
        className={cn('text-muted-foreground text-sm', isActive && 'text-primary font-semibold')}>
        {range}
      </Text>
    </Pressable>
  );
};

type ChartRangeSelectorProps = {
  value: ChartRangeTypes;
  onSelect: (range: ChartRangeTypes) => void;
};

export const ChartRangeSelector = ({ value, onSelect }: ChartRangeSelectorProps) => {
  return (
    <View className="flex-row items-center gap-3">
      {CHART_RANGES.map((range) => (
        <ChartRangeButton
          key={range}
          range={range}
          isActive={value === range}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
};
