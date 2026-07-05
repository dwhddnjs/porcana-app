import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';
import { toast } from 'sonner-native';
import { useUpdatePortfolioWeightsMutation } from '@/lib/hooks/mutation/portfolio';
import type { PositionTypes } from '@/lib/api/portfolio';

/**
 * 원시 비중 배열을 소수 둘째 자리로 반올림하고, 잔차를 마지막 항목에 몰아
 * 합계가 100이 되도록 보정한 문자열 배열을 반환합니다.
 */
const distributeWithRemainder = (rawValues: number[]): string[] => {
  const rounded = rawValues.map((v) => Math.round(v * 100) / 100);
  const sum = rounded.reduce((a, b) => a + b, 0);
  const diff = Math.round((100 - sum) * 100) / 100;
  if (rounded.length > 0) {
    rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + diff) * 100) / 100;
  }
  return rounded.map(String);
};

type UsePortfolioWeightEditParams = {
  portfolioId: string | undefined;
  positions: PositionTypes[] | undefined;
};

/**
 * 포트폴리오 자산 비중 편집 상태와 로직을 캡슐화하는 훅.
 * 편집 진입/취소, 개별 비중 변경, 균등 분배, 100% 정규화, 저장을 제공합니다.
 */
export const usePortfolioWeightEdit = ({
  portfolioId,
  positions,
}: UsePortfolioWeightEditParams) => {
  const { mutate: updateWeights } = useUpdatePortfolioWeightsMutation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [weightValues, setWeightValues] = useState<Record<string, string>>({});

  const totalWeight = Object.values(weightValues).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  const enterEditMode = useCallback(() => {
    if (!positions) return;
    const initial: Record<string, string> = {};
    positions.forEach((p) => {
      initial[p.assetId] = String(p.weightPct);
    });
    setWeightValues(initial);
    setIsEditMode(true);
  }, [positions]);

  const cancelEditMode = useCallback(() => {
    Keyboard.dismiss();
    setIsEditMode(false);
    setWeightValues({});
  }, []);

  const handleWeightChange = useCallback((assetId: string, value: string) => {
    setWeightValues((prev) => ({ ...prev, [assetId]: value }));
  }, []);

  const handleEqualDistribute = useCallback(() => {
    if (!positions || positions.length === 0) return;
    const ids = positions.map((p) => p.assetId);
    const each = 100 / ids.length;
    const distributed = distributeWithRemainder(ids.map(() => each));
    const next: Record<string, string> = {};
    ids.forEach((assetId, i) => {
      next[assetId] = distributed[i];
    });
    setWeightValues(next);
  }, [positions]);

  const handleNormalize = useCallback(() => {
    if (!positions || positions.length === 0) return;
    const ids = positions.map((p) => p.assetId);
    const raws = ids.map((assetId) => parseFloat(weightValues[assetId] ?? '0') || 0);
    const total = raws.reduce((a, b) => a + b, 0);
    if (total <= 0) return;
    const scaled = raws.map((v) => (v * 100) / total);
    const distributed = distributeWithRemainder(scaled);
    const next: Record<string, string> = {};
    ids.forEach((assetId, i) => {
      next[assetId] = distributed[i];
    });
    setWeightValues(next);
  }, [positions, weightValues]);

  const handleSave = useCallback(() => {
    if (!portfolioId) return;
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
      { portfolioId, weights },
      {
        onSuccess: () => {
          setIsEditMode(false);
          setWeightValues({});
          toast.success('비중이 수정되었습니다');
        },
      }
    );
  }, [portfolioId, weightValues, updateWeights]);

  return {
    isEditMode,
    weightValues,
    totalWeight,
    enterEditMode,
    cancelEditMode,
    handleWeightChange,
    handleEqualDistribute,
    handleNormalize,
    handleSave,
  };
};
