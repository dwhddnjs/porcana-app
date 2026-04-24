import Container from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { BaselineItem } from '@/components/portfolio/baseline-item';
import { HoldingSummaryCard } from '@/components/portfolio/holding-summary-card';
import { HoldingSubStats } from '@/components/portfolio/holding-sub-stats';
import { AllocationDonut } from '@/components/portfolio/allocation-donut';
import { RebalanceAlertBanner } from '@/components/portfolio/rebalance-alert-banner';
import {
  useGetHoldingBaselineQuery,
  useGetRebalanceStatusQuery,
} from '@/lib/hooks/query/portfolio';
import { type BaselineItemTypes } from '@/lib/api/portfolio';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useCallback } from 'react';
import { Spacer } from '@/components/ui/spacer';

export default function HoldingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useGetHoldingBaselineQuery(id);
  const { data: rebalanceStatus } = useGetRebalanceStatusQuery(id);

  const currencyUnit = data?.baseCurrency === 'USD' ? '$' : '원';

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  const handleDeposit = useCallback(() => {
    if (!id) return;
    router.push(`/portfolio/deposit/${id}`);
  }, [id, router]);

  const handleAssetPress = useCallback(
    (assetId: string) => {
      router.push(`/asset/${assetId}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: BaselineItemTypes; index: number }) => (
      <BaselineItem
        item={item}
        currencyUnit={currencyUnit}
        showTopBorder={index === 0}
        onPress={handleAssetPress}
      />
    ),
    [currencyUnit, handleAssetPress]
  );

  const keyExtractor = useCallback((item: BaselineItemTypes) => item.assetId, []);

  return (
    <Container>
      <View className="flex-row items-center justify-between px-[16px] py-[12px]">
        <View className="flex-row items-center gap-[8px]">
          <Pressable onPress={handleGoBack} hitSlop={8}>
            <Icon as={ChevronLeft} size={24} className="text-foreground" />
          </Pressable>
        </View>
        <Pressable onPress={handleDeposit} hitSlop={8} className="flex-row items-center gap-[4px]">
          <Icon as={Plus} size={18} className="text-primary" />
          <Text className="text-primary text-sm font-semibold">추가 입금</Text>
        </Pressable>
      </View>
      <Spacer height={12} />

      <View className="flex-1 px-[16px]">
        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}

        {data && (
          <>
            <HoldingSummaryCard
              totalValue={data.totalValue ?? 0}
              cashAmount={data.cashAmount ?? 0}
              seedMoney={data.seedMoney ?? 0}
              currencyUnit={currencyUnit}
            />
            <Spacer height={12} />
            <HoldingSubStats
              seedMoney={data.seedMoney ?? 0}
              cashAmount={data.cashAmount ?? 0}
              currencyUnit={currencyUnit}
            />
            {rebalanceStatus && (
              <View className="pt-[12px] pb-[8px]">
                <RebalanceAlertBanner status={rebalanceStatus} />
              </View>
            )}

            <FlashList
              data={data.items}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View>
                  <Spacer height={12} />
                  <AllocationDonut
                    items={data.items}
                    totalValue={data.totalValue ?? 0}
                    cashAmount={data.cashAmount ?? 0}
                  />
                  <Text className="text-muted-foreground mt-[24px] mb-[8px] text-sm font-bold">
                    자산 배분
                  </Text>
                </View>
              }
              ListFooterComponent={<View className="h-[120px]" />}
            />
          </>
        )}
      </View>
    </Container>
  );
}
