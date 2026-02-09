import { LargeHeader } from '@/components/large-header';
import { MenuItem } from '@/components/mypage/menu-item';
import { Spacer } from '@/components/spacer';
import { Text } from '@/components/ui/text';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useRouter } from 'expo-router';
import { PaletteIcon, UserPenIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export default function MypageScreen() {
  const router = useRouter();
  const logout = useUserStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <LargeHeader title="마이페이지">
      <View className="px-4 pt-[12px]">
        <View className="bg-card rounded-lg">
          <MenuItem
            icon={UserPenIcon}
            label="내정보 변경"
            onPress={() => router.push('/edit-profile')}
          />
          <Spacer isDivider className="mx-4" />
          <MenuItem
            icon={PaletteIcon}
            label="컬러 모드"
            onPress={() => router.push('/color-mode')}
          />
        </View>
      </View>

      <View className="px-4 pt-6">
        <Pressable onPress={handleLogout} className="items-center py-3 active:opacity-70">
          <Text className="text-primary/60 text-sm">로그아웃</Text>
        </Pressable>
      </View>
    </LargeHeader>
  );
}
