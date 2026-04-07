import { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/ui/header';
import { BackConfirmDialog } from '@/components/custom-portfolio/back-confirm-dialog';
import Container from '@/components/ui/container';
import { WeightAssetItem } from '@/components/custom-portfolio/weight-asset-item';
import { useCustomPortfolioStore } from '@/lib/hooks/zustand/use-custom-portfolio-store';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useDirectCreatePortfolioMutation } from '@/lib/hooks/mutation/portfolio';
import { toast } from 'sonner-native';
import { Spacer } from '@/components/ui/spacer';

const buildEqualWeights = (assetIds: string[]): Record<string, number> => {
  const count = assetIds.length;
  if (count === 0) return {};
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  const weights: Record<string, number> = {};
  assetIds.forEach((id, index) => {
    weights[id] = index < remainder ? base + 1 : base;
  });
  return weights;
};

export default function CustomPortfolioDetail() {
  const { selectedAssets, portfolioName, setPortfolioName, clearAssets, setSkipNextClear } =
    useCustomPortfolioStore();
  const { user } = useUserStore();
  const { mutate: directCreate } = useDirectCreatePortfolioMutation();
  const rootNavigation = useNavigation().getParent();

  const [showBackDialog, setShowBackDialog] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    buildEqualWeights(selectedAssets.map((a) => a.assetId))
  );

  const totalWeight = useMemo(
    () => Object.values(weights).reduce((sum, w) => sum + w, 0),
    [weights]
  );

  const isValid = totalWeight === 100 && portfolioName.trim().length > 0;

  const handleWeightChange = useCallback((assetId: string, value: number) => {
    setWeights((prev) => ({ ...prev, [assetId]: value }));
  }, []);

  const handleRemoveAsset = useCallback((assetId: string) => {
    const { removeAsset } = useCustomPortfolioStore.getState();
    removeAsset(assetId);

    setWeights((prev) => {
      const next = { ...prev };
      delete next[assetId];
      const remainingIds = Object.keys(next);
      if (remainingIds.length === 0) return {};
      const equalWeights = buildEqualWeights(remainingIds);
      return equalWeights;
    });
  }, []);

  const handleBackPress = () => {
    setShowBackDialog(true);
  };

  const handleConfirmBack = () => {
    clearAssets();
    rootNavigation?.dispatch(StackActions.popToTop());
  };

  const handlePrevious = () => {
    setSkipNextClear(true);
    router.back();
  };

  const handleCreate = () => {
    if (!user?.userId) {
      router.push('/modal/login-sheet');
      return;
    }
    if (!portfolioName.trim()) {
      toast.error('포트폴리오 이름을 입력해주세요');
      return;
    }
    if (totalWeight !== 100) {
      toast.error('비중 합계가 100%여야 합니다');
      return;
    }

    directCreate({
      name: portfolioName.trim(),
      assets: selectedAssets.map((a) => ({
        assetId: a.assetId,
        weightPct: weights[a.assetId] ?? 0,
      })),
    });
  };

  return (
    <Container edges={['top', 'bottom']}>
      <Header onBackPress={handleBackPress} title="포트폴리오 구성" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
          keyboardShouldPersistTaps="handled">
          {/* 포트폴리오 이름 입력 */}
          <View className="mb-6 gap-3">
            <Text className="text-foreground text-base font-bold">포트폴리오 이름</Text>
            <Input
              value={portfolioName}
              onChangeText={setPortfolioName}
              placeholder="포트폴리오 이름을 입력하세요"
              className="native:h-12 border-primary border bg-transparent dark:bg-transparent"
            />
          </View>
          <Spacer height={12} />

          {/* 선택한 종목 헤더 */}
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-foreground text-base font-bold">
              선택한 종목 ({selectedAssets.length}개)
            </Text>
            <Text
              className={`text-sm font-bold ${totalWeight === 100 ? 'text-weight' : 'text-destructive'}`}>
              합계: {totalWeight.toFixed(2)}%
            </Text>
          </View>

          {/* 에셋 리스트 */}
          <View className="gap-2">
            {selectedAssets.map((asset) => {
              const handleWeightChangeForAsset = (value: number) =>
                handleWeightChange(asset.assetId, value);
              const handleRemove = () => handleRemoveAsset(asset.assetId);

              return (
                <WeightAssetItem
                  key={asset.assetId}
                  asset={asset}
                  weightPct={weights[asset.assetId] ?? 0}
                  onWeightChange={handleWeightChangeForAsset}
                  onRemove={handleRemove}
                />
              );
            })}
          </View>
          <Spacer height={120} />
        </ScrollView>

        {/* 하단 버튼 바 */}
        <View className="border-border flex-row gap-3 px-5 pt-3 pb-2">
          <Button variant="outline" size="lg" className="flex-1" onPress={handlePrevious}>
            <Text className="text-foreground font-semibold">이전</Text>
          </Button>
          <Button size="lg" className="flex-1" onPress={handleCreate} disabled={!isValid}>
            <Text className="text-primary-foreground font-semibold">생성</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>

      <BackConfirmDialog
        open={showBackDialog}
        onOpenChange={setShowBackDialog}
        onConfirm={handleConfirmBack}
      />
    </Container>
  );
}
