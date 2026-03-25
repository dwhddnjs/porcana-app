import { Drawer } from 'expo-router/drawer';
import { FilterDrawerContent } from '@/components/custom-portfolio/filter-drawer-content';

export default function CustomPortfolioLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={(props) => <FilterDrawerContent navigation={props.navigation} />}>
      <Drawer.Screen name="custom-portfolio" />
    </Drawer>
  );
}
