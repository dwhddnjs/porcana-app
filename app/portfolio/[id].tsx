import { LargeHeader } from '@/components/large-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { format, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useGetPortfolioQuery } from '@/lib/hooks/query/portfolio';
import { cn } from '@/lib/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Star, StarHalf, TrendingUp, ChevronLeft, TriangleAlert, Split } from 'lucide-react-native';
import {
  DIVERSITY_LEVEL_LABELS,
  getDiversityLevelColor,
  roundToTwoDecimals,
} from '@/lib/constant/function';
import { THEME } from '@/lib/theme';
import { Image } from '@/components/ui/image';
import RiskDistributionChart from '@/components/portfolio/risk-distribution-chart';
import { Spacer } from '@/components/spacer';
import { AssetItem } from '@/components/portfolio/asset-item';
import { useSetMainPortfolioMutation } from '@/lib/hooks/mutation/portfolio';
import Container from '@/components/container';

export default function PortfolioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetPortfolioQuery(id);
  const { mutate: setMainPortfolio } = useSetMainPortfolioMutation();

  const goBack = () => {
    router.back();
  };

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
        <Pressable onPress={goBack} hitSlop={8}>
          <Icon as={ChevronLeft} size={24} className="text-foreground" />
        </Pressable>
      }
      headerRight={
        <Pressable
          onPress={() => {
            if (data.isMain) {
              return;
            }
            setMainPortfolio(data.portfolioId);
          }}>
          <Icon
            as={Star}
            size={24}
            className={data.isMain ? 'text-yellow-500' : 'text-muted-foreground'}
            fill={data.isMain ? '#eab308' : 'transparent'}
          />
        </Pressable>
      }>
      <View className="px-[12px]">
        {/* 수익률 요약 카드 */}
        <Spacer height={12} />
        <Card className="py-[18px]">
          <CardContent className="gap-y-[24px] px-[24px]">
            <View>
              <View className="flex-row items-center gap-2">
                <Icon as={TrendingUp} size={20} className="text-primary" />
                <Text className="text-lg font-semibold">수익률</Text>
              </View>
              <Text
                className={cn('text-3xl font-bold', isPositive ? 'text-link' : 'text-destructive')}>
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
                      className="text-success"
                      fill={THEME.light.success}
                    />
                  ))}
                  {hasHalfStar && (
                    <Icon
                      key="half"
                      as={StarHalf}
                      size={16}
                      className="text-success"
                      fill={THEME.light.success}
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
          </CardContent>
        </Card>
        <Spacer height={36} />
        <View>
          <Text className="text-muted-foreground text-md mb-[12px] font-bold">주요 자산</Text>
          {data?.positions?.map((item, index) => (
            <AssetItem
              key={item.assetId}
              item={item}
              showTopBorder={index === 0}
              onPress={() => {
                router.push(`/asset/${item.assetId}`);
              }}
            />
          ))}
        </View>
      </View>
    </LargeHeader>
  );
}
