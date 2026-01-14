import { Icon } from '@/components/ui/icon';
import { THEME } from '@/lib/theme';
import { Tabs } from 'expo-router';
import { NewspaperIcon, PieChartIcon, UserIcon } from 'lucide-react-native';
import { useUniwind } from 'uniwind';

export default function TabLayout() {
  const { theme } = useUniwind();

  return (
    <Tabs
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
        name="(portfolio)"
        options={{
          title: '포트폴리오',
          tabBarIcon: ({ color, size }) => <Icon as={PieChartIcon} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(news)"
        options={{
          title: '뉴스',
          tabBarIcon: ({ color, size }) => <Icon as={NewspaperIcon} size={size} color={color} />,
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
