import { NormalizedAssetTypes, SectorTypes } from './normalize.ts';

export type CurationResultTypes = {
  ticker: string;
  current_risk_level: number;
  impact_hint: string | null;
  personality: { growth: number; stability: number; income: number } | null;
};

// KR 섹터별 risk 및 hint 룰 테이블
const KR_SECTOR_RULES: Record<string, { risk: number; hint: string }> = {
  INFORMATION_TECHNOLOGY: { risk: 4, hint: '국내 IT·반도체 핵심 기업' },
  HEALTH_CARE: { risk: 5, hint: '바이오·제약 고성장 기업' },
  FINANCIALS: { risk: 2, hint: '국내 대표 금융·은행 기업' },
  CONSUMER_DISCRETIONARY: { risk: 3, hint: '소비재·유통 대표 기업' },
  CONSUMER_STAPLES: { risk: 2, hint: '생활필수품 안정 기업' },
  COMMUNICATION_SERVICES: { risk: 3, hint: '국내 미디어·통신 기업' },
  INDUSTRIALS: { risk: 3, hint: '산업재·중공업 대표 기업' },
  ENERGY: { risk: 2, hint: '에너지·유틸리티 안정 배당주' },
  MATERIALS: { risk: 3, hint: '소재·화학 대표 기업' },
  REAL_ESTATE: { risk: 2, hint: '부동산·리츠 투자 기업' },
  UTILITIES: { risk: 1, hint: '전력·유틸리티 안정 배당주' },
};

const betaToRiskLevel = (beta: number, isEtf: boolean): number => {
  const raw = beta < 0.5 ? 1 : beta < 0.9 ? 2 : beta < 1.3 ? 3 : beta < 1.8 ? 4 : 5;
  return isEtf ? Math.min(raw, 3) : raw;
};

const calcPersonality = (
  beta: number,
  dividendYield: number
): { growth: number; stability: number; income: number } => {
  const growth = beta >= 1.3 ? 60 : beta >= 0.9 ? 40 : 20;
  const income = dividendYield >= 3 ? 60 : dividendYield >= 1 ? 40 : 20;
  const stability = Math.max(0, 100 - growth - income);
  // 합계가 100이 되도록 growth를 조정
  const total = growth + income + stability;
  const adjustedGrowth = growth + (100 - total);
  return { growth: adjustedGrowth, stability, income };
};

const extractFirstSentence = (description: string | undefined): string | null => {
  if (!description) return null;
  const sentence = description.split('.')[0]?.trim();
  if (!sentence || sentence.length < 10) return null;
  return sentence.length > 100 ? sentence.slice(0, 97) + '...' : sentence;
};

const sectorHint = (sector: SectorTypes | null, market: 'US' | 'KR'): string | null => {
  if (!sector) return null;
  if (market === 'KR') return KR_SECTOR_RULES[sector]?.hint ?? null;

  const US_SECTOR_HINTS: Record<SectorTypes, string> = {
    INFORMATION_TECHNOLOGY: 'Technology sector company',
    HEALTH_CARE: 'Healthcare and pharmaceutical company',
    FINANCIALS: 'Financial services company',
    CONSUMER_DISCRETIONARY: 'Consumer discretionary company',
    CONSUMER_STAPLES: 'Consumer staples company',
    COMMUNICATION_SERVICES: 'Communication services company',
    INDUSTRIALS: 'Industrial sector company',
    ENERGY: 'Energy sector company',
    MATERIALS: 'Materials sector company',
    REAL_ESTATE: 'Real estate company',
    UTILITIES: 'Utilities company',
  };
  return US_SECTOR_HINTS[sector] ?? null;
};

export type CurateAssetInputTypes = NormalizedAssetTypes & {
  profile?: {
    beta?: number;
    lastDiv?: number;
    description?: string;
  };
};

export const curateAssets = (assets: CurateAssetInputTypes[]): CurationResultTypes[] => {
  return assets.map((asset) => {
    if (asset.market === 'US') {
      const beta = asset.profile?.beta ?? 1.0;
      const dividendYield = asset.profile?.lastDiv ?? 0;
      const isEtf = asset.type === 'ETF';

      return {
        ticker: asset.ticker,
        current_risk_level: betaToRiskLevel(beta, isEtf),
        impact_hint:
          extractFirstSentence(asset.profile?.description) ?? sectorHint(asset.sector, 'US'),
        personality: calcPersonality(beta, dividendYield),
      };
    }

    // KR: 섹터 룰 기반
    const rule = KR_SECTOR_RULES[asset.sector ?? ''];
    const isEtf = asset.type === 'ETF';
    const riskLevel = isEtf ? 2 : (rule?.risk ?? 3);
    const personality = isEtf
      ? { growth: 20, stability: 60, income: 20 }
      : riskLevel >= 4
        ? { growth: 60, stability: 20, income: 20 }
        : { growth: 40, stability: 40, income: 20 };

    return {
      ticker: asset.ticker,
      current_risk_level: riskLevel,
      impact_hint: isEtf ? '국내 시장 분산 ETF' : (rule?.hint ?? '국내 주요 상장 기업'),
      personality,
    };
  });
};
