import Container from '@/components/container';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useAppleAuth } from '@/lib/hooks/mutation/apple-auth';
import { useGoogleAuth } from '@/lib/hooks/mutation/google-auth';
import { router } from 'expo-router';
import { ChevronDown, Mail } from 'lucide-react-native';
import { ActivityIndicator, View, Text, useColorScheme } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Image } from '@/components/ui/image';
import { Header } from '@/components/ui/header';
import { Spacer } from '@/components/spacer';

const logoWhite = require('@/assets/images/logo-white.png');
const logoBlack = require('@/assets/images/logo-black.png');

export default function Login() {
  const colorScheme = useColorScheme();
  const { handleGoogleLogin, isLoading: isGoogleLoading } = useGoogleAuth();
  const { handleAppleLogin, isLoading: isAppleLoading } = useAppleAuth();

  const handleEmailLogin = () => {
    router.replace('/email-login');
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/(common)/landing');
    }
  };

  return (
    <Container>
      <Header title="" backIcon={ChevronDown} onBackPress={handleBackPress} />
      <View className="flex-1 items-center justify-center">
        <View className="items-center gap-1">
          <Image source={colorScheme === 'dark' ? logoWhite : logoBlack} className="size-24" />
        </View>
      </View>
      <View className="gap-3 px-5">
        {/* 구글 로그인 */}
        <Button
          size="lg"
          className="w-full flex-row items-center justify-center gap-3 border-[0.5px] border-black bg-white active:bg-white/80"
          onPress={handleGoogleLogin}
          disabled={isGoogleLoading}>
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Image
                source={{ uri: 'https://img.clerk.com/static/google.png?width=160' }}
                className="size-5"
              />
              <Text className="font-semibold text-black">구글로 로그인</Text>
            </>
          )}
        </Button>

        {/* 애플 로그인 */}
        <Button
          size="lg"
          className="border-primary w-full flex-row items-center justify-center gap-3 border-[0.5px] bg-black active:bg-black/30"
          onPress={handleAppleLogin}
          disabled={isAppleLoading}>
          {isAppleLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Image
                source={{ uri: 'https://img.clerk.com/static/apple.png?width=160' }}
                className="size-5"
                tintColor="white"
              />
              <Text className="font-semibold text-white">애플로 로그인</Text>
            </>
          )}
        </Button>

        {/* 이메일 로그인 */}
        <Button
          // variant="outline"
          size="lg"
          className="bg-foreground/10 border-muted-foreground/50 w-full flex-row items-center justify-center gap-3 border-[0.5px]"
          onPress={handleEmailLogin}>
          <Icon as={Mail} className="text-foreground size-5" />
          <Text className="text-foreground font-semibold">이메일 로그인</Text>
        </Button>
      </View>
      <Spacer className="h-5" />
    </Container>
  );
}
