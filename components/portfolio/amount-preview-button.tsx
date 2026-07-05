import { ActivityIndicator, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';

type AmountPreviewButtonProps = {
  label: string;
  onPress: () => void;
  isPending?: boolean;
};

/**
 * 금액 입력 화면(시뮬레이션/입금)의 미리보기 실행 버튼.
 */
export const AmountPreviewButton = ({
  label,
  onPress,
  isPending = false,
}: AmountPreviewButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={isPending}
      className="bg-primary mt-[8px] items-center rounded-full py-[12px]"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : isPending ? 0.7 : 1 })}>
      {isPending ? (
        <ActivityIndicator size="small" color="black" />
      ) : (
        <Text className="text-primary-foreground text-lg font-semibold">{label}</Text>
      )}
    </Pressable>
  );
};
