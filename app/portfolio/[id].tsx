import { LargeHeader } from '@/components/ui/large-header';
import { Text } from '@/components/ui/text';
import { format, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useGetPortfolioQuery, useGetHoldingBaselineQuery } from '@/lib/hooks/query/portfolio';
import { cn } from '@/lib/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Keyboard, Pressable, View, useColorScheme } from 'react-native';
import { toast } from 'sonner-native';
import { DeletePortfolioDialog } from '@/components/portfolio/delete-portfolio-dialog';
import { InvestmentManagementCard } from '@/components/portfolio/investment-management-card';
import { StartSimulationCard } from '@/components/portfolio/start-simulation-card';
import { Icon } from '@/components/ui/icon';
import {
  Check,
  ChevronLeft,
  Split,
  Star,
  StarHalf,
  Trash2,
  TriangleAlert,
  TrendingUp,
  X,
} from 'lucide-react-native';
import {
  DIVERSITY_LEVEL_LABELS,
  getDiversityLevelColor,
  getRiskStarColor,
} from '@/lib/constant/function';
import RiskDistributionChart from '@/components/portfolio/risk-distribution-chart';
import { Spacer } from '@/components/ui/spacer';
import { AssetItem } from '@/components/portfolio/asset-item';
import {
  useDeletePortfolioMutation,
  useSetMainPortfolioMutation,
  useUpdatePortfolioWeightsMutation,
} from '@/lib/hooks/mutation/portfolio';
import { useCallback, useState } from 'react';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';

export default function PortfolioDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetPortfolioQuery(id);
  const { mutate: setMainPortfolio } = useSetMainPortfolioMutation();
  const { mutate: updateWeights } = useUpdatePortfolioWeightsMutation();
  const { mutate: deletePortfolio, isPending: isDeleting } = useDeletePortfolioMutation();
  const { data: holdingData, isLoading: isHoldingLoading } = useGetHoldingBaselineQuery(id);
  const [isEditMode, setIsEditMode] = useState(false);
  const [weightValues, setWeightValues] = useState<Record<string, string>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const enterEditMode = useCallback(() => {
    if (!data?.positions) return;
    const initial: Record<string, string> = {};
    data.positions.forEach((p) => {
      initial[p.assetId] = String(p.weightPct);
    });
    setWeightValues(initial);
    setIsEditMode(true);
  }, [data?.positions]);

  const cancelEditMode = useCallback(() => {
    Keyboard.dismiss();
    setIsEditMode(false);
    setWeightValues({});
  }, []);

  const handleSave = useCallback(() => {
    if (!id) return;
    Keyboard.dismiss();
    const weights = Object.entries(weightValues).map(([assetId, value]) => ({
      assetId,
      weightPct: Math.round(parseFloat(value || '0') * 100) / 100,
    }));
    const total = weights.reduce((sum, w) => sum + w.weightPct, 0);
    const roundedTotal = Math.round(total * 100) / 100;
    if (roundedTotal !== 100) {
      toast.error('비중 합계 오류', {
        description: `합계가 100%여야 합니다. (현재: ${roundedTotal}%)`,
      });
      return;
    }

    updateWeights(
      { portfolioId: id, weights },
      {
        onSuccess: () => {
          setIsEditMode(false);
          setWeightValues({});
          toast.success('비중이 수정되었습니다');
        },
      }
    );
  }, [id, weightValues, updateWeights]);

  const handleWeightChange = useCallback((assetId: string, value: string) => {
    setWeightValues((prev) => ({ ...prev, [assetId]: value }));
  }, []);

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

  const handleHolding = useCallback(() => {
    if (!id) return;
    router.push(`/portfolio/holding/${id}`);
  }, [id, router]);

  const handleDeposit = useCallback(() => {
    if (!id) return;
    router.push(`/portfolio/deposit/${id}`);
  }, [id, router]);

  const goBack = () => {
    if (isEditMode) return;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(portfolio)/(main)');
    }
  };

  const totalWeight = Object.values(weightValues).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  if (!id) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Text className="text-muted-foreground">포트폴리오 ID가 없습니다.</Text>
      </View>
    );
  }

  if (isLoading || !data) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-4">
        <Text className="text-destructive mb-2 text-center">포트폴리오를 불러오지 못했습니다.</Text>
        <Text className="text-muted-foreground mb-4 text-center text-sm">
          {error?.message ?? '잠시 후 다시 시도해 주세요.'}
        </Text>
        <Pressable onPress={goBack} className="bg-primary rounded-lg px-4 py-2">
          <Text className="text-primary-foreground font-medium">돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const isPositive = data.totalReturnPct >= 0;
  const createdAtDate = new Date(data.createdAt ?? '');
  const formattedCreatedAt = isValid(createdAtDate)
    ? format(createdAtDate, 'yyyy년 M월 d일', { locale: ko })
    : '-';

  const riskLevel = data.averageRiskLevel || 0;

  // 별 개수 계산 (전체 별 + 반개 별)
  const fullStars = Math.floor(riskLevel);
  const hasHalfStar = riskLevel % 1 >= 0.5;

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
        {/* 수익률 요약 카드 */}

        <View className="py-[18px]">
          <View className="gap-y-[24px] px-[8px]">
            <View>
              <View className="flex-row items-center gap-2">
                <Icon as={TrendingUp} size={20} className="text-primary" />
                <Text className="text-lg font-semibold">수익률</Text>
              </View>
              <Text
                className={cn(
                  'text-3xl font-bold',
                  isPositive ? 'text-stock-up' : 'text-stock-down'
                )}>
                {isPositive ? '+' : ''}
                {data.totalReturnPct.toFixed(2)}%
              </Text>
            </View>
            <View className="flex-row justify-between">
              <View className="flex-1 justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon as={TriangleAlert} size={16} className="text-primary" />
                  <Text className="font-semibold">평균 위험도</Text>
                  <Text className="text-muted-foreground text-md">{riskLevel}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  {Array.from({ length: fullStars }).map((_, index) => (
                    <Icon
                      key={`full-${index}`}
                      as={Star}
                      size={16}
                      strokeWidth={0}
                      fill={getRiskStarColor(riskLevel, colorScheme)}
                    />
                  ))}
                  {hasHalfStar && (
                    <Icon
                      key="half"
                      as={StarHalf}
                      size={16}
                      strokeWidth={0}
                      fill={getRiskStarColor(riskLevel, colorScheme)}
                    />
                  )}
                </View>
              </View>
              <View className="flex-1 justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon as={Split} size={16} className="text-primary" />
                  <Text className="font-semibold">분산도</Text>
                </View>
                <Text className={getDiversityLevelColor(data?.diversityLevel)}>
                  {DIVERSITY_LEVEL_LABELS[data?.diversityLevel ?? 'LOW']}
                </Text>
              </View>
            </View>
            <RiskDistributionChart data={data.riskDistribution} />
          </View>
        </View>
        <Spacer height={12} />
        {!isEditMode && !isHoldingLoading && holdingData?.exists && (
          <InvestmentManagementCard
            seedMoney={holdingData.seedMoney}
            totalValue={holdingData.totalValue}
            baseCurrency={holdingData.baseCurrency}
            onPressHolding={handleHolding}
            onPressDeposit={handleDeposit}
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
          {data?.positions?.map((item, index) => (
            <AssetItem
              key={item.assetId}
              item={item}
              showTopBorder={index === 0}
              isEditMode={isEditMode}
              weightValue={weightValues[item.assetId]}
              onWeightChange={(value) => handleWeightChange(item.assetId, value)}
              onPress={
                isEditMode
                  ? undefined
                  : () => {
                      router.push(`/asset/${item.assetId}`);
                    }
              }
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
