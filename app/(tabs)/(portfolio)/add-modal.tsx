import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router, Link } from 'expo-router';

export default function AddModal() {
  const isPresented = router.canGoBack();

  return (
    <View className="flex-1 items-center justify-center">
      <Text>Modal screen</Text>
      {isPresented && <Link href="../">Dismiss modal</Link>}
    </View>
  );
}
