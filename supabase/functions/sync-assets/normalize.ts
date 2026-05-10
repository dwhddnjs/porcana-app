export type MarketSubtypeTypes = 'NASDAQ' | 'NYSE' | 'AMEX' | 'KOSPI' | 'KOSDAQ';
export type AssetTypeTypes = 'STOCK' | 'ETF';
export type SectorTypes =
  | 'INFORMATION_TECHNOLOGY'
  | 'HEALTH_CARE'
  | 'FINANCIALS'
  | 'CONSUMER_DISCRETIONARY'
  | 'CONSUMER_STAPLES'
  | 'COMMUNICATION_SERVICES'
  | 'INDUSTRIALS'
  | 'ENERGY'
  | 'MATERIALS'
  | 'REAL_ESTATE'
  | 'UTILITIES';

export type NormalizedAssetTypes = {
  ticker: string;
  yahoo_symbol: string;
  name: string;
  market: 'US' | 'KR';
  market_subtype: MarketSubtypeTypes;
  type: AssetTypeTypes;
  sector: SectorTypes | null;
  website_domain: string | null;
};

// FMP sector → DB enum 매핑
const FMP_SECTOR_MAP: Record<string, SectorTypes> = {
  Technology: 'INFORMATION_TECHNOLOGY',
  'Information Technology': 'INFORMATION_TECHNOLOGY',
  'Health Care': 'HEALTH_CARE',
  Healthcare: 'HEALTH_CARE',
  Financials: 'FINANCIALS',
  'Financial Services': 'FINANCIALS',
  'Consumer Discretionary': 'CONSUMER_DISCRETIONARY',
  'Consumer Cyclical': 'CONSUMER_DISCRETIONARY',
  'Consumer Staples': 'CONSUMER_STAPLES',
  'Consumer Defensive': 'CONSUMER_STAPLES',
  'Communication Services': 'COMMUNICATION_SERVICES',
  Industrials: 'INDUSTRIALS',
  Energy: 'ENERGY',
  Materials: 'MATERIALS',
  'Basic Materials': 'MATERIALS',
  'Real Estate': 'REAL_ESTATE',
  Utilities: 'UTILITIES',
};

// KRX 한국 섹터 → DB enum 매핑
const KRX_SECTOR_MAP: Record<string, SectorTypes> = {
  반도체: 'INFORMATION_TECHNOLOGY',
  '전기·전자': 'INFORMATION_TECHNOLOGY',
  전기전자: 'INFORMATION_TECHNOLOGY',
  소프트웨어: 'INFORMATION_TECHNOLOGY',
  IT서비스: 'INFORMATION_TECHNOLOGY',
  제약: 'HEALTH_CARE',
  바이오: 'HEALTH_CARE',
  의료기기: 'HEALTH_CARE',
  헬스케어: 'HEALTH_CARE',
  은행: 'FINANCIALS',
  증권: 'FINANCIALS',
  보험: 'FINANCIALS',
  금융: 'FINANCIALS',
  '유통·서비스': 'CONSUMER_DISCRETIONARY',
  유통: 'CONSUMER_DISCRETIONARY',
  자동차: 'CONSUMER_DISCRETIONARY',
  의류: 'CONSUMER_DISCRETIONARY',
  음식료: 'CONSUMER_STAPLES',
  식품: 'CONSUMER_STAPLES',
  통신: 'COMMUNICATION_SERVICES',
  미디어: 'COMMUNICATION_SERVICES',
  엔터테인먼트: 'COMMUNICATION_SERVICES',
  기계: 'INDUSTRIALS',
  철강: 'INDUSTRIALS',
  건설: 'INDUSTRIALS',
  조선: 'INDUSTRIALS',
  에너지: 'ENERGY',
  석유: 'ENERGY',
  화학: 'MATERIALS',
  소재: 'MATERIALS',
  부동산: 'REAL_ESTATE',
  리츠: 'REAL_ESTATE',
  전력: 'UTILITIES',
  유틸리티: 'UTILITIES',
};

export const mapFmpSector = (sector: string | undefined): SectorTypes | null => {
  if (!sector) return null;
  return FMP_SECTOR_MAP[sector] ?? null;
};

export const mapKrxSector = (sector: string | undefined): SectorTypes | null => {
  if (!sector) return null;
  for (const [key, val] of Object.entries(KRX_SECTOR_MAP)) {
    if (sector.includes(key)) return val;
  }
  return null;
};

export const toYahooSymbolKr = (ticker: string, exchange: string): string => {
  const suffix = exchange === 'KOSDAQ' ? '.KQ' : '.KS';
  return `${ticker}${suffix}`;
};

export const extractWebsiteDomain = (website: string | undefined): string | null => {
  if (!website) return null;
  try {
    return new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace(
      /^www\./,
      ''
    );
  } catch {
    return null;
  }
};
