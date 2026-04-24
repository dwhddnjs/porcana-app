import { Image, Platform, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowRight } from 'lucide-react-native';

type StartSimulationCardPropsTypes = {
  onPress: () => void;
};

export const StartSimulationCard = ({ onPress }: StartSimulationCardPropsTypes) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
      className="mb-[16px]">
      <View className="bg-card border-primary/10 relative overflow-hidden rounded-2xl border">
        <LinearGradient
          colors={['hsla(142 71% 45% / 0.18)', 'hsla(43 96% 56% / 0.14)', 'hsla(0 0% 100% / 0)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 240,
            height: 240,
            borderRadius: 120,
          }}
        />
        <View
          className="bg-weight-muted absolute"
          style={{
            top: -30,
            right: -10,
            width: 140,
            height: 140,
            borderRadius: 70,
            opacity: 0.55,
          }}
        />

        <View className="px-[20px] py-[22px]">
          <View className="bg-weight-muted self-start rounded-full px-[10px] py-[4px]">
            <Text className="text-weight text-xs font-semibold">시작 가이드</Text>
          </View>
          <View className="mt-[12px] pr-[90px]">
            <Text className="text-foreground text-lg font-bold">투자 금액을 설정해보세요</Text>
            <Text className="text-muted-foreground mt-[6px] text-sm leading-5">
              시드 금액을 입력하면 각 종목별
            </Text>
            <Text className="text-muted-foreground text-sm leading-5">
              매수 수량을 자동으로 계산해드려요
            </Text>
          </View>

          <View
            className="bg-weight absolute items-center justify-center"
            style={{
              right: 16,
              bottom: 16,
              width: 40,
              height: 40,
              borderRadius: 22,
            }}>
            <Icon as={ArrowRight} size={20} className="text-primary-foreground" />
          </View>
        </View>
      </View>

      <Image
        source={require('@/assets/images/money.png')}
        style={{
          position: 'absolute',
          right: -14,
          top: -15,
          width: 110,
          height: 110,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
            },
            android: {},
          }),
        }}
        resizeMode="contain"
      />
    </Pressable>
  );
};
