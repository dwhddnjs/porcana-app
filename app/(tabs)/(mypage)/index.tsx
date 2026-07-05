import { LargeHeader } from '@/components/ui/large-header';
import { MenuItem } from '@/components/mypage/menu-item';
import { ProfileHeader } from '@/components/mypage/profile-header';
import { Spacer } from '@/components/ui/spacer';
import { Text } from '@/components/ui/text';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { queryClient } from '@/lib/react-query';
import { signOut } from '@/lib/api/auth';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  FileTextIcon,
  InfoIcon,
  PaletteIcon,
  Share2Icon,
  ShieldIcon,
  UserPenIcon,
} from 'lucide-react-native';
import { Pressable, Share, View } from 'react-native';
import { toast } from 'sonner-native';
import { useCallback } from 'react';

const APP_VERSION = Constants.expoConfig?.version ?? '';

export default function MypageScreen() {
  const router = useRouter();
  const reset = useUserStore((s) => s.reset);

  const handleEditProfile = useCallback(() => {
    router.push('/(settings)/edit-profile');
  }, [router]);

  const handleColorMode = useCallback(() => {
    router.push('/(settings)/color-mode');
  }, [router]);

  const handleTerms = useCallback(() => {
    router.push('/(settings)/terms');
  }, [router]);

  const handlePrivacy = useCallback(() => {
    router.push('/(settings)/privacy');
  }, [router]);

  const handleShare = useCallback(async () => {
    await Share.share({
      message: '포카나 - 포트폴리오 기반 투자 시뮬레이션 앱을 함께 사용해보세요!',
    });
  }, []);

  const handleVersion = useCallback(() => {}, []);

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
      <View className="px-1 pt-[12px]">
        <ProfileHeader />
      </View>

      <View className="px-4 pt-6">
        <Text className="text-muted-foreground mb-2 ml-1 text-xs font-medium">설정</Text>
        <View className="bg-card rounded-lg">
          <MenuItem icon={UserPenIcon} label="내정보 변경" onPress={handleEditProfile} />
          <Spacer isDivider className="mx-4" />
          <MenuItem icon={PaletteIcon} label="컬러 모드" onPress={handleColorMode} />
        </View>
      </View>

      <View className="px-4 pt-6">
        <Text className="text-muted-foreground mb-2 ml-1 text-xs font-medium">약관 및 정책</Text>
        <View className="bg-card rounded-lg">
          <MenuItem icon={FileTextIcon} label="이용약관" onPress={handleTerms} />
          <Spacer isDivider className="mx-4" />
          <MenuItem icon={ShieldIcon} label="개인정보처리방침" onPress={handlePrivacy} />
        </View>
      </View>

      <View className="px-4 pt-6">
        <Text className="text-muted-foreground mb-2 ml-1 text-xs font-medium">앱 정보</Text>
        <View className="bg-card rounded-lg">
          <MenuItem icon={Share2Icon} label="앱 공유하기" onPress={handleShare} />
          <Spacer isDivider className="mx-4" />
          <MenuItem
            icon={InfoIcon}
            label="버전 정보"
            onPress={handleVersion}
            right={<Text className="text-muted-foreground text-sm">{APP_VERSION}</Text>}
          />
        </View>
      </View>

      <View className="px-4 pt-3">
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

      <Spacer height={240} />
    </LargeHeader>
  );
}
