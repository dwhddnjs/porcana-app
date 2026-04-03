import { Drawer } from 'expo-router/drawer';
import { FilterDrawerContent } from '@/components/custom-portfolio/filter-drawer-content';

export default function CustomPortfolioLayout() {
  return (
    <Drawer
      defaultStatus="closed"
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'front',
        swipeEnabled: false,
        drawerStyle: {
          width: 300,
          backgroundColor: 'transparent',
        },
      }}
      drawerContent={(props) => <FilterDrawerContent navigation={props.navigation} />}>
      <Drawer.Screen name="custom-portfolio" />
    </Drawer>
  );
}
