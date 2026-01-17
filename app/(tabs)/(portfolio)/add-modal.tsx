import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router, Link } from 'expo-router';
import { Button } from '@/components/ui/button';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function AddModal() {
  const isPresented = router.canGoBack();

  const handleCreatePortfolio = async () => {
    // 먼저 가로모드로 전환
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
    
    // 방향 전환 후 네비게이션
    router.dismiss();
    router.push('/(portfolio)/create-portfolio');
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Text>Modal screen</Text>
      {isPresented && <Link href="../">Dismiss modal</Link>}
      <Button onPress={handleCreatePortfolio}>
        <Text>포트폴리오 생성</Text>
      </Button>
    </View>
  );
}
