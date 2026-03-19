import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import Container from '@/components/container';

export default function CustomPortfolio() {
  return (
    <Container>
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold">커스텀 포트폴리오</Text>
      </View>
    </Container>
  );
}
