import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Icon } from './icon';
import { Text } from './text';
import { cn } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HeaderProps = {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightContent?: React.ReactNode;
  className?: string;

};

export const Header = ({
  title,
  showBackButton = true,
  onBackPress,
  rightContent,
  className,
  
}: HeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      className={cn('flex-row items-center justify-between px-4 h-14 ', className)}
   
    >
      {/* 왼쪽 영역 - 백버튼 */}
      <View className="w-10 items-start">
        {showBackButton && (
          <Pressable
            onPress={handleBackPress}
            className="p-2 -ml-3 active:opacity-70 "
            hitSlop={8}
          >
            <Icon as={ChevronLeft} className="size-[28px] text-foreground" />
          </Pressable>
        )}
      </View>

      {/* 중앙 영역 - 타이틀 */}
      <View className="flex-1 items-center">
        {title && (
          <Text className="text-lg font-semibold text-foreground">{title}</Text>
        )}
      </View>

      {/* 오른쪽 영역 - 커스텀 콘텐츠 */}
      <View className="w-10 items-end">
        {rightContent}
      </View>
    </View>
  );
};
