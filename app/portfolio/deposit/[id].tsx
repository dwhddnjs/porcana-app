import Container from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { TopUpRecommendationItem } from '@/components/portfolio/top-up-recommendation-item';
import { useGetHoldingBaselineQuery } from '@/lib/hooks/query/portfolio';
import { useExecuteTopUpMutation, useGetTopUpPlanMutation } from '@/lib/hooks/mutation/portfolio';
import { type TopUpRecommendationTypes } from '@/lib/api/portfolio';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, ArrowRight } from 'lucide-react-native';
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

const formatCompactValue = (value: number, currencyUnit: string): string => {
  if (value >= 100_000_000) {
    const eok = (value / 100_000_000).toFixed(1);
    return `${currencyUnit}${eok}억`;
  }
  if (value >= 10_000_000) {
    const rounded = (value / 1_000_000).toFixed(1);
    return `${currencyUnit}${rounded}M`;
  }
  if (value >= 1_000_000) {
    const rounded = (value / 1_000_000).toFixed(1);
    return `${currencyUnit}${rounded}M`;
  }
  return `${currencyUnit}${Math.round(value).toLocaleString()}`;
};

type AnimatedRecommendationItemPropsTypes = {
  item: TopUpRecommendationTypes;
  index: number;
  currencyUnit: string;
  imageUrlMap: Record<string, string | null>;
};

const AnimatedRecommendationItem = ({
  item,
  index,
  currencyUnit,
  imageUrlMap,
}: AnimatedRecommendationItemPropsTypes) => (
  <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
    <TopUpRecommendationItem
      item={item}
      currencyUnit={currencyUnit}
      imageUrl={imageUrlMap[item.assetId]}
    />
  </Animated.View>
);

export default function DepositScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [depositAmount, setDepositAmount] = useState('');
  const [hasExpanded, setHasExpanded] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [planVersion, setPlanVersion] = useState(0);

  const { data: holdingData } = useGetHoldingBaselineQuery(id);
  const { mutate: fetchTopUpPlan, data: topUpPlanData, isPending } = useGetTopUpPlanMutation();
  const { mutate: executeTopUp, isPending: isExecuting } = useExecuteTopUpMutation();

  const currencyUnit = holdingData?.baseCurrency === 'USD' ? '$' : '₩';

  const imageUrlMap: Record<string, string | null> = {};
  holdingData?.items?.forEach((item) => {
    imageUrlMap[item.assetId] = item.imageUrl ?? null;
  });

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

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  const isUsd = holdingData?.baseCurrency === 'USD';

  const handleAmountChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9]/g, '');
      setDepositAmount(cleaned);
      if (hasExpanded) {
        setHasExpanded(false);
      }
    },
    [hasExpanded]
  );

  const handleInputFocus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

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
      {
        portfolioId: id,
        additionalCash: amount,
        purchases,
        addRemainingCashToBaseline: true,
      },
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

  const handleResponderRelease = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: TopUpRecommendationTypes; index: number }) => (
      <AnimatedRecommendationItem
        item={item}
        index={index}
        currencyUnit={currencyUnit}
        imageUrlMap={imageUrlMap}
      />
    ),
    [currencyUnit, imageUrlMap]
  );

  const keyExtractor = useCallback(
    (item: TopUpRecommendationTypes) => `${planVersion}-${item.assetId}`,
    [planVersion]
  );

  const listHeaderComponent = (
    <Text className="text-muted-foreground mt-[12px] mb-[8px] text-sm font-bold">
      추천 매수 종목
    </Text>
  );

  const listFooterComponent = <View className="h-[120px]" />;

  return (
    <Container isKeyboardAvoiding>
      <View className="flex-row items-center gap-[8px] px-[16px] py-[12px]">
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
            <Text className="text-2xl font-bold">추가 입금할 금액을 입력하세요</Text>
            <Text className="text-muted-foreground mt-[8px] text-sm">
              입금 금액에 맞춰 추천 매수 종목을 알려드립니다
            </Text>
          </Animated.View>

          <Animated.View style={inputAnimatedStyle} className="mt-[24px]">
            <View className="items-center py-[24px]">
              <TextInput
                ref={inputRef}
                value={depositAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                style={{ position: 'absolute', opacity: 0, height: 0 }}
              />
              <View className="w-full">
                <Pressable onPress={handleInputFocus} className="px-[16px]">
                  {depositAmount && parseInt(depositAmount, 10) >= 10000 && (
                    <Text
                      className="text-muted-foreground text-right text-sm font-semibold"
                      style={{ position: 'absolute', top: -26, right: 16 }}>
                      {formatKoreanUnit(parseInt(depositAmount, 10))}
                      {isUsd ? '달러' : '원'}
                    </Text>
                  )}
                  <Text
                    className={`text-center text-5xl font-bold ${depositAmount ? 'text-foreground' : 'text-muted'}`}
                    adjustsFontSizeToFit
                    numberOfLines={1}>
                    {depositAmount ? formatWithComma(depositAmount) : '0'}
                    <Text className="text-2xl">{isUsd ? ' $' : ' 원'}</Text>
                  </Text>
                </Pressable>
              </View>
            </View>

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
                  {formatCompactValue(topUpPlanData.currentTotalValue, currencyUnit)}
                </Text>
              </View>
              <Icon as={ArrowRight} size={16} className="text-muted-foreground" />
              <View className="items-center gap-[2px]">
                <Text className="text-muted-foreground text-xs">추가 후</Text>
                <Text className="text-success text-base font-bold">
                  {formatCompactValue(topUpPlanData.newTotalValue, currencyUnit)}
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
