import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import Container from '@/components/container';
import { Header } from '@/components/ui/header';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { CreatePortfolioDialog } from '@/components/portfolio/create-portfolio-dialog';
import { Link, useRouter } from 'expo-router';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useCreatePortfolioMutation } from '@/lib/hooks/mutation/portfolio';
import { CAROUSEL_ITEMS } from '@/lib/constant/variables';

export default function LandingScreen() {
  const { accessToken, refreshToken, user, reset } = useUserStore();

  const [open, setOpen] = useState(false);
  const { mutate } = useCreatePortfolioMutation();

  const handleSubmit = (portfolioName: string) => {
    setOpen(false);
    mutate?.(portfolioName);
  };

  // useEffect(() => {
  //   reset();
  // }, [accessToken, refreshToken, user]);

  return (
    <Container>
      <Header title="" showBackButton={false} />

      <View className="flex-1 justify-between pt-[48px]">
        <ImageCarousel items={CAROUSEL_ITEMS} imageHeight={240} />

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
