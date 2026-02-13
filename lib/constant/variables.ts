export const SECTOR_OPTIONS = [
  'MATERIALS',
  'COMMUNICATION_SERVICES',
  'CONSUMER_DISCRETIONARY',
  'CONSUMER_STAPLES',
  'ENERGY',
  'FINANCIALS',
  'HEALTH_CARE',
  'INDUSTRIALS',
  'REAL_ESTATE',
  'INFORMATION_TECHNOLOGY',
  'UTILITIES',
];

export const SECTOR_OPTIONS_KO = [
  '소재',
  '커뮤니케이션 서비스',
  '경기소비재',
  '필수소비재',
  '에너지',
  '금융',
  '헬스케어',
  '산업재',
  '부동산',
  '정보기술',
  '유틸리티',
];

export const SECTOR_KO_MAP: Record<string, string> = {
  MATERIALS: '소재',
  COMMUNICATION_SERVICES: '커뮤니케이션 서비스',
  CONSUMER_DISCRETIONARY: '경기소비재',
  CONSUMER_STAPLES: '필수소비재',
  ENERGY: '에너지',
  FINANCIALS: '금융',
  HEALTH_CARE: '헬스케어',
  INDUSTRIALS: '산업재',
  REAL_ESTATE: '부동산',
  INFORMATION_TECHNOLOGY: '정보기술',
  UTILITIES: '유틸리티',
};

export const CAROUSEL_ITEMS = [
  {
    image: require('@/assets/images/coin.png'),
    title: '투자 성향과 섹터로 전략을 정해요',
    description:
      '당신의 스타일에 맞게 시작합니다.\n보수적. 균형. 공격적 투자 성향 선택\n관심 있는 섹터를 고르면 추천이 달라져요',
  },
  {
    image: require('@/assets/images/money.png'),
    title: '카드를 고르듯 종목을 선택하세요',
    description:
      '게임하듯 쉽고 직관적으로\n추천된 종목 중 하나를 선택\n복잡한 계산 없이 자연스럽게 분산 투자',
  },
  {
    image: require('@/assets/images/card.png'),
    title: '선택의 결과를 수익률로 확인하세요',
    description:
      '결과로 배우는 투자\n실제 시작 데이터로 수익률 추적\n시간이 지날수록 내 선택이 어떻게 변했는지 확인',
  },
];

// 섹터 한글 매핑
export const sectorLabels: Record<string, string> = {
  INFORMATION_TECHNOLOGY: 'IT',
  HEALTH_CARE: '헬스케어',
  FINANCIALS: '금융',
  CONSUMER_DISCRETIONARY: '경기소비재',
  COMMUNICATION_SERVICES: '커뮤니케이션',
  INDUSTRIALS: '산업재',
  CONSUMER_STAPLES: '필수소비재',
  ENERGY: '에너지',
  UTILITIES: '유틸리티',
  REAL_ESTATE: '부동산',
  MATERIALS: '소재',
};
