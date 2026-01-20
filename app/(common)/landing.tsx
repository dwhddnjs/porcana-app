import { View } from "react-native";
import { Text } from "@/components/ui/text";
import Container from "@/components/container";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { Link, useRouter } from "expo-router";

const CAROUSEL_IMAGES = [
  require("@/assets/images/coin.png"),
  require("@/assets/images/icon.png"),
  require("@/assets/images/splash.png"),
  
];

export default function LandingScreen() {

  const router = useRouter();

  return (
    <Container>
      <Header title="" showBackButton={false} />
      
      <View className="flex-1 justify-between pt-[48px]">
        <View className="gap-y-[24px]">
        <Text className="px-[20px] text-2xl font-bold">{"당신의 포트폴리오를\n만들어보세요."}</Text>
        <ImageCarousel images={CAROUSEL_IMAGES} height={240} />
        </View>
        <View className="px-[20px] gap-y-[12px]">
          <Link href="/login">
          <Text className="text-center text-link text-sm">이미 가입된 계정이 있으신가요?</Text>
          </Link>
          <Button size={"lg"} onPress={() => router.push("/add-modal")}>
            <Text>시작하기</Text>
          </Button>
        </View>
      </View>
    </Container>
  );
}