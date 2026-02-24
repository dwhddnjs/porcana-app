import { Drawer } from 'expo-router/drawer';
import { View, ScrollView, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useArenaStore } from '@/lib/hooks/zustand/use-arena-store';
import { Building2 } from 'lucide-react-native';
import { Image } from '@/components/ui/image';
import { getRiskStarColor } from '@/lib/constant/function';

function CustomDrawerContent() {
  const { selectedCards } = useArenaStore();
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View className="bg-background flex-1 px-4 pt-12">
      <View className="gap-y-2">
        <Text className="text-primary text-xl font-bold">선택된 카드 덱</Text>
        <Text className="text-muted-foreground mb-4 text-sm">
          {selectedCards.length}개의 카드가 선택됨
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}>
        {selectedCards.length === 0 ? (
          <Text className="text-muted-foreground text-md mt-10 text-center">
            아직 선택된 카드가 없습니다
          </Text>
        ) : (
          <View className="gap-2">
            {selectedCards.map((card, index) => (
              <View
                key={card.assetId}
                className="bg-card border-border flex-row items-center gap-2 rounded-lg border p-2">
                {/* 이미지 */}
                <Image
                  source={card.imageUrl}
                  className="bg-background h-8 w-8 rounded-full"
                  contentFit="contain"
                  emptyIconClassName="size-4"
                />

                {/* 정보 */}
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="text-foreground max-w-[140px] text-sm font-semibold text-ellipsis">
                    {card.name}
                  </Text>
                  <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                    {card.ticker}
                  </Text>
                </View>

                {/* 리스크 */}
                <View
                  className="h-6 w-6 items-center justify-center rounded-full border-[1.5px]"
                  style={{ borderColor: getRiskStarColor(card.currentRiskLevel, colorScheme) }}>
                  <Text
                    style={{
                      color: getRiskStarColor(card.currentRiskLevel, colorScheme),
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                      lineHeight: 20,
                    }}
                    className="text-xs font-bold">
                    {card.currentRiskLevel}
                  </Text>
                </View>
              </View>
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
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
      }}
      drawerContent={() => <CustomDrawerContent />}>
      <Drawer.Screen name="start-arena" />
      <Drawer.Screen
        name="complete"
        options={{
          swipeEnabled: false, // 완료 페이지에서는 Drawer 스와이프 비활성화
        }}
      />
    </Drawer>
  );
}
