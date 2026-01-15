import { Icon } from '@/components/ui/icon';
import { THEME } from '@/lib/theme';
import { Tabs, router, usePathname } from 'expo-router';
import { NewspaperIcon, PieChartIcon, PlusIcon, UserIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useUniwind } from 'uniwind';

export default function TabLayout() {
  const { theme } = useUniwind();
  const pathname = usePathname();

  const handleAddButtonPress = () => {
    // 모달이 열려있으면 닫고, 닫혀있으면 열기
    if (pathname === '/add-modal') {
      router.back();
    } else {
      router.push('/add-modal');
    }
  };

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: theme === 'dark' ? THEME.dark.foreground : THEME.light.foreground,
        tabBarInactiveTintColor:
          theme === 'dark' ? THEME.dark.mutedForeground : THEME.light.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme === 'dark' ? THEME.dark.background : THEME.light.background,
          borderTopColor: theme === 'dark' ? THEME.dark.border : THEME.light.border,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="(portfolio)"
        options={{
          title: '포트폴리오',
          tabBarIcon: ({ color, size }) => <Icon as={PieChartIcon} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-button"
        options={{
          title: '',
          tabBarButton: () => (
            <Pressable
              onPress={handleAddButtonPress}
              className="items-center justify-center"
              style={{ flex: 1 }}>
              <View
                className="bg-primary items-center justify-center rounded-full"
                style={{ width: 48, height: 48, marginTop: -12 }}>
                <Icon as={PlusIcon} size={32} className="text-primary-foreground" />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="(mypage)"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color, size }) => <Icon as={UserIcon} size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
