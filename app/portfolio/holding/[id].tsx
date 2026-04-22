import Container from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { BaselineItem } from '@/components/portfolio/baseline-item';
import { useGetHoldingBaselineQuery } from '@/lib/hooks/query/portfolio';
import { type BaselineItemTypes } from '@/lib/api/portfolio';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useCallback } from 'react';

export default function HoldingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useGetHoldingBaselineQuery(id);

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

  const renderItem = useCallback(
    ({ item, index }: { item: BaselineItemTypes; index: number }) => (
      <BaselineItem item={item} currencyUnit={currencyUnit} showTopBorder={index === 0} />
    ),
    [currencyUnit]
  );

  const keyExtractor = useCallback((item: BaselineItemTypes) => item.assetId, []);

  return (
    <Container>
      <View className="flex-row items-center justify-between px-[16px] py-[12px]">
        <View className="flex-row items-center gap-[8px]">
          <Pressable onPress={handleGoBack} hitSlop={8}>
            <Icon as={ChevronLeft} size={24} className="text-foreground" />
          </Pressable>
          <Text className="text-lg font-bold">보유현황</Text>
        </View>
        <Pressable
          onPress={handleDeposit}
          hitSlop={8}
          className="flex-row items-center gap-[4px]"
        >
          <Icon as={Plus} size={18} className="text-primary" />
          <Text className="text-primary text-sm font-semibold">추가 입금</Text>
        </Pressable>
      </View>

      <View className="flex-1 px-[16px]">
        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}

        {data && (
          <>
            <View className="bg-primary/5 mb-[12px] flex-row rounded-xl px-[16px] py-[14px]">
              <View className="flex-1 items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">시드머니</Text>
                <Text className="text-base font-bold" adjustsFontSizeToFit numberOfLines={1}>
                  {(data.seedMoney ?? 0).toLocaleString()}
                  {currencyUnit}
                </Text>
              </View>
              <View className="flex-1 items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">총 자산가치</Text>
                <Text className="text-base font-bold" adjustsFontSizeToFit numberOfLines={1}>
                  {Math.round(data.totalValue ?? 0).toLocaleString()}
                  {currencyUnit}
                </Text>
              </View>
              <View className="flex-1 items-center gap-[4px]">
                <Text className="text-muted-foreground text-xs">현금 잔고</Text>
                <Text className="text-base font-bold" adjustsFontSizeToFit numberOfLines={1}>
                  {Math.round(data.cashAmount ?? 0).toLocaleString()}
                  {currencyUnit}
                </Text>
              </View>
            </View>

            <FlashList
              data={data.items}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text className="text-muted-foreground mt-[12px] mb-[8px] text-sm font-bold">
                  자산 배분
                </Text>
              }
              ListFooterComponent={<View className="h-[120px]" />}
            />
          </>
        )}
      </View>
    </Container>
  );
}
