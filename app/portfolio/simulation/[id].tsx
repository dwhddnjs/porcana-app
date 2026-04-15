import Container from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { BaselineItem } from '@/components/portfolio/baseline-item';
import { useSimulationSeedMutation } from '@/lib/hooks/mutation/portfolio';
import { type BaselineResponseTypes } from '@/lib/api/portfolio';
import { ChevronLeft, Wallet } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const formatWithComma = (value: string): string => {
  const num = value.replace(/[^0-9]/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseComma = (value: string): number => {
  return parseInt(value.replace(/,/g, ''), 10) || 0;
};

const formatKoreanUnit = (value: number): string => {
  if (value === 0) return '0';
  const eok = Math.floor(value / 100_000_000);
  const man = Math.floor((value % 100_000_000) / 10_000);
  const rest = value % 10_000;

  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString()}억`);
  if (man > 0) parts.push(`${man.toLocaleString()}만`);
  if (rest > 0) parts.push(rest.toLocaleString());

  return parts.join(' ');
};

export default function SimulationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { mutate: setSeed, isPending } = useSimulationSeedMutation();
  const inputRef = useRef<TextInput>(null);

  const [seedMoney, setSeedMoney] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<Option>({ value: 'KRW', label: 'KRW' });
  const [baselineData, setBaselineData] = useState<BaselineResponseTypes | null>(null);

  // 애니메이션 shared values
  const titleOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(0);
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(50);

  // Phase 1: 진입 애니메이션
  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 400 });
    inputOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  const handleSeedMoneyChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setSeedMoney(cleaned);
  }, []);

  const handleInputFocus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleCurrencyChange = useCallback((option: Option) => {
    setBaseCurrency(option);
  }, []);

  const handleSetSeed = useCallback(() => {
    if (!id) return;
    const amount = parseInt(seedMoney, 10) || 0;
    if (amount <= 0) {
      toast.error('금액을 입력해주세요');
      return;
    }

    // Phase 3: 시드 변경 시 리스트 fade out
    if (baselineData) {
      listOpacity.value = withTiming(0, { duration: 200 });
    }


    setSeed(
      { portfolioId: id, seedMoney: amount, baseCurrency: baseCurrency?.value },
      {
        onSuccess: (data) => {
          setBaselineData(data);

          if (!baselineData) {
            // Phase 2: 최초 설정 - 헤더 위로 이동 + 리스트 등장
            headerTranslateY.value = withTiming(-120, {
              duration: 500,
              easing: Easing.out(Easing.ease),
            });
            listOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
            listTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 200 }));
          } else {
            // Phase 3: 변경 - 리스트 fade in
            listOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
            listTranslateY.value = 0;
          }
        },
        onError: () => {
          toast.error('시드 설정에 실패했습니다');
          if (baselineData) {
            listOpacity.value = withTiming(1, { duration: 200 });
          }
        },
      }
    );
  }, [
    id,
    seedMoney,
    baseCurrency,
    baselineData,
    setSeed,
    headerTranslateY,
    listOpacity,
    listTranslateY,
  ]);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  const hasResult = baselineData !== null;

  return (
    <Container isKeyboardAvoiding>
      <View className="flex-row items-center px-[16px] py-[12px]">
        <Pressable onPress={handleGoBack} hitSlop={8}>
          <Icon as={ChevronLeft} size={24} className="text-foreground" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={headerAnimatedStyle}>
          <Animated.View style={titleAnimatedStyle} className="mt-[40px]">
            <Text className="text-2xl font-bold">시드머니를 설정하세요</Text>
            <Text className="text-muted-foreground mt-[8px] text-sm">
              투자할 금액을 입력하면 자산별 매수 수량을 계산합니다
            </Text>
          </Animated.View>

          <Animated.View style={inputAnimatedStyle} className="mt-[32px]">
            <View className="items-center py-[24px]">
              <TextInput
                ref={inputRef}
                value={seedMoney}
                onChangeText={handleSeedMoneyChange}
                keyboardType="numeric"
                style={{ position: 'absolute', opacity: 0, height: 0 }}
              />
              <View className="w-full">
                <Pressable onPress={handleInputFocus} className="px-[16px]">
                  {seedMoney && parseInt(seedMoney, 10) >= 10000 && (
                    <Text
                      className="text-muted-foreground text-right text-sm font-semibold"
                      style={{ position: 'absolute', top: -24, right: 16 }}>
                      {formatKoreanUnit(parseInt(seedMoney, 10))}
                      {baseCurrency?.value === 'USD' ? '달러' : '원'}
                    </Text>
                  )}
                  <Text
                    className={`text-center text-5xl font-bold ${seedMoney ? 'text-foreground' : 'text-muted'}`}
                    adjustsFontSizeToFit
                    numberOfLines={1}>
                    {seedMoney ? formatWithComma(seedMoney) : '0'}
                    <Text className="text-2xl">{baseCurrency?.value === 'USD' ? ' $' : ' 원'}</Text>
                  </Text>
                </Pressable>
              </View>
              <View className="mt-[12px] h-[32px] min-w-[80px]">
                <Select value={baseCurrency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="bg-card border-muted rounded-full border px-3">
                    <SelectValue
                      className="text-muted-foreground text-md font-semibold"
                      placeholder="통화"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KRW" label="KRW" />
                    <SelectItem value="USD" label="USD" />
                  </SelectContent>
                </Select>
              </View>
            </View>

            <Pressable
              onPress={handleSetSeed}
              disabled={isPending}
              className="bg-primary mt-[16px] items-center rounded-lg py-[14px]"
              style={({ pressed }) => ({ opacity: pressed || isPending ? 0.7 : 1 })}>
              <Text className="text-primary-foreground text-base font-semibold">
                {hasResult ? '변경하기' : '설정하기'}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>

        {hasResult && baselineData && (
          <Animated.View style={listAnimatedStyle} className="mt-[32px]">
            <View className="bg-primary/5 mb-[16px] flex-row justify-between rounded-xl px-[16px] py-[14px]">
              <View className="items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">시드머니</Text>
                <Text className="text-base font-bold">
                  {baselineData.seedMoney.toLocaleString()}원
                </Text>
              </View>
              <View className="items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">총 자산가치</Text>
                <Text className="text-base font-bold">
                  {Math.round(baselineData.totalValue).toLocaleString()}원
                </Text>
              </View>
              <View className="items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">현금 잔고</Text>
                <Text className="text-base font-bold">
                  {Math.round(baselineData.cashAmount).toLocaleString()}원
                </Text>
              </View>
            </View>

            <Text className="text-muted-foreground mb-[8px] text-sm font-bold">자산 배분</Text>
            {baselineData.items.map((item, index) => (
              <BaselineItem key={item.assetId} item={item} showTopBorder={index === 0} />
            ))}

            <View className="h-[120px]" />
          </Animated.View>
        )}
      </ScrollView>
    </Container>
  );
}
