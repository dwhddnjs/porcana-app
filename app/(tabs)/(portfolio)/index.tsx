import { LargeHeader } from '@/components/large-header';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { PressableScale } from 'pressto';
import { ArrowRight } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { RoundAddButton } from '@/components/portfolio/round-add-button';
import { useRouter } from 'expo-router';

export default function PortfolioScreen() {
  const router = useRouter();

  return (
    <View className="flex-1">
      <LargeHeader title="포트폴리오">
        <View className="relative gap-4 p-4">
          <Text className="text-muted-foreground">내 자산을 관리하세요</Text>

          {/* 스크롤 테스트용 카드들 */}
          {Array.from({ length: 10 }).map((_, index) => (
            <View key={index} className="bg-card rounded-lg p-4">
              <Text className="text-lg font-semibold">자산 {index + 1}</Text>
              <Text className="text-muted-foreground mt-1">스크롤 테스트 항목입니다</Text>
            </View>
          ))}
        </View>
      </LargeHeader>
      {/* <RoundAddButton onPress={() => router.push('/(tabs)/(portfolio)/add-modal')} /> */}
    </View>
  );
}
