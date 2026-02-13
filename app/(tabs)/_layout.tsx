import { Icon } from '@/components/ui/icon';
import { CreatePortfolioDialog } from '@/components/portfolio/create-portfolio-dialog';
import { useCreatePortfolioMutation } from '@/lib/hooks/mutation/portfolio';
import { THEME } from '@/lib/theme';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { PieChartIcon, PlusIcon, UserIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useUniwind } from 'uniwind';
import { PressableScale } from 'pressto';

export default function TabLayout() {
  const { theme } = useUniwind();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate } = useCreatePortfolioMutation();

  const handleAddButtonPress = () => {
    setDialogOpen(true);
  };

  const handleCreatePortfolio = (portfolioName: string) => {
    setDialogOpen(false);
    mutate(portfolioName);
  };

  return (
    <>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: theme === 'dark' ? THEME.dark.foreground : THEME.light.foreground,
          tabBarInactiveTintColor:
            theme === 'dark' ? THEME.dark.mutedForeground : THEME.light.mutedForeground,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopColor: theme === 'dark' ? THEME.dark.border : THEME.light.border,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={80}
              tint={theme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ),
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
              <PressableScale
                onPress={handleAddButtonPress}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View
                  className="bg-card border-primary items-center justify-center rounded-full border"
                  style={{ width: 48, height: 48, marginTop: -12 }}>
                  <Icon as={PlusIcon} size={32} className="text-primary" />
                </View>
              </PressableScale>
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
      <CreatePortfolioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreatePortfolio}
        showTrigger={false}
      />
    </>
  );
}
