import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';

type ScreenLoadingProps = {
  size?: 'small' | 'large';
};

export const ScreenLoading = ({ size = 'large' }: ScreenLoadingProps) => {
  return (
    <View className="bg-background flex-1 items-center justify-center">
      <ActivityIndicator size={size} />
    </View>
  );
};

type ScreenMessageProps = {
  message: string;
};

export const ScreenMessage = ({ message }: ScreenMessageProps) => {
  return (
    <View className="bg-background flex-1 items-center justify-center">
      <Text className="text-muted-foreground">{message}</Text>
    </View>
  );
};

type ScreenErrorProps = {
  title: string;
  description?: string;
  onRetry: () => void;
  retryLabel?: string;
};

export const ScreenError = ({
  title,
  description,
  onRetry,
  retryLabel = '돌아가기',
}: ScreenErrorProps) => {
  return (
    <View className="bg-background flex-1 items-center justify-center px-4">
      <Text className="text-destructive mb-2 text-center">{title}</Text>
      <Text className="text-muted-foreground mb-4 text-center text-sm">
        {description ?? '잠시 후 다시 시도해 주세요.'}
      </Text>
      <Pressable onPress={onRetry} className="bg-primary rounded-lg px-4 py-2">
        <Text className="text-primary-foreground font-medium">{retryLabel}</Text>
      </Pressable>
    </View>
  );
};
