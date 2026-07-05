import { LargeHeader } from '@/components/ui/large-header';
import { Text } from '@/components/ui/text';
import {
  useGetPortfolioChartQuery,
  useGetPortfolioQuery,
  useGetPortfolioReturnsQuery,
} from '@/lib/hooks/query/portfolio';
import { useGetSimulationBaselineQuery } from '@/lib/hooks/query/simulation';
import { cn } from '@/lib/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View, useColorScheme } from 'react-native';
import { DeletePortfolioDialog } from '@/components/portfolio/delete-portfolio-dialog';
import { InvestmentManagementCard } from '@/components/portfolio/investment-management-card';
import { StartSimulationCard } from '@/components/portfolio/start-simulation-card';
import { PortfolioSummaryCard } from '@/components/portfolio/portfolio-summary-card';
import { ScreenError, ScreenLoading, ScreenMessage } from '@/components/ui/screen-state';
import { Icon } from '@/components/ui/icon';
import { Check, ChevronLeft, Star, Trash2, X } from 'lucide-react-native';
import HomePortfolioChart from '@/components/portfolio/home-portfolio-chart';
import { Spacer } from '@/components/ui/spacer';
import { AssetItem } from '@/components/portfolio/asset-item';
import {
  useDeletePortfolioMutation,
  useSetMainPortfolioMutation,
} from '@/lib/hooks/mutation/portfolio';
import { useResetSimulationMutation } from '@/lib/hooks/mutation/simulation';
import { usePortfolioWeightEdit } from '@/lib/hooks/use-portfolio-weight-edit';
import { useCallback, useState } from 'react';
import { PortfolioChartPointTypes } from '@/lib/api/portfolio';

const CHART_RANGE = '1Y';

export default function PortfolioDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetPortfolioQuery(id);
  const { mutate: setMainPortfolio } = useSetMainPortfolioMutation();
  const { mutate: deletePortfolio, isPending: isDeleting } = useDeletePortfolioMutation();
  const { mutate: resetSimulation } = useResetSimulationMutation();
  const { data: holdingData, isLoading: isHoldingLoading } = useGetSimulationBaselineQuery(id);
  const { data: chartData } = useGetPortfolioChartQuery(id, CHART_RANGE);
  const { data: returnsData } = useGetPortfolioReturnsQuery(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    isEditMode,
    weightValues,
    totalWeight,
    enterEditMode,
    cancelEditMode,
    handleWeightChange,
    handleEqualDistribute,
    handleNormalize,
    handleSave,
  } = usePortfolioWeightEdit({ portfolioId: id, positions: data?.positions });

  const handleDeletePress = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!data?.portfolioId || isDeleting) return;
    setIsDeleteDialogOpen(false);
    deletePortfolio(data.portfolioId);
  }, [data?.portfolioId, deletePortfolio, isDeleting]);

  const handleSetMain = useCallback(() => {
    if (!data?.portfolioId || data.isMain) return;
    setMainPortfolio(data.portfolioId);
  }, [data?.portfolioId, data?.isMain, setMainPortfolio]);

  const handleSimulation = useCallback(() => {
    if (!id) return;
    router.push(`/portfolio/simulation/${id}`);
  }, [id, router]);

  const handleResetSimulation = useCallback(() => {
    if (!id) return;
    resetSimulation({ portfolioId: id });
  }, [id, resetSimulation]);

  const handleHolding = useCallback(() => {
    if (!id) return;
    router.push(`/portfolio/holding/${id}`);
  }, [id, router]);

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

  const goBack = useCallback(() => {
    if (isEditMode) return;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(portfolio)/(main)');
    }
  }, [isEditMode, router]);

  if (!id) {
    return <ScreenMessage message="포트폴리오 ID가 없습니다." />;
  }

  if (isLoading) {
    return <ScreenLoading />;
  }

  if (isError || !data) {
    return (
      <ScreenError
        title="포트폴리오를 불러오지 못했습니다."
        description={error?.message}
        onRetry={goBack}
      />
    );
  }

  const riskLevel = data.averageRiskLevel || 0;

  return (
    <LargeHeader
      title={data.name}
      headerLeft={
        isEditMode ? (
          <Pressable onPress={cancelEditMode} hitSlop={8}>
            <Icon as={X} size={24} className="text-foreground" />
          </Pressable>
        ) : (
          <Pressable onPress={goBack} hitSlop={8}>
            <Icon as={ChevronLeft} size={24} className="text-foreground" />
          </Pressable>
        )
      }
      headerRight={
        isEditMode ? (
          <Pressable onPress={handleSave} hitSlop={8}>
            <Icon as={Check} size={24} className="text-primary" />
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-4">
            <Pressable onPress={handleDeletePress} hitSlop={8}>
              <Icon as={Trash2} size={24} className="text-muted-foreground" />
            </Pressable>
            <Pressable onPress={handleSetMain} hitSlop={8}>
              <Icon
                as={Star}
                size={24}
                className={data.isMain ? 'text-yellow-500' : 'text-muted-foreground'}
                fill={data.isMain ? '#eab308' : 'transparent'}
              />
            </Pressable>
          </View>
        )
      }>
      <View className="px-[12px]">
        <PortfolioSummaryCard
          totalReturnPct={data.totalReturnPct}
          riskLevel={riskLevel}
          diversityLevel={data.diversityLevel}
          riskDistribution={data.riskDistribution}
          returnsData={returnsData}
          colorScheme={colorScheme}
        />
        {/* 차트 */}
        {(chartData ?? []).length >= 2 && (
          <View>
            <HomePortfolioChart
              data={chartData as PortfolioChartPointTypes[]}
              totalReturnPct={data.totalReturnPct}
            />
          </View>
        )}
        <Spacer height={12} />
        {!isEditMode && !isHoldingLoading && holdingData?.exists && (
          <InvestmentManagementCard
            seedMoney={holdingData.seedMoney}
            totalValue={holdingData.totalValue}
            baseCurrency={holdingData.baseCurrency}
            onPressHolding={handleHolding}
            onPressDeposit={handleDeposit}
            onPressReset={handleResetSimulation}
          />
        )}
        {!isEditMode && !isHoldingLoading && !holdingData?.exists && (
          <StartSimulationCard onPress={handleSimulation} />
        )}
        <Spacer height={24} />
        <View>
          <View className="flex-row items-center justify-between pb-[12px]">
            <Text className="text-muted-foreground text-md font-bold">주요 자산</Text>
            {isEditMode ? (
              <Text
                className={cn(
                  'text-sm font-semibold',
                  Math.round(totalWeight * 100) / 100 === 100 ? 'text-weight' : 'text-destructive'
                )}>
                합계: {totalWeight.toFixed(2)}%
              </Text>
            ) : (
              <Pressable
                onPress={enterEditMode}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                className="border-primary rounded-lg border px-[10px] py-[4px]">
                <Text className="text-sm">자산 비중 수정</Text>
              </Pressable>
            )}
          </View>
          {isEditMode && (
            <View className="flex-row justify-end gap-[6px] pb-[12px]">
              <Pressable
                onPress={handleEqualDistribute}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                className="border-primary/40 rounded-lg border px-[10px] py-[4px]">
                <Text className="text-xs">균등 분배</Text>
              </Pressable>
              <Pressable
                onPress={handleNormalize}
                disabled={totalWeight <= 0}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : totalWeight <= 0 ? 0.4 : 1 })}
                className="border-primary/40 rounded-lg border px-[10px] py-[4px]">
                <Text className="text-xs">100% 맞추기</Text>
              </Pressable>
            </View>
          )}
          {data?.positions?.map((item, index) => (
            <AssetItem
              key={item.assetId}
              item={item}
              showTopBorder={index === 0}
              isEditMode={isEditMode}
              showContribution={(chartData ?? []).length >= 2}
              weightValue={weightValues[item.assetId]}
              onWeightChange={handleWeightChange}
              onPress={isEditMode ? undefined : handleAssetPress}
            />
          ))}
        </View>
        <Spacer height={120} />
      </View>
      <DeletePortfolioDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </LargeHeader>
  );
}
