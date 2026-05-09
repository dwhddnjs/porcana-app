// backfill-assets: impact_hint/sector/current_risk_level/personality가 null인 자산 일괄 채우기
// US: 하드코딩 티커→섹터 맵 (S&P 500 + 주요 종목)
// KR: 하드코딩 티커→섹터 맵 (KOSPI/KOSDAQ 주요 종목)
// sync-assets 실행 후 별도로 호출

// @ts-expect-error Deno 표준 라이브러리
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error Supabase Edge Functions npm specifier
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: { env: { get: (k: string) => string | undefined } };

type SectorTypes =
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

// ── US: S&P 500 + 주요 대형주 티커→섹터 ──
const US_TICKER_SECTOR_MAP: Record<string, SectorTypes> = {
  // Information Technology
  AAPL: 'INFORMATION_TECHNOLOGY',
  MSFT: 'INFORMATION_TECHNOLOGY',
  NVDA: 'INFORMATION_TECHNOLOGY',
  AMD: 'INFORMATION_TECHNOLOGY',
  INTC: 'INFORMATION_TECHNOLOGY',
  AVGO: 'INFORMATION_TECHNOLOGY',
  QCOM: 'INFORMATION_TECHNOLOGY',
  TXN: 'INFORMATION_TECHNOLOGY',
  MU: 'INFORMATION_TECHNOLOGY',
  AMAT: 'INFORMATION_TECHNOLOGY',
  KLAC: 'INFORMATION_TECHNOLOGY',
  LRCX: 'INFORMATION_TECHNOLOGY',
  ADI: 'INFORMATION_TECHNOLOGY',
  MRVL: 'INFORMATION_TECHNOLOGY',
  ASML: 'INFORMATION_TECHNOLOGY',
  ARM: 'INFORMATION_TECHNOLOGY',
  HIMX: 'INFORMATION_TECHNOLOGY',
  NVTS: 'INFORMATION_TECHNOLOGY',
  SMCI: 'INFORMATION_TECHNOLOGY',
  SNDK: 'INFORMATION_TECHNOLOGY',
  STX: 'INFORMATION_TECHNOLOGY',
  WDC: 'INFORMATION_TECHNOLOGY',
  GLW: 'INFORMATION_TECHNOLOGY',
  APH: 'INFORMATION_TECHNOLOGY',
  CRM: 'INFORMATION_TECHNOLOGY',
  ORCL: 'INFORMATION_TECHNOLOGY',
  SAP: 'INFORMATION_TECHNOLOGY',
  IBM: 'INFORMATION_TECHNOLOGY',
  ACN: 'INFORMATION_TECHNOLOGY',
  NOW: 'INFORMATION_TECHNOLOGY',
  INTU: 'INFORMATION_TECHNOLOGY',
  ADBE: 'INFORMATION_TECHNOLOGY',
  CDNS: 'INFORMATION_TECHNOLOGY',
  SNPS: 'INFORMATION_TECHNOLOGY',
  ADP: 'INFORMATION_TECHNOLOGY',
  PANW: 'INFORMATION_TECHNOLOGY',
  CRWD: 'INFORMATION_TECHNOLOGY',
  NET: 'INFORMATION_TECHNOLOGY',
  ANET: 'INFORMATION_TECHNOLOGY',
  CSCO: 'INFORMATION_TECHNOLOGY',
  NOK: 'INFORMATION_TECHNOLOGY',
  DDOG: 'INFORMATION_TECHNOLOGY',
  PLTR: 'INFORMATION_TECHNOLOGY',
  APP: 'INFORMATION_TECHNOLOGY',
  TTD: 'INFORMATION_TECHNOLOGY',
  APLD: 'INFORMATION_TECHNOLOGY',
  CRWV: 'INFORMATION_TECHNOLOGY',
  VRT: 'INFORMATION_TECHNOLOGY',
  PATH: 'INFORMATION_TECHNOLOGY',
  FSLY: 'INFORMATION_TECHNOLOGY',
  U: 'INFORMATION_TECHNOLOGY',
  BB: 'INFORMATION_TECHNOLOGY',
  IONQ: 'INFORMATION_TECHNOLOGY',
  QBTS: 'INFORMATION_TECHNOLOGY',
  RGTI: 'INFORMATION_TECHNOLOGY',
  SOUN: 'INFORMATION_TECHNOLOGY',
  SHOP: 'INFORMATION_TECHNOLOGY',
  DELL: 'INFORMATION_TECHNOLOGY',
  MARA: 'INFORMATION_TECHNOLOGY',
  RIOT: 'INFORMATION_TECHNOLOGY',
  CORZ: 'INFORMATION_TECHNOLOGY',
  IREN: 'INFORMATION_TECHNOLOGY',
  WULF: 'INFORMATION_TECHNOLOGY',
  CIFR: 'INFORMATION_TECHNOLOGY',
  BMNR: 'INFORMATION_TECHNOLOGY',

  // Communication Services
  GOOGL: 'COMMUNICATION_SERVICES',
  GOOG: 'COMMUNICATION_SERVICES',
  META: 'COMMUNICATION_SERVICES',
  NFLX: 'COMMUNICATION_SERVICES',
  DIS: 'COMMUNICATION_SERVICES',
  CMCSA: 'COMMUNICATION_SERVICES',
  T: 'COMMUNICATION_SERVICES',
  VZ: 'COMMUNICATION_SERVICES',
  TMUS: 'COMMUNICATION_SERVICES',
  SNAP: 'COMMUNICATION_SERVICES',
  PINS: 'COMMUNICATION_SERVICES',
  SPOT: 'COMMUNICATION_SERVICES',
  AMX: 'COMMUNICATION_SERVICES',

  // Consumer Discretionary
  AMZN: 'CONSUMER_DISCRETIONARY',
  TSLA: 'CONSUMER_DISCRETIONARY',
  HD: 'CONSUMER_DISCRETIONARY',
  LOW: 'CONSUMER_DISCRETIONARY',
  MCD: 'CONSUMER_DISCRETIONARY',
  SBUX: 'CONSUMER_DISCRETIONARY',
  TJX: 'CONSUMER_DISCRETIONARY',
  AAL: 'CONSUMER_DISCRETIONARY',
  BKNG: 'CONSUMER_DISCRETIONARY',
  ABNB: 'CONSUMER_DISCRETIONARY',
  MAR: 'CONSUMER_DISCRETIONARY',
  CVNA: 'CONSUMER_DISCRETIONARY',
  RIVN: 'CONSUMER_DISCRETIONARY',
  NIO: 'CONSUMER_DISCRETIONARY',
  F: 'CONSUMER_DISCRETIONARY',
  LYFT: 'CONSUMER_DISCRETIONARY',
  PTON: 'CONSUMER_DISCRETIONARY',
  DKNG: 'CONSUMER_DISCRETIONARY',
  NCLH: 'CONSUMER_DISCRETIONARY',
  CCL: 'CONSUMER_DISCRETIONARY',
  BABA: 'CONSUMER_DISCRETIONARY',
  CPNG: 'CONSUMER_DISCRETIONARY',
  MELI: 'CONSUMER_DISCRETIONARY',
  PDD: 'CONSUMER_DISCRETIONARY',
  GRAB: 'CONSUMER_DISCRETIONARY',
  TM: 'CONSUMER_DISCRETIONARY',
  SONY: 'CONSUMER_DISCRETIONARY',

  // Consumer Staples
  WMT: 'CONSUMER_STAPLES',
  PG: 'CONSUMER_STAPLES',
  KO: 'CONSUMER_STAPLES',
  PEP: 'CONSUMER_STAPLES',
  COST: 'CONSUMER_STAPLES',
  PM: 'CONSUMER_STAPLES',
  MO: 'CONSUMER_STAPLES',
  BTI: 'CONSUMER_STAPLES',
  UL: 'CONSUMER_STAPLES',
  KVUE: 'CONSUMER_STAPLES',
  CELH: 'CONSUMER_STAPLES',
  ABEV: 'CONSUMER_STAPLES',
  BUD: 'CONSUMER_STAPLES',

  // Health Care
  UNH: 'HEALTH_CARE',
  LLY: 'HEALTH_CARE',
  JNJ: 'HEALTH_CARE',
  ABBV: 'HEALTH_CARE',
  MRK: 'HEALTH_CARE',
  ABT: 'HEALTH_CARE',
  TMO: 'HEALTH_CARE',
  DHR: 'HEALTH_CARE',
  AMGN: 'HEALTH_CARE',
  VRTX: 'HEALTH_CARE',
  ISRG: 'HEALTH_CARE',
  GILD: 'HEALTH_CARE',
  BSX: 'HEALTH_CARE',
  SYK: 'HEALTH_CARE',
  MDT: 'HEALTH_CARE',
  PFE: 'HEALTH_CARE',
  CVS: 'HEALTH_CARE',
  MCK: 'HEALTH_CARE',
  ELV: 'HEALTH_CARE',
  HCA: 'HEALTH_CARE',
  VTRS: 'HEALTH_CARE',
  NVO: 'HEALTH_CARE',
  NVS: 'HEALTH_CARE',
  AZN: 'HEALTH_CARE',
  GSK: 'HEALTH_CARE',
  SNY: 'HEALTH_CARE',
  HLN: 'HEALTH_CARE',
  ZTS: 'HEALTH_CARE',

  // Financials
  JPM: 'FINANCIALS',
  BAC: 'FINANCIALS',
  WFC: 'FINANCIALS',
  GS: 'FINANCIALS',
  MS: 'FINANCIALS',
  BLK: 'FINANCIALS',
  SCHW: 'FINANCIALS',
  COF: 'FINANCIALS',
  AXP: 'FINANCIALS',
  V: 'FINANCIALS',
  MA: 'FINANCIALS',
  USB: 'FINANCIALS',
  PNC: 'FINANCIALS',
  C: 'FINANCIALS',
  BX: 'FINANCIALS',
  KKR: 'FINANCIALS',
  OWL: 'FINANCIALS',
  CB: 'FINANCIALS',
  SPGI: 'FINANCIALS',
  ICE: 'FINANCIALS',
  CME: 'FINANCIALS',
  IBKR: 'FINANCIALS',
  HBAN: 'FINANCIALS',
  BK: 'FINANCIALS',
  PGR: 'FINANCIALS',
  HOOD: 'FINANCIALS',
  RKT: 'FINANCIALS',
  SOFI: 'FINANCIALS',
  NU: 'FINANCIALS',
  HSBC: 'FINANCIALS',
  UBS: 'FINANCIALS',
  ING: 'FINANCIALS',
  SAN: 'FINANCIALS',
  BBVA: 'FINANCIALS',
  'BRK-B': 'FINANCIALS',
  RY: 'FINANCIALS',
  TD: 'FINANCIALS',
  BMO: 'FINANCIALS',
  BNS: 'FINANCIALS',
  CM: 'FINANCIALS',
  ITUB: 'FINANCIALS',
  BBD: 'FINANCIALS',
  MUFG: 'FINANCIALS',
  SMFG: 'FINANCIALS',
  MFG: 'FINANCIALS',
  HDB: 'FINANCIALS',
  IBN: 'FINANCIALS',
  BN: 'FINANCIALS',

  // Industrials
  HON: 'INDUSTRIALS',
  GE: 'INDUSTRIALS',
  CAT: 'INDUSTRIALS',
  RTX: 'INDUSTRIALS',
  LMT: 'INDUSTRIALS',
  BA: 'INDUSTRIALS',
  NOC: 'INDUSTRIALS',
  GD: 'INDUSTRIALS',
  DE: 'INDUSTRIALS',
  ETN: 'INDUSTRIALS',
  PH: 'INDUSTRIALS',
  CMI: 'INDUSTRIALS',
  HWM: 'INDUSTRIALS',
  TT: 'INDUSTRIALS',
  FDX: 'INDUSTRIALS',
  UPS: 'INDUSTRIALS',
  CSX: 'INDUSTRIALS',
  UNP: 'INDUSTRIALS',
  PWR: 'INDUSTRIALS',
  ACHR: 'INDUSTRIALS',
  JOBY: 'INDUSTRIALS',
  AUR: 'INDUSTRIALS',
  WM: 'INDUSTRIALS',
  UBER: 'INDUSTRIALS',
  JCI: 'INDUSTRIALS',
  GEV: 'INDUSTRIALS',
  PLUG: 'INDUSTRIALS',
  BE: 'INDUSTRIALS',
  EOSE: 'INDUSTRIALS',
  FLNC: 'INDUSTRIALS',
  QS: 'INDUSTRIALS',

  // Energy
  XOM: 'ENERGY',
  CVX: 'ENERGY',
  COP: 'ENERGY',
  SLB: 'ENERGY',
  DVN: 'ENERGY',
  CTRA: 'ENERGY',
  PR: 'ENERGY',
  RIG: 'ENERGY',
  PBR: 'ENERGY',
  BP: 'ENERGY',
  SHEL: 'ENERGY',
  TTE: 'ENERGY',
  E: 'ENERGY',
  EQNR: 'ENERGY',
  ENB: 'ENERGY',
  CNQ: 'ENERGY',
  SU: 'ENERGY',
  EPD: 'ENERGY',
  WMB: 'ENERGY',
  DNN: 'ENERGY',
  UUUU: 'ENERGY',
  SMR: 'ENERGY',
  AMPX: 'ENERGY',

  // Materials
  LIN: 'MATERIALS',
  NEM: 'MATERIALS',
  FCX: 'MATERIALS',
  RIO: 'MATERIALS',
  BHP: 'MATERIALS',
  SCCO: 'MATERIALS',
  AEM: 'MATERIALS',
  BTG: 'MATERIALS',
  AG: 'MATERIALS',
  CDE: 'MATERIALS',
  EXK: 'MATERIALS',
  HL: 'MATERIALS',

  // Real Estate
  AMT: 'REAL_ESTATE',
  PLD: 'REAL_ESTATE',
  EQIX: 'REAL_ESTATE',
  WELL: 'REAL_ESTATE',
  OPEN: 'REAL_ESTATE',

  // Utilities
  NEE: 'UTILITIES',
  DUK: 'UTILITIES',
  SO: 'UTILITIES',
  PCG: 'UTILITIES',
  CEG: 'UTILITIES',
  NGG: 'UTILITIES',
  AES: 'UTILITIES',
  SBS: 'UTILITIES',
};

// ── KR: KOSPI/KOSDAQ 주요 종목 티커→섹터 ──
const KR_TICKER_SECTOR_MAP: Record<string, SectorTypes> = {
  // Information Technology
  '000660': 'INFORMATION_TECHNOLOGY', // SK하이닉스
  '000990': 'INFORMATION_TECHNOLOGY', // DB하이텍
  '005930': 'INFORMATION_TECHNOLOGY', // 삼성전자
  '005935': 'INFORMATION_TECHNOLOGY', // 삼성전자우
  '006400': 'INFORMATION_TECHNOLOGY', // 삼성SDI
  '007660': 'INFORMATION_TECHNOLOGY', // 이수페타시스
  '009150': 'INFORMATION_TECHNOLOGY', // 삼성전기
  '011070': 'INFORMATION_TECHNOLOGY', // LG이노텍
  '012510': 'INFORMATION_TECHNOLOGY', // 더존비즈온
  '018260': 'INFORMATION_TECHNOLOGY', // 삼성에스디에스
  '022100': 'INFORMATION_TECHNOLOGY', // 포스코DX
  '034220': 'INFORMATION_TECHNOLOGY', // LG디스플레이
  '042700': 'INFORMATION_TECHNOLOGY', // 한미반도체
  '064400': 'INFORMATION_TECHNOLOGY', // LG씨엔에스
  '353200': 'INFORMATION_TECHNOLOGY', // 대덕전자
  '402340': 'INFORMATION_TECHNOLOGY', // SK스퀘어

  // Health Care
  '000100': 'HEALTH_CARE', // 유한양행
  '0126Z0': 'HEALTH_CARE', // 삼성에피스홀딩스
  '068270': 'HEALTH_CARE', // 셀트리온
  '128940': 'HEALTH_CARE', // 한미약품
  '207940': 'HEALTH_CARE', // 삼성바이오로직스
  '302440': 'HEALTH_CARE', // SK바이오사이언스
  '326030': 'HEALTH_CARE', // SK바이오팜

  // Financials
  '000810': 'FINANCIALS', // 삼성화재
  '001450': 'FINANCIALS', // 현대해상
  '001720': 'FINANCIALS', // 신영증권
  '005830': 'FINANCIALS', // DB손해보험
  '005940': 'FINANCIALS', // NH투자증권
  '006800': 'FINANCIALS', // 미래에셋증권
  '00680K': 'FINANCIALS', // 미래에셋증권2우B
  '016360': 'FINANCIALS', // 삼성증권
  '024110': 'FINANCIALS', // 기업은행
  '029780': 'FINANCIALS', // 삼성카드
  '031210': 'FINANCIALS', // 서울보증보험
  '032830': 'FINANCIALS', // 삼성생명
  '039490': 'FINANCIALS', // 키움증권
  '055550': 'FINANCIALS', // 신한지주
  '071050': 'FINANCIALS', // 한국금융지주
  '086790': 'FINANCIALS', // 하나금융지주
  '088350': 'FINANCIALS', // 한화생명
  '105560': 'FINANCIALS', // KB금융
  '138040': 'FINANCIALS', // 메리츠금융지주
  '138930': 'FINANCIALS', // BNK금융지주
  '139130': 'FINANCIALS', // iM금융지주
  '175330': 'FINANCIALS', // JB금융지주
  '316140': 'FINANCIALS', // 우리금융지주
  '323410': 'FINANCIALS', // 카카오뱅크
  '377300': 'FINANCIALS', // 카카오페이

  // Consumer Discretionary
  '000270': 'CONSUMER_DISCRETIONARY', // 기아
  '004170': 'CONSUMER_DISCRETIONARY', // 신세계
  '005380': 'CONSUMER_DISCRETIONARY', // 현대차
  '005385': 'CONSUMER_DISCRETIONARY', // 현대차우
  '005387': 'CONSUMER_DISCRETIONARY', // 현대차2우B
  '005850': 'CONSUMER_DISCRETIONARY', // 에스엘
  '007340': 'CONSUMER_DISCRETIONARY', // DN오토모티브
  '008770': 'CONSUMER_DISCRETIONARY', // 호텔신라
  '012330': 'CONSUMER_DISCRETIONARY', // 현대모비스
  '021240': 'CONSUMER_DISCRETIONARY', // 코웨이
  '023530': 'CONSUMER_DISCRETIONARY', // 롯데쇼핑
  '035250': 'CONSUMER_DISCRETIONARY', // 강원랜드
  '066570': 'CONSUMER_DISCRETIONARY', // LG전자
  '086280': 'CONSUMER_DISCRETIONARY', // 현대글로비스
  '090430': 'CONSUMER_DISCRETIONARY', // 아모레퍼시픽
  '139480': 'CONSUMER_DISCRETIONARY', // 이마트
  '161390': 'CONSUMER_DISCRETIONARY', // 한국타이어앤테크놀로지
  '204320': 'CONSUMER_DISCRETIONARY', // HL만도
  '278470': 'CONSUMER_DISCRETIONARY', // 에이피알
  '383220': 'CONSUMER_DISCRETIONARY', // F&F
  '483650': 'CONSUMER_DISCRETIONARY', // 달바글로벌

  // Consumer Staples
  '003230': 'CONSUMER_STAPLES', // 삼양식품
  '033780': 'CONSUMER_STAPLES', // KT&G
  '051900': 'CONSUMER_STAPLES', // LG생활건강
  '097950': 'CONSUMER_STAPLES', // CJ제일제당
  '271560': 'CONSUMER_STAPLES', // 오리온

  // Communication Services
  '017670': 'COMMUNICATION_SERVICES', // SK텔레콤
  '030200': 'COMMUNICATION_SERVICES', // KT
  '032640': 'COMMUNICATION_SERVICES', // LG유플러스
  '035420': 'COMMUNICATION_SERVICES', // NAVER
  '035720': 'COMMUNICATION_SERVICES', // 카카오
  '036570': 'COMMUNICATION_SERVICES', // NC소프트
  '251270': 'COMMUNICATION_SERVICES', // 넷마블
  '259960': 'COMMUNICATION_SERVICES', // 크래프톤
  '352820': 'COMMUNICATION_SERVICES', // 하이브

  // Industrials
  '000150': 'INDUSTRIALS', // 두산
  '000155': 'INDUSTRIALS', // 두산우
  '000500': 'INDUSTRIALS', // 가온전선
  '000720': 'INDUSTRIALS', // 현대건설
  '000880': 'INDUSTRIALS', // 한화
  '001040': 'INDUSTRIALS', // CJ
  '001440': 'INDUSTRIALS', // 대한전선
  '003490': 'INDUSTRIALS', // 대한항공
  '003550': 'INDUSTRIALS', // LG
  '004800': 'INDUSTRIALS', // 효성
  '004990': 'INDUSTRIALS', // 롯데지주
  '006260': 'INDUSTRIALS', // LS
  '006360': 'INDUSTRIALS', // GS건설
  '009540': 'INDUSTRIALS', // HD한국조선해양
  '010060': 'INDUSTRIALS', // OCI홀딩스
  '010120': 'INDUSTRIALS', // LS ELECTRIC
  '010140': 'INDUSTRIALS', // 삼성중공업
  '011200': 'INDUSTRIALS', // HMM
  '012450': 'INDUSTRIALS', // 한화에어로스페이스
  '012750': 'INDUSTRIALS', // 에스원
  '017800': 'INDUSTRIALS', // 현대엘리베이터
  '018880': 'INDUSTRIALS', // 한온시스템
  '028050': 'INDUSTRIALS', // 삼성E&A
  '028260': 'INDUSTRIALS', // 삼성물산
  '028670': 'INDUSTRIALS', // 팬오션
  '034020': 'INDUSTRIALS', // 두산에너빌리티
  '034730': 'INDUSTRIALS', // SK
  '042660': 'INDUSTRIALS', // 한화오션
  '047040': 'INDUSTRIALS', // 대우건설
  '047050': 'INDUSTRIALS', // 포스코인터내셔널
  '047810': 'INDUSTRIALS', // 한국항공우주
  '062040': 'INDUSTRIALS', // 산일전기
  '064350': 'INDUSTRIALS', // 현대로템
  '071970': 'INDUSTRIALS', // HD현대마린엔진
  '078930': 'INDUSTRIALS', // GS
  '079550': 'INDUSTRIALS', // LIG디펜스앤에어로스페이스
  '082740': 'INDUSTRIALS', // 한화엔진
  '088980': 'INDUSTRIALS', // 맥쿼리인프라
  '099190': 'INDUSTRIALS', // 아이티엠반도체 (if exists)
  '103590': 'INDUSTRIALS', // 일진전기
  '112610': 'INDUSTRIALS', // 씨에스윈드
  '120110': 'INDUSTRIALS', // 코오롱인더
  '180640': 'INDUSTRIALS', // 한진칼
  '241560': 'INDUSTRIALS', // 두산밥캣
  '267250': 'INDUSTRIALS', // HD현대
  '267260': 'INDUSTRIALS', // HD현대일렉트릭
  '267270': 'INDUSTRIALS', // HD건설기계
  '272210': 'INDUSTRIALS', // 한화시스템
  '298040': 'INDUSTRIALS', // 효성중공업
  '307950': 'INDUSTRIALS', // 현대오토에버
  '329180': 'INDUSTRIALS', // HD현대중공업
  '336260': 'INDUSTRIALS', // 두산퓨얼셀
  '373220': 'INDUSTRIALS', // LG에너지솔루션
  '375500': 'INDUSTRIALS', // DL이앤씨
  '439260': 'INDUSTRIALS', // 대한조선
  '443060': 'INDUSTRIALS', // HD현대마린솔루션
  '454910': 'INDUSTRIALS', // 두산로보틱스
  '489790': 'INDUSTRIALS', // 한화비전
  '009970': 'INDUSTRIALS', // 영원무역홀딩스

  // Energy
  '010950': 'ENERGY', // S-Oil
  '036460': 'ENERGY', // 한국가스공사
  '096770': 'ENERGY', // SK이노베이션

  // Materials
  '002380': 'MATERIALS', // KCC
  '003670': 'MATERIALS', // 포스코퓨처엠
  '004020': 'MATERIALS', // 현대제철
  '005490': 'MATERIALS', // POSCO홀딩스
  '009830': 'MATERIALS', // 한화솔루션
  '010130': 'MATERIALS', // 고려아연
  '011170': 'MATERIALS', // 롯데케미칼
  '011780': 'MATERIALS', // 금호석유화학
  '011790': 'MATERIALS', // SKC
  '014680': 'MATERIALS', // 한솔케미칼
  '020150': 'MATERIALS', // 롯데에너지머티리얼즈
  '051910': 'MATERIALS', // LG화학
  '066970': 'MATERIALS', // 엘앤에프
  '103140': 'MATERIALS', // 풍산
  '111770': 'MATERIALS', // 영원무역
  '450080': 'MATERIALS', // 에코프로머티
  '457190': 'MATERIALS', // 이수스페셜티케미컬

  // Utilities
  '015760': 'UTILITIES', // 한국전력
  '051600': 'UTILITIES', // 한전KPS
  '052690': 'UTILITIES', // 한전기술

  // 테마형 ETF — 섹터 있는 것만 매핑 (광범위 지수 ETF는 null)
  '091160': 'INFORMATION_TECHNOLOGY', // KODEX 반도체
  '133690': 'INFORMATION_TECHNOLOGY', // TIGER 미국나스닥100
  '305080': 'INFORMATION_TECHNOLOGY', // TIGER 미국나스닥100 (다른 버전)
  '305720': 'INDUSTRIALS',            // KODEX 2차전지산업
  '367380': 'INFORMATION_TECHNOLOGY', // ACE 미국나스닥100
  '379810': 'INFORMATION_TECHNOLOGY', // KODEX 미국나스닥100
  '381170': 'INFORMATION_TECHNOLOGY', // TIGER 미국테크TOP10 INDXX
  '381180': 'INFORMATION_TECHNOLOGY', // TIGER 미국필라델피아반도체나스닥
  '395160': 'INFORMATION_TECHNOLOGY', // KODEX AI반도체
  '395270': 'INFORMATION_TECHNOLOGY', // HANARO Fn K-반도체
  '396500': 'INFORMATION_TECHNOLOGY', // TIGER 반도체TOP10
  '411060': 'MATERIALS',              // ACE KRX금현물
  '487240': 'INFORMATION_TECHNOLOGY', // KODEX AI전력핵심설비
  // 채권·금리 ETF
  '0043B0': 'FINANCIALS', // TIGER 머니마켓액티브
  '273130': 'FINANCIALS', // KODEX 종합채권(AA-이상)액티브
  '357870': 'FINANCIALS', // TIGER CD금리투자KIS(합성)
  '423160': 'FINANCIALS', // KODEX KOFR금리액티브(합성)
  '455890': 'FINANCIALS', // RISE 머니마켓액티브
  '458730': 'FINANCIALS', // TIGER 미국배당다우존스
  '459580': 'FINANCIALS', // KODEX CD금리액티브(합성)
  '481050': 'FINANCIALS', // KODEX CD1년금리플러스액티브(합성)
  '488770': 'FINANCIALS', // KODEX 머니마켓액티브
};

const US_SECTOR_RULES: Record<string, { risk: number; hint: string }> = {
  INFORMATION_TECHNOLOGY: { risk: 4, hint: 'Leading US technology and semiconductor company' },
  HEALTH_CARE: { risk: 4, hint: 'US healthcare and pharmaceutical company' },
  FINANCIALS: { risk: 2, hint: 'US financial services and banking company' },
  CONSUMER_DISCRETIONARY: { risk: 3, hint: 'US consumer discretionary and retail company' },
  CONSUMER_STAPLES: { risk: 2, hint: 'US consumer staples and essential goods company' },
  COMMUNICATION_SERVICES: { risk: 3, hint: 'US communication and media services company' },
  INDUSTRIALS: { risk: 3, hint: 'US industrial and manufacturing company' },
  ENERGY: { risk: 3, hint: 'US energy sector company' },
  MATERIALS: { risk: 3, hint: 'US materials and mining company' },
  REAL_ESTATE: { risk: 2, hint: 'US real estate and REIT company' },
  UTILITIES: { risk: 1, hint: 'US utilities and power company' },
};

// 섹터 기본 리스크와 크게 다른 종목 개별 오버라이드
// 아레나 추천 정확도를 위해 섹터 평균과 편차가 큰 종목만 명시
const TICKER_RISK_OVERRIDE: Record<string, number> = {
  // ── risk 5: 투기/초기단계/극변동 ──
  // 크립토 마이닝 (IT 기본값 4보다 높음)
  MARA: 5, RIOT: 5, WULF: 5, CIFR: 5, BMNR: 5, CORZ: 5, IREN: 5,
  // 양자컴퓨팅 초기 단계
  IONQ: 5, RGTI: 5, QBTS: 5,
  // EV/모빌리티 적자 스타트업
  RIVN: 5, NIO: 5, LCID: 5, PTON: 5,
  // 수소/연료전지 초기
  PLUG: 5,
  // 기타 고변동
  DKNG: 4, SNAP: 4,

  // ── risk 4: Consumer Discretionary 기본값(3)보다 높음 ──
  TSLA: 4,   // 고변동 EV/AI 복합
  LYFT: 4,   // 수익성 불안정 라이드헤일링
  CVNA: 4,   // 중고차 e-커머스, 레버리지 높음
  JOBY: 5,   // 에어택시 초기단계
  ACHR: 5,   // 에어택시 초기단계
  AUR: 4,    // 자율주행 초기단계
  EOSE: 5,   // 배터리 스토리지 스타트업
  QS: 5,     // EV 배터리 전고체, 상용화 전
  FLNC: 4,   // 에너지스토리지 성장주
  BE: 4,     // 블룸에너지 연료전지

  // ── risk 4: Communication Services 기본값(3)보다 높음 ──
  PINS: 4, SPOT: 4, SOUN: 4,

  // ── risk 3: Financials 기본값(2)보다 높음 ──
  HOOD: 4,   // 핀테크 스타트업, 고변동
  SOFI: 3,   // 핀테크 성장주
  NU: 3,     // 신흥국 핀테크, 높은 성장 리스크
  RKT: 3,    // 모기지 경기민감

  // ── risk 3: Health Care 기본값(4)보다 낮음 (대형 안정 제약) ──
  JNJ: 3, PFE: 3, MRK: 3, ABT: 3, MDT: 3, CVS: 3, MCK: 3,
  UNH: 3, ELV: 3, HCA: 3,  // 헬스케어 서비스/보험 (바이오 아님)
  AZN: 3, NVS: 3, NVO: 3, GSK: 3, SNY: 3, HLN: 3,  // 안정형 글로벌 제약

  // ── risk 1: Consumer Staples 기본값(2)보다 낮음 (초우량 배당주) ──
  KO: 1, PG: 1, PEP: 1, PM: 1, MO: 1,

  // ── KR 개별 오버라이드 ──
  // risk 4: Industrials 기본값(3)보다 높음
  '454910': 4, // 두산로보틱스 (로봇 초기 기업)
  '336260': 4, // 두산퓨얼셀 (수소 연료전지)
  '112610': 4, // 씨에스윈드 (풍력 성장주)
  // risk 4: Communication Services 기본값(3)보다 높음
  '035720': 4, // 카카오 (플랫폼 규제 리스크)
  '035420': 4, // NAVER (빅테크 규제 리스크)
  '352820': 4, // 하이브 (K-pop 엔터, 사업 변동성)
  '259960': 4, // 크래프톤 (게임 사이클 민감)
  '251270': 4, // 넷마블 (게임, 수익성 불안정)
  // risk 4: Consumer Discretionary 기본값(3)보다 높음
  '278470': 4, // 에이피알 (K-뷰티 성장주, 수출 변동)
  '483650': 4, // 달바글로벌 (K-뷰티 소형 성장주)
  // risk 3: Health Care 기본값(5)보다 낮음 (안정형 대형 제약)
  '000100': 3, // 유한양행 (안정형 제약)
  '128940': 3, // 한미약품 (대형 제약, 상대적 안정)
  // risk 1: Utilities 기본값(1) → 이미 맞음
};

// ETF 테마별 힌트 (섹터가 있는 테마 ETF용)
const KR_ETF_SECTOR_HINT: Record<string, string> = {
  INFORMATION_TECHNOLOGY: '반도체·IT 테마 ETF',
  INDUSTRIALS: '2차전지·산업 테마 ETF',
  MATERIALS: '금·원자재 테마 ETF',
  FINANCIALS: '채권·금리 ETF',
  ENERGY: '에너지 테마 ETF',
};

const US_ETF_SECTOR_HINT: Record<string, string> = {
  INFORMATION_TECHNOLOGY: 'Technology-focused US ETF',
  INDUSTRIALS: 'Industrial sector US ETF',
  MATERIALS: 'Commodities and materials US ETF',
  FINANCIALS: 'Bond and financial US ETF',
  ENERGY: 'Energy sector US ETF',
};

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

type AssetRowTypes = {
  asset_id: string;
  ticker: string;
  yahoo_symbol: string;
  market: 'US' | 'KR';
  type: 'STOCK' | 'ETF';
  sector: SectorTypes | null;
  impact_hint: string | null;
};


serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data, error } = await admin
    .from('assets')
    .select('asset_id, ticker, yahoo_symbol, market, type, sector, impact_hint')
    .in('market', ['US', 'KR']);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const assets: AssetRowTypes[] = data ?? [];
  let ok = 0;
  let sectorHits = 0;
  const failures: { ticker: string; error: string }[] = [];

  for (const asset of assets) {
    try {
      if (asset.market === 'US') {
        const isEtf = asset.type === 'ETF';
        const sector = US_TICKER_SECTOR_MAP[asset.ticker] ?? asset.sector;
        if (sector) sectorHits++;
        const rule = US_SECTOR_RULES[sector ?? ''];
        const riskLevel = isEtf ? 2 : (TICKER_RISK_OVERRIDE[asset.ticker] ?? rule?.risk ?? 3);

        const updatePayload: Record<string, unknown> = {
          sector: sector ?? asset.sector,
          current_risk_level: riskLevel,
        };

        // impact_hint가 없는 경우에만 큐레이션 필드 채움
        if (!asset.impact_hint) {
          const etfHint = isEtf
            ? (US_ETF_SECTOR_HINT[sector ?? ''] ?? 'Diversified US market ETF')
            : null;
          updatePayload.impact_hint = etfHint ?? rule?.hint ?? 'US listed company';
          updatePayload.personality = isEtf
            ? { growth: 20, stability: 60, income: 20 }
            : riskLevel >= 4
              ? { growth: 60, stability: 20, income: 20 }
              : { growth: 40, stability: 40, income: 20 };
        }

        const { error: updateError } = await admin
          .from('assets')
          .update(updatePayload)
          .eq('asset_id', asset.asset_id);

        if (updateError) throw updateError;
        ok++;
      } else {
        // KR: 하드코딩 맵 우선, 없으면 DB 기존 sector
        const isEtf = asset.type === 'ETF';
        const sector = KR_TICKER_SECTOR_MAP[asset.ticker] ?? asset.sector;
        if (sector) sectorHits++;
        const rule = KR_SECTOR_RULES[sector ?? ''];
        const riskLevel = isEtf ? 2 : (TICKER_RISK_OVERRIDE[asset.ticker] ?? rule?.risk ?? 3);

        const updatePayload: Record<string, unknown> = {
          sector: sector ?? asset.sector,
          current_risk_level: riskLevel,
        };

        // impact_hint가 없는 경우에만 큐레이션 필드 채움
        if (!asset.impact_hint) {
          const krEtfHint = isEtf
            ? (KR_ETF_SECTOR_HINT[sector ?? ''] ?? '국내 시장 분산 ETF')
            : null;
          updatePayload.impact_hint = krEtfHint ?? rule?.hint ?? '국내 주요 상장 기업';
          updatePayload.personality = isEtf
            ? { growth: 20, stability: 60, income: 20 }
            : riskLevel >= 4
              ? { growth: 60, stability: 20, income: 20 }
              : { growth: 40, stability: 40, income: 20 };
        }

        const { error: updateError } = await admin
          .from('assets')
          .update(updatePayload)
          .eq('asset_id', asset.asset_id);

        if (updateError) throw updateError;
        ok++;
      }
    } catch (err) {
      failures.push({
        ticker: asset.ticker,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return new Response(
    JSON.stringify({
      total: assets.length,
      ok,
      failed: failures.length,
      sector_hits: sectorHits,
      failures: failures.slice(0, 20),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
