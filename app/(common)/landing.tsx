import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import Container from '@/components/container';
import { Header } from '@/components/ui/header';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { CreatePortfolioDialog } from '@/components/portfolio/create-portfolio-dialog';
import { Link, useRouter } from 'expo-router';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useCreatePortfolioMutation } from '@/lib/hooks/mutation/portfolio';

const CAROUSEL_IMAGES = [
  require('@/assets/images/coin.png'),
  require('@/assets/images/money.png'),
  require('@/assets/images/card.png'),
];

export default function LandingScreen() {
  const router = useRouter();
  const { accessToken } = useUserStore();
  const [open, setOpen] = useState(false);
  const { mutate } = useCreatePortfolioMutation();

  console.log('accessToken@@@@@@@@@@@@@@@@', accessToken);

  const handleSubmit = (portfolioName: string) => {
    setOpen(false);
    mutate?.(portfolioName);
  };

  return (
    <Container>
      <Header title="" showBackButton={false} />

      <View className="flex-1 justify-between pt-[48px]">
        <View className="gap-y-[24px]">
          <Text className="px-[20px] text-2xl font-bold">
            {'당신의 포트폴리오를\n만들어보세요.'}
          </Text>
          <ImageCarousel images={CAROUSEL_IMAGES} height={240} />
        </View>
        <View className="gap-y-[12px] px-[20px]">
          <Link href="/login">
            <Text className="text-link text-center text-sm">이미 가입된 계정이 있으신가요?</Text>
          </Link>
          <CreatePortfolioDialog open={open} onOpenChange={setOpen} onSubmit={handleSubmit} />
        </View>
      </View>
    </Container>
  );
}
