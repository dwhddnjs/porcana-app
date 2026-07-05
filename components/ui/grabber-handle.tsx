import { View } from 'react-native';
import { cn } from '@/lib/utils';

type GrabberHandleProps = {
  className?: string;
};

/**
 * 모달/시트 상단의 그래버(손잡이) 핸들.
 */
export const GrabberHandle = ({ className }: GrabberHandleProps) => {
  return (
    <View className="items-center py-3">
      <View className={cn('bg-muted-foreground/40 h-1 w-10 rounded-full', className)} />
    </View>
  );
};
