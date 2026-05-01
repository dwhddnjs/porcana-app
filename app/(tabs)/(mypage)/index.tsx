import { LargeHeader } from '@/components/ui/large-header';
import { MenuItem } from '@/components/mypage/menu-item';
import { Spacer } from '@/components/ui/spacer';
import { Text } from '@/components/ui/text';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { queryClient } from '@/lib/react-query';
import { signOut } from '@/lib/api/auth';
import { useRouter } from 'expo-router';
import { PaletteIcon, UserPenIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { toast } from 'sonner-native';

export default function MypageScreen() {
  const router = useRouter();
  const reset = useUserStore((s) => s.reset);

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    reset();
    toast.success('로그아웃 되었습니다.');
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/(auth)/login');
  };

  const handleWithdraw = () => {
    router.push('/(settings)/withdraw');
  };

  return (
    <LargeHeader title="마이페이지">
      <View className="px-4 pt-[12px]">
        <View className="bg-card rounded-lg">
          <MenuItem
            icon={UserPenIcon}
            label="내정보 변경"
            onPress={() => router.push('/(settings)/edit-profile')}
          />
          <Spacer isDivider className="mx-4" />
          <MenuItem
            icon={PaletteIcon}
            label="컬러 모드"
            onPress={() => router.push('/(settings)/color-mode')}
          />
        </View>
      </View>

      <View className="px-4 pt-6">
        <View className="flex-row items-center justify-center py-3">
          <Pressable onPress={handleLogout} className="active:opacity-70">
            <Text className="text-primary/60 text-sm">로그아웃</Text>
          </Pressable>
          <Text className="text-primary/40 mx-2 text-sm">/</Text>
          <Pressable onPress={handleWithdraw} className="active:opacity-70">
            <Text className="text-primary/60 text-sm">회원탈퇴</Text>
          </Pressable>
        </View>
      </View>
    </LargeHeader>
  );
}
