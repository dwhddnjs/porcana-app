import { Drawer } from "expo-router/drawer";
import { View, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { useSelectedCardsStore } from "@/lib/hooks/use-selected-cards-store";
import Animated, { FadeIn } from "react-native-reanimated";

function CustomDrawerContent() {
  const { selectedCards } = useSelectedCardsStore();

  return (
    <View className="flex-1 bg-background pt-12 px-4">
      <Text className="text-xl font-bold text-primary mb-4">
        선택된 카드 덱
      </Text>
      <Text className="text-sm text-muted-foreground mb-4">
        {selectedCards.length}개의 카드가 선택됨
      </Text>
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {selectedCards.length === 0 ? (
          <Text className="text-muted-foreground text-center mt-8">
            아직 선택된 카드가 없습니다
          </Text>
        ) : (
          <View className="gap-2">
            {selectedCards.map((card, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.duration(200).delay(index * 30)}
                className="bg-primary/10 rounded-lg px-4 py-3 flex-row items-center gap-3"
              >
                <Text className="text-xs text-muted-foreground w-6">
                  #{index + 1}
                </Text>
                <Text className="font-bold text-primary text-lg flex-1">
                  {card}
                </Text>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function CreatePortfolioLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerType: "front",
        drawerStyle: {
          width: 280,
        },
      }}
      drawerContent={() => <CustomDrawerContent />}
    >
      <Drawer.Screen name="index" />
    </Drawer>
  );
}
