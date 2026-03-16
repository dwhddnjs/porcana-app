import { Pressable, View } from 'react-native';
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
  backIcon?: any;
  rightIcon?: any;
};

export const Header = ({
  title,
  showBackButton = true,
  onBackPress,
  rightContent,
  backIcon = ChevronLeft,
  rightIcon,
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
    <View className={cn('z-10 h-14 flex-row items-center justify-between px-2', className)}>
      {/* 왼쪽 영역 - 백버튼 */}
      {showBackButton ? (
        <Pressable
          onPress={handleBackPress}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          style={{ padding: 8 }}>
          <Icon as={backIcon} className="text-foreground size-[28px]" />
        </Pressable>
      ) : (
        <View className="w-10" />
      )}

      {/* 중앙 영역 - 타이틀 */}
      <View className="flex-1 items-center">
        {title && <Text className="text-foreground text-lg font-semibold">{title}</Text>}
      </View>

      {/* 오른쪽 영역 - 커스텀 콘텐츠 */}
      <View className="w-10 items-end">{rightContent}</View>
    </View>
  );
};
