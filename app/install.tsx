import { useEffect } from 'react';
import { View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useUniwind } from 'uniwind';
import Container from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { useInstallPrefetch } from '@/lib/hooks/query/use-install-prefetch';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';

const LOGO_LIGHT = require('@/assets/images/logo/splash-icon-light.png');
const LOGO_DARK = require('@/assets/images/logo/splash-icon-dark.png');

export default function InstallScreen() {
  const router = useRouter();
  const { theme } = useUniwind();
  const { percent, isDone } = useInstallPrefetch();
  const setHasCompletedInstall = useUserStore((s) => s.setHasCompletedInstall);

  useEffect(() => {
    if (!isDone) return;
    setHasCompletedInstall(true);
    // '/'로 돌려보내 index가 유저 상태에 맞는 목적지(홈/랜딩)를 결정하게 한다.
    // (앱 업그레이드로 설치화면을 본 기존 영구 회원이 온보딩으로 튕기지 않도록)
    router.replace('/');
  }, [isDone]);

  const logoSource = theme === 'dark' ? LOGO_DARK : LOGO_LIGHT;

  return (
    <Container>
      <View className="flex-1 items-center justify-center gap-y-[32px] px-[40px]">
        <ExpoImage
          source={logoSource}
          contentFit="contain"
          style={{ width: 160, height: 160 }}
        />

        <View className="w-full max-w-[240px] items-center gap-y-[12px]">
          <View className="bg-muted h-[6px] w-full overflow-hidden rounded-full">
            <View className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
          </View>
          <Text className="text-muted-foreground text-sm">{percent}%</Text>
        </View>
      </View>
    </Container>
  );
}
