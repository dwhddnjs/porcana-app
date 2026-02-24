import { View, Image, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoogleAuth } from '@/lib/hooks/mutation/google-auth';
import { useAppleAuth } from '@/lib/hooks/mutation/apple-auth';

export default function LoginSheet() {
  const insets = useSafeAreaInsets();
  const { handleGoogleLogin, isLoading: isGoogleLoading } = useGoogleAuth();
  const { handleAppleLogin, isLoading: isAppleLoading } = useAppleAuth();

  const handleEmailLogin = () => {
    router.replace('/enter-nickname');
  };

  return (
    <View className="bg-background flex-1 px-4" style={{ paddingBottom: insets.bottom + 16 }}>
      {/* 드래그 핸들 */}
      <View className="items-center py-3">
        <View className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
      </View>

      {/* 로그인 버튼들 */}
      <View className="gap-3 pt-[24px]">
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
          variant="outline"
          size="lg"
          className="w-full flex-row items-center justify-center gap-3"
          onPress={handleEmailLogin}>
          <Icon as={Mail} className="text-foreground size-5" />
          <Text className="font-semibold">이메일로 로그인</Text>
        </Button>
      </View>
    </View>
  );
}
