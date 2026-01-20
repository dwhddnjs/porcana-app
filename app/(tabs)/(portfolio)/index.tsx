import { LargeHeader } from '@/components/large-header';
import { Text } from '@/components/ui/text';
import { Dimensions, Pressable, View } from 'react-native';
import { PressableScale } from 'pressto';
import { ArrowRight, MenuIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { RoundAddButton } from '@/components/portfolio/round-add-button';
import { useRouter } from 'expo-router';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import { useUniwind } from 'uniwind';
import { THEME } from '@/lib/theme';
import { Spacer } from '@/components/spacer';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 샘플 주식 데이터 (나중에 실제 데이터로 교체)
const generateSampleData = () => {
  // 더 다이나믹한 고정 데이터
  const values = [
    100, 105, 98, 115, 108, 125, 140, // 초반 상승
    135, 120, 95, 85, 90, // 급락
    105, 130, 155, 170, 165, // 급등
    145, 135, 150, 175, 190, // 변동 후 상승
    180, 165, 185, 210, 205, 220, 235 // 마무리 상승
  ];
  
  return values.map((value, i) => ({
    value,
    label: i % 7 === 0 ? `${i + 1}일` : '',
  }));
};

export default function PortfolioScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useUniwind();
  const { accessToken } = useUserStore()
  
  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const chartData = generateSampleData();
  const maxValue = Math.max(...chartData.map((d) => d.value));
  const minValue = Math.min(...chartData.map((d) => d.value));

  // 테마별 색상 (lib/theme.ts 참조)
  const colors = theme === 'dark' ? THEME.dark : THEME.light;
  const lineColor = colors.success;
  const gradientColor = colors.successMuted;
  const rulesColor = colors.borderMuted;

  return (
    <View className="flex-1">
      <LargeHeader
        title="포트폴리오"
        headerRight={
          <Pressable onPress={openDrawer} hitSlop={8}>
            <Icon as={MenuIcon} size={24} className="text-foreground" />
          </Pressable>
        }>
        <View className="relative gap-4 ">          
            <Spacer />
          {/* 주식 스타일 라인 차트 */}
          <View className="overflow-hidden ">
            <LineChart
              data={chartData}
              width={SCREEN_WIDTH}
              height={200}
              curved
              areaChart
              color={lineColor}
              startFillColor={gradientColor}
              endFillColor="transparent"
              thickness={2}
              hideDataPoints
              hideYAxisText
              yAxisLabelWidth={0}
              hideRules
              showXAxisIndices={false}
              xAxisLabelTextStyle={{ 
                color: colors.mutedForeground, 
                fontSize: 10,
                width: 40,
                textAlign: 'center',
              }}
              xAxisLabelsVerticalShift={0}
              backgroundColor="transparent"
              noOfSections={4}
              maxValue={maxValue + 10}
              yAxisOffset={minValue - 10}
              initialSpacing={0}
              endSpacing={0}
              spacing={SCREEN_WIDTH / (chartData.length - 1)}
              xAxisColor="transparent"
              xAxisThickness={0}
              yAxisColor="transparent"
              yAxisThickness={0}
              pointerConfig={{
                pointerStripHeight: 200,
                pointerStripColor: rulesColor,
                pointerStripWidth: 1,
                pointerColor: lineColor,
                radius: 5,
                
                pointerLabelHeight: 40,
                activatePointersOnLongPress: true,
                autoAdjustPointerLabelPosition: true,
                pointerLabelComponent: (items: { value: number }[]) => (
                  <View className="bg-primary rounded-md px-2 py-1">
                    <Text className="text-primary-foreground text-sm font-semibold">
                      ${items[0].value.toFixed(2)}
                    </Text>
                  </View>
                ),
              }}
            />
          </View>

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
