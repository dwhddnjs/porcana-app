import { Drawer } from 'expo-router/drawer';
import { Platform } from 'react-native';
import { PortfolioDrawerContent } from '@/components/portfolio/drawer-content';

export default function PortfolioLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        swipeEnabled: false,
        drawerStyle: {
          width: '75%',
        },
      }}
      drawerContent={(props) => <PortfolioDrawerContent {...props} />}>
      <Drawer.Screen name="index" />
    </Drawer>
  );
}
