import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import Container from '@/components/ui/container';
import { Header } from '@/components/ui/header';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { Link, useRouter } from 'expo-router';
import { CAROUSEL_ITEMS } from '@/lib/constant/variables';

export default function LandingScreen() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/modal/pick-preferences');
  };

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
