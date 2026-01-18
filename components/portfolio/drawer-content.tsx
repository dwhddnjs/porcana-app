import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function PortfolioDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flex: 1,
        paddingTop: insets.top,
      }}>
      <View className="flex-1 p-4">
        <Text className="text-xl font-bold mb-4">메뉴</Text>

        {/* Placeholder - 나중에 메뉴 항목 추가 */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">메뉴 항목이 여기에 표시됩니다</Text>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}
