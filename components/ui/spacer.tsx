import { cn } from '@/lib/utils';
import { StyleProp, View, ViewStyle } from 'react-native';

interface SpacerProps {
  height?: number;
  isDivider?: boolean;
  className?: string;
}

export const Spacer = ({ height = 20, isDivider = false, className }: SpacerProps) => {
  return isDivider ? (
    <View className={cn('bg-border-muted h-[0.5px]', className)} />
  ) : (
    <View style={{ height: height }} />
  );
};
