import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { UserRoundIcon } from 'lucide-react-native';
import { View } from 'react-native';

const PROVIDER_LABEL: Record<string, string> = {
  GOOGLE: '구글 계정',
  APPLE: '애플 계정',
  EMAIL: '이메일 계정',
  ANONYMOUS: '게스트',
};

export const ProfileHeader = () => {
  const user = useUserStore((s) => s.user);

  const nickname = user?.nickname ?? '게스트';
  const providerLabel = PROVIDER_LABEL[user?.provider ?? 'ANONYMOUS'] ?? '게스트';
  const initial = user?.nickname?.trim().charAt(0);

  return (
    <View className="flex-row items-center gap-3 px-4 py-2">
      <View className="bg-primary/10 size-14 items-center justify-center rounded-full">
        {initial ? (
          <Text className="text-primary text-xl font-bold">{initial}</Text>
        ) : (
          <Icon as={UserRoundIcon} className="text-primary size-7" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-lg font-semibold">{nickname}</Text>
        <Text className="text-muted-foreground text-sm">{providerLabel}</Text>
      </View>
    </View>
  );
};
