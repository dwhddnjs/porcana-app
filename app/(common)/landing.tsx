import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import Container from '@/components/ui/container';
import { Header } from '@/components/ui/header';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { Link, useRouter } from 'expo-router';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { CAROUSEL_ITEMS } from '@/lib/constant/variables';
import { supabase } from '@/lib/supabase/client';
import { useEffect } from 'react';

export default function LandingScreen() {
  const { accessToken, refreshToken, user, reset } = useUserStore();
  const router = useRouter();

  const handleStart = () => {
    router.push('/modal/pick-preferences');
  };

  // console.log('accessToken', accessToken);
  // console.log('refreshToken', refreshToken);
  // console.log('user', user);
  // 예: app/(tabs)/index.tsx 상단에 임시 추가

  useEffect(() => {
    supabase
      .from('아무_테이블명') // 없어도 됨
      .select('*')
      .limit(1)
      .then(({ error }) => {
        if (error?.code === '42P01') {
          console.log('✅ Supabase 연결 성공 (테이블 없음은 정상)');
        } else if (error) {
          console.log('❌ 연결 실패:', error.message);
        } else {
          console.log('✅ Supabase 연결 성공');
        }
      });
  }, []);

  return (
    <Container>
      <Header title="" showBackButton={false} />

      <View className="flex-1 justify-between pt-[48px]">
        <ImageCarousel items={CAROUSEL_ITEMS} imageHeight={240} />

        <View className="gap-y-[12px] px-[20px]">
          <Link href="/login">
            <Text className="text-link text-center text-sm">이미 가입된 계정이 있으신가요?</Text>
          </Link>
          <Button size="lg" onPress={handleStart}>
            <Text>시작하기</Text>
          </Button>
        </View>
      </View>
    </Container>
  );
}
