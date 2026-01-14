import { LargeHeader } from '@/components/large-header';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export default function MypageScreen() {
  return (
    <LargeHeader title="마이페이지">
      <View className="gap-4 p-4">
        <Text className="text-muted-foreground">내 정보를 확인하세요</Text>

        {/* 스크롤 테스트용 메뉴 항목들 */}
        {Array.from({ length: 10 }).map((_, index) => (
          <View key={index} className="bg-card rounded-lg p-4">
            <Text className="text-lg font-semibold">설정 메뉴 {index + 1}</Text>
            <Text className="text-muted-foreground mt-1">메뉴 설명입니다</Text>
          </View>
        ))}
      </View>
    </LargeHeader>
  );
}
