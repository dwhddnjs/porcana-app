import { LargeHeader } from '@/components/large-header';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export default function NewsScreen() {
  return (
    <LargeHeader title="뉴스">
      <View className="gap-4 p-4">
        <Text className="text-muted-foreground">최신 소식을 확인하세요</Text>

        {/* 스크롤 테스트용 뉴스 카드들 */}
        {Array.from({ length: 10 }).map((_, index) => (
          <View key={index} className="bg-card rounded-lg p-4">
            <Text className="text-lg font-semibold">뉴스 헤드라인 {index + 1}</Text>
            <Text className="text-muted-foreground mt-1">뉴스 내용 미리보기...</Text>
          </View>
        ))}
      </View>
    </LargeHeader>
  );
}
