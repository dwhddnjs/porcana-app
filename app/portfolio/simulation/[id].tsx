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
import { useSeedPreviewMutation } from '@/lib/hooks/mutation/portfolio';
import { type BaselineItemTypes } from '@/lib/api/portfolio';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Keyboard, Platform, Pressable, TextInput, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner-native';
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Spacer } from '@/components/ui/spacer';

const formatWithComma = (value: string): string => {
  const num = value.replace(/[^0-9]/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

type AnimatedBaselineItemPropsTypes = {
  item: BaselineItemTypes;
  index: number;
  currencyUnit: string;
  showTopBorder: boolean;
};

const AnimatedBaselineItem = ({
  item,
  index,
  currencyUnit,
  showTopBorder,
}: AnimatedBaselineItemPropsTypes) => (
  <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
    <BaselineItem item={item} currencyUnit={currencyUnit} showTopBorder={showTopBorder} />
  </Animated.View>
);

export default function SimulationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [seedMoney, setSeedMoney] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<Option>({ value: 'KRW', label: 'KRW' });
  const [previewVersion, setPreviewVersion] = useState(0);
  const [hasExpanded, setHasExpanded] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const { mutate: fetchSeedPreview, data: baselineData, isPending } = useSeedPreviewMutation();

  print('baselineData', baselineData);

  const titleOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 400 });
    inputOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
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

    Keyboard.dismiss();

    fetchSeedPreview(
      { portfolioId: id, seedMoney: amount, baseCurrency: baseCurrency?.value },
      {
        onSuccess: () => {
          setHasExpanded(true);
          setPreviewVersion((v) => v + 1);
        },
        onError: () => {
          toast.error('시드 설정에 실패했습니다');
        },
      }
    );
  }, [id, seedMoney, baseCurrency, fetchSeedPreview]);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  const handleShouldSetResponder = useCallback(() => true, []);

  const handleResponderRelease = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const currencyUnit = baseCurrency?.value === 'USD' ? '$' : '원';

  const renderItem = useCallback(
    ({ item, index }: { item: BaselineItemTypes; index: number }) => (
      <AnimatedBaselineItem
        item={item}
        index={index}
        currencyUnit={currencyUnit}
        showTopBorder={index === 0}
      />
    ),
    [currencyUnit]
  );

  const keyExtractor = useCallback(
    (item: BaselineItemTypes) => `${previewVersion}-${item.assetId}`,
    [previewVersion]
  );

  return (
    <Container isKeyboardAvoiding>
      <View className="flex-row items-center px-[16px] py-[12px]">
        <Pressable onPress={handleGoBack} hitSlop={8}>
          <Icon as={ChevronLeft} size={24} className="text-foreground" />
        </Pressable>
      </View>

      <View className="flex-1 px-[16px] pt-[12px]">
        <Animated.View
          layout={LinearTransition.duration(800)}
          onStartShouldSetResponder={handleShouldSetResponder}
          onResponderRelease={handleResponderRelease}
          className={
            hasExpanded
              ? ''
              : isKeyboardVisible
                ? 'flex-1 justify-center'
                : 'flex-1 justify-center pb-[80px]'
          }>
          <Animated.View style={titleAnimatedStyle}>
            <Text className="text-2xl font-bold">시드머니를 설정하세요</Text>
            <Text className="text-muted-foreground mt-[8px] text-sm">
              투자할 금액을 입력하면 자산별 매수 수량을 계산합니다
            </Text>
          </Animated.View>

          <Animated.View style={inputAnimatedStyle} className="mt-[24px]">
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
                      style={{ position: 'absolute', top: -26, right: 16 }}>
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
                  <SelectTrigger className="bg-card border-muted h-[34px] rounded-full border px-3">
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
              className="bg-primary mt-[8px] items-center rounded-full py-[12px]"
              style={({ pressed }) => ({ opacity: pressed || isPending ? 0.7 : 1 })}>
              <Text className="text-primary-foreground text-lg font-semibold">미리보기</Text>
            </Pressable>
            {/* <Spacer height={120} /> */}
          </Animated.View>
        </Animated.View>

        {baselineData && (
          <Animated.View entering={FadeInDown.duration(400)} className="mt-[24px] flex-1">
            <View className="bg-primary/5 mb-[12px] flex-row rounded-xl px-[12px] py-[14px]">
              <View className="flex-1 items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">시드머니</Text>
                <Text
                  className="text-base font-bold"
                  adjustsFontSizeToFit
                  numberOfLines={1}>
                  {baselineData.seedMoney.toLocaleString()}
                  {currencyUnit}
                </Text>
              </View>
              <View className="flex-1 items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">총 자산가치</Text>
                <Text
                  className="text-base font-bold"
                  adjustsFontSizeToFit
                  numberOfLines={1}>
                  {Math.round(baselineData.totalValue).toLocaleString()}
                  {currencyUnit}
                </Text>
              </View>
              <View className="flex-1 items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">현금 잔고</Text>
                <Text
                  className="text-base font-bold"
                  adjustsFontSizeToFit
                  numberOfLines={1}>
                  {Math.round(baselineData.cashAmount).toLocaleString()}
                  {currencyUnit}
                </Text>
              </View>
            </View>

            <FlashList
              data={baselineData.items}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <Text className="text-muted-foreground mt-[12px] mb-[8px] text-sm font-bold">
                  자산 배분
                </Text>
              }
              ListFooterComponent={<View className="h-[120px]" />}
            />
          </Animated.View>
        )}
      </View>
    </Container>
  );
}
