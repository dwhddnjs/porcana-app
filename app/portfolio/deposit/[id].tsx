import Container from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Header } from '@/components/ui/header';
import { AmountInput } from '@/components/portfolio/amount-input';
import { AnimatedListItem } from '@/components/portfolio/animated-list-item';
import { TopUpRecommendationItem } from '@/components/portfolio/top-up-recommendation-item';
import { useGetHoldingBaselineQuery } from '@/lib/hooks/query/portfolio';
import { useExecuteTopUpMutation, useGetTopUpPlanMutation } from '@/lib/hooks/mutation/portfolio';
import { useKeyboardVisible } from '@/lib/hooks/use-keyboard-visible';
import { formatCompactValue } from '@/lib/constant/function';
import { type TopUpRecommendationTypes } from '@/lib/api/portfolio';
import { FlashList } from '@shopify/flash-list';
import { ArrowRight } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Keyboard, Pressable, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner-native';
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export default function DepositScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [depositAmount, setDepositAmount] = useState('');
  const [hasExpanded, setHasExpanded] = useState(false);
  const [planVersion, setPlanVersion] = useState(0);

  const isKeyboardVisible = useKeyboardVisible();

  const { data: holdingData } = useGetHoldingBaselineQuery(id);
  const {
    mutate: fetchTopUpPlan,
    data: topUpPlanData,
    isPending,
    reset: resetTopUpPlan,
  } = useGetTopUpPlanMutation();
  const { mutate: executeTopUp, isPending: isExecuting } = useExecuteTopUpMutation();

  const isUsd = holdingData?.baseCurrency === 'USD';
  const currencyUnit = isUsd ? '$' : '₩';

  const imageUrlMap = useMemo(() => {
    const map: Record<string, string | string[] | null> = {};
    holdingData?.items?.forEach((item) => {
      map[item.assetId] = item.imageUrl ?? null;
    });
    return map;
  }, [holdingData?.items]);

  const titleOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 400 });
    inputOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const inputAnimatedStyle = useAnimatedStyle(() => ({ opacity: inputOpacity.value }));

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const handleAmountChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9]/g, '');
      setDepositAmount(cleaned);
      if (hasExpanded) {
        setHasExpanded(false);
        resetTopUpPlan();
      }
    },
    [hasExpanded, resetTopUpPlan]
  );

  const handleFetchPlan = useCallback(() => {
    if (!id) return;
    const amount = parseInt(depositAmount, 10) || 0;
    if (amount <= 0) {
      toast.error('금액을 입력해주세요');
      return;
    }
    Keyboard.dismiss();
    fetchTopUpPlan(
      { portfolioId: id, additionalCash: amount },
      {
        onSuccess: () => {
          setHasExpanded(true);
          setPlanVersion((v) => v + 1);
        },
        onError: () => {
          toast.error('추천안 조회에 실패했습니다');
        },
      }
    );
  }, [id, depositAmount, fetchTopUpPlan]);

  const handleExecuteTopUp = useCallback(() => {
    if (!id || !topUpPlanData || isExecuting) return;
    const amount = parseInt(depositAmount, 10) || 0;

    const purchases = topUpPlanData.recommendations
      .filter((r) => r.recommendedQuantity > 0)
      .map((r) => ({
        assetId: r.assetId,
        quantity: r.recommendedQuantity,
        purchasePrice: r.currentPrice,
      }));

    if (purchases.length === 0) {
      toast.error('매수할 종목이 없습니다');
      return;
    }

    executeTopUp(
      { portfolioId: id, additionalCash: amount, purchases, addRemainingCashToBaseline: true },
      {
        onSuccess: () => {
          toast.success('추가 입금이 반영되었습니다');
          router.replace(`/portfolio/holding/${id}`);
        },
        onError: () => {
          toast.error('추가 입금에 실패했습니다');
        },
      }
    );
  }, [id, depositAmount, topUpPlanData, isExecuting, executeTopUp, router]);

  const handleShouldSetResponder = useCallback(() => true, []);

  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: TopUpRecommendationTypes; index: number }) => (
      <AnimatedListItem index={index}>
        <TopUpRecommendationItem
          item={item}
          currencyUnit={currencyUnit}
          imageUrl={imageUrlMap[item.assetId]}
        />
      </AnimatedListItem>
    ),
    [currencyUnit, imageUrlMap]
  );

  const keyExtractor = useCallback(
    (item: TopUpRecommendationTypes) => `${planVersion}-${item.assetId}`,
    [planVersion]
  );

  const listHeaderComponent = useMemo(
    () => (
      <Text className="text-muted-foreground mt-[12px] mb-[8px] text-sm font-bold">
        추천 매수 종목
      </Text>
    ),
    []
  );

  const listFooterComponent = useMemo(() => <View className="h-[120px]" />, []);

  return (
    <Container isKeyboardAvoiding>
      <Header showBackButton onBackPress={handleGoBack} />

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
            <Text className="text-2xl font-bold">추가 입금할 금액을 입력하세요</Text>
            <Text className="text-muted-foreground mt-[8px] text-sm">
              입금 금액에 맞춰 추천 매수 종목을 알려드립니다
            </Text>
          </Animated.View>

          <Animated.View style={inputAnimatedStyle} className="mt-[24px]">
            <AmountInput value={depositAmount} onChangeText={handleAmountChange} isUsd={isUsd} />

            {!hasExpanded && (
              <Pressable
                onPress={handleFetchPlan}
                disabled={isPending}
                className="bg-primary mt-[8px] items-center rounded-full py-[12px]"
                style={({ pressed }) => ({ opacity: pressed || isPending ? 0.7 : 1 })}>
                <Text className="text-primary-foreground text-lg font-semibold">추천안 보기</Text>
              </Pressable>
            )}
          </Animated.View>
        </Animated.View>

        {topUpPlanData && hasExpanded && (
          <Animated.View entering={FadeInDown.duration(400)} className="flex-1">
            <View className="bg-card mb-[12px] flex-row items-center justify-evenly rounded-xl py-[14px]">
              <View className="items-center gap-[2px]">
                <Text className="text-muted-foreground text-xs">현재 총액</Text>
                <Text className="text-base font-bold">
                  {formatCompactValue(topUpPlanData.currentTotalValue, currencyUnit, isUsd)}
                </Text>
              </View>
              <Icon as={ArrowRight} size={16} className="text-muted-foreground" />
              <View className="items-center gap-[2px]">
                <Text className="text-muted-foreground text-xs">추가 후</Text>
                <Text className="text-base font-bold">
                  {formatCompactValue(topUpPlanData.newTotalValue, currencyUnit, isUsd)}
                </Text>
              </View>
            </View>

            <FlashList
              data={topUpPlanData.recommendations}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={listHeaderComponent}
              ListFooterComponent={listFooterComponent}
            />
          </Animated.View>
        )}
      </View>

      {topUpPlanData && hasExpanded && (
        <View className="border-border px-[16px] pt-[8px] pb-[16px]">
          <Pressable
            onPress={handleExecuteTopUp}
            disabled={isExecuting}
            className="bg-primary items-center rounded-full py-[14px]"
            style={({ pressed }) => ({ opacity: pressed || isExecuting ? 0.7 : 1 })}>
            <Text className="text-primary-foreground text-lg font-bold">매수 완료 반영</Text>
          </Pressable>
        </View>
      )}
    </Container>
  );
}
