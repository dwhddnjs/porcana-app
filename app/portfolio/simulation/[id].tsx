import Container from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Header } from '@/components/ui/header';
import { AmountInput } from '@/components/portfolio/amount-input';
import { AnimatedListItem } from '@/components/portfolio/animated-list-item';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { BaselineItem } from '@/components/portfolio/baseline-item';
import { AmountPreviewButton } from '@/components/portfolio/amount-preview-button';
import {
  useSimulationPreviewMutation,
  useStartSimulationMutation,
} from '@/lib/hooks/mutation/simulation';
import { useKeyboardVisible } from '@/lib/hooks/use-keyboard-visible';
import { useFadeInSequence } from '@/lib/hooks/use-fade-in-sequence';
import { sanitizeDigits } from '@/lib/constant/function';
import { type SimulationBaselineItemTypes } from '@/lib/api/simulation';
import { FlashList } from '@shopify/flash-list';
import { CheckIcon } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Keyboard, Pressable, View } from 'react-native';
import { useCallback, useState } from 'react';
import { toast } from 'sonner-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

export default function SimulationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [seedMoney, setSeedMoney] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<Option>({ value: 'KRW', label: 'KRW' });
  const [previewVersion, setPreviewVersion] = useState(0);
  const [hasExpanded, setHasExpanded] = useState(false);

  const isKeyboardVisible = useKeyboardVisible();

  const {
    mutate: fetchSeedPreview,
    data: baselineData,
    isPending,
    reset: resetPreview,
  } = useSimulationPreviewMutation();
  const { mutate: confirmSeed, isPending: isConfirming } = useStartSimulationMutation();

  const { titleAnimatedStyle, inputAnimatedStyle } = useFadeInSequence();

  const isUsd = baseCurrency?.value === 'USD';
  const currencyUnit = isUsd ? '$' : '원';

  const collapsePreview = useCallback(() => {
    if (hasExpanded) {
      setHasExpanded(false);
      resetPreview();
    }
  }, [hasExpanded, resetPreview]);

  const handleSeedMoneyChange = useCallback(
    (text: string) => {
      setSeedMoney(sanitizeDigits(text));
      collapsePreview();
    },
    [collapsePreview]
  );

  const handleCurrencyChange = useCallback(
    (option: Option) => {
      setBaseCurrency(option);
      collapsePreview();
    },
    [collapsePreview]
  );

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const handleShouldSetResponder = useCallback(() => true, []);

  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
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

  // 확정 시 미리보기 응답에 담긴 seedMoney를 그대로 전송해 불일치 방지
  const handleConfirmSeed = useCallback(() => {
    if (!id || isConfirming || !baselineData) return;
    confirmSeed(
      {
        portfolioId: id,
        seedMoney: baselineData.seedMoney,
        baseCurrency: baseCurrency?.value,
      },
      {
        onSuccess: () => {
          router.replace(`/portfolio/holding/${id}`);
        },
        onError: () => {
          toast.error('시드 설정에 실패했습니다');
        },
      }
    );
  }, [id, baselineData, baseCurrency, confirmSeed, isConfirming, router]);

  const renderItem = useCallback(
    ({ item, index }: { item: SimulationBaselineItemTypes; index: number }) => (
      <AnimatedListItem index={index}>
        <BaselineItem item={item} currencyUnit={currencyUnit} showTopBorder={index === 0} />
      </AnimatedListItem>
    ),
    [currencyUnit]
  );

  const keyExtractor = useCallback(
    (item: SimulationBaselineItemTypes) => `${previewVersion}-${item.assetId}`,
    [previewVersion]
  );

  const confirmButton = baselineData ? (
    <Pressable
      onPress={handleConfirmSeed}
      hitSlop={8}
      className="bg-primary h-8 w-8 items-center justify-center rounded-full">
      <Icon as={CheckIcon} size={24} className="text-primary-foreground" />
    </Pressable>
  ) : undefined;

  return (
    <Container isKeyboardAvoiding>
      <Header showBackButton onBackPress={handleGoBack} rightContent={confirmButton} />

      <View className="flex-1 px-[16px] pt-[12px]">
        <Animated.View
          layout={LinearTransition.duration(800)}
          onStartShouldSetResponder={handleShouldSetResponder}
          onResponderRelease={handleDismissKeyboard}
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
            <AmountInput value={seedMoney} onChangeText={handleSeedMoneyChange} isUsd={isUsd}>
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
            </AmountInput>

            {!hasExpanded && (
              <AmountPreviewButton label="미리보기" onPress={handleSetSeed} isPending={isPending} />
            )}
          </Animated.View>
        </Animated.View>

        {baselineData && hasExpanded && (
          <Animated.View entering={FadeInDown.duration(400)} className="mt-[24px] flex-1">
            <View className="bg-primary/5 mb-[12px] flex-row rounded-xl px-[16px] py-[14px]">
              <View className="flex-1 items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">시드머니</Text>
                <Text className="text-base font-bold" adjustsFontSizeToFit numberOfLines={1}>
                  {baselineData.seedMoney.toLocaleString()}
                  {currencyUnit}
                </Text>
              </View>
              <View className="flex-1 items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">총 자산가치</Text>
                <Text className="text-base font-bold" adjustsFontSizeToFit numberOfLines={1}>
                  {Math.round(baselineData.totalValue).toLocaleString()}
                  {currencyUnit}
                </Text>
              </View>
              <View className="flex-1 items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">현금 잔고</Text>
                <Text className="text-base font-bold" adjustsFontSizeToFit numberOfLines={1}>
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
