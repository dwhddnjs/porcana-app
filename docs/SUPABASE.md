# Porcana — Supabase 구조 & API 문서

> 마지막 업데이트: 2026-05-07

---

## 목차

1. [전체 아키텍처](#1-전체-아키텍처)
2. [데이터베이스 스키마](#2-데이터베이스-스키마)
3. [RPC 함수](#3-rpc-함수)
4. [Edge Functions](#4-edge-functions)
5. [자동화 스케줄 (pg_cron)](#5-자동화-스케줄-pg_cron)
6. [클라이언트 API 함수](#6-클라이언트-api-함수)
7. [React Query 훅](#7-react-query-훅)
8. [전체 데이터 흐름](#8-전체-데이터-흐름)

---

## 1. 전체 아키텍처

```
Expo 앱 (React Native)
  │
  ├── lib/api/            ← Supabase SDK + Axios 래퍼
  ├── lib/hooks/query/    ← TanStack React Query (조회)
  ├── lib/hooks/mutation/ ← TanStack React Query (변경)
  └── lib/supabase/       ← Supabase 클라이언트 설정
          │
          ▼
    Supabase (Backend)
    ├── Auth              ← 이메일 / 익명 / Google / Apple 로그인
    ├── Postgres DB       ← 9개 테이블 + RLS
    ├── Edge Functions    ← 복잡한 비즈니스 로직 / 외부 API
    └── pg_cron           ← 가격·환율·수익률 자동 갱신
```

**클라이언트 분기:**
- 단순 CRUD → `lib/supabase/client.ts` (anon key + RLS)
- 복잡한 로직 / 외부 API → Supabase Edge Function (서비스 키)

---

## 2. 데이터베이스 스키마

### 테이블 관계도

```
auth.users (Supabase 내장)
    │ 1:1
    ▼
profiles
    │
    └──< portfolios >──< portfolio_holdings >──> assets
            │                                       │
            └──< portfolio_value_history         asset_prices
            │
            └──< arena_sessions >──< arena_rounds
                                        │ FK → assets

fx_rates (독립 테이블)
```

---

### 2.1 `profiles` — 사용자 프로필

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `user_id` | uuid PK | `auth.users.id` 참조 |
| `nickname` | text | 닉네임 |
| `created_at` | timestamptz | 생성일 |
| `updated_at` | timestamptz | 수정일 (자동 갱신) |

- **RLS**: 본인(`auth.uid() = user_id`)만 SELECT / UPDATE
- **트리거**: `auth.users` INSERT 시 `handle_new_user()` 자동 실행 → `profiles` 행 생성

---

### 2.2 `assets` — 종목 마스터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `asset_id` | uuid PK | |
| `ticker` | text UNIQUE | 거래소 티커 (예: AAPL, 005930) |
| `yahoo_symbol` | text | Yahoo Finance 심볼 (KR: `005930.KS`) |
| `name` | text | 종목명 |
| `market` | text | `US` / `KR` |
| `type` | text | `STOCK` / `ETF` |
| `sector` | text | 섹터 (Technology, Healthcare 등) |
| `asset_class` | text | 자산 분류 |
| `current_risk_level` | int | 리스크 레벨 1–5 |
| `image_url` | text | 로고 이미지 URL |
| `website_domain` | text | 기업 도메인 (로고 조회용) |
| `description` | text | 종목 설명 |
| `impact_hint` | text | 포트폴리오 영향 힌트 |
| `personality` | text | 성격 태그 |

- **RLS**: 누구나 SELECT 가능 (익명 포함)
- **시드 데이터**: US 주식 22개, US ETF 3개, KR 주식 23개, KR ETF 5개 (총 53개)
- **로고 소스**: US → `parqet.com/logos/symbol/{ticker}`, KR → `logo.clearbit.com/{website_domain}`

---

### 2.3 `asset_prices` — 주가 캐시

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | |
| `asset_id` | uuid FK | `assets.asset_id` |
| `range` | text | `1M` / `3M` / `1Y` |
| `points` | jsonb | `[{date, close}]` 배열 |
| `current_price` | numeric | 최신 현재가 |
| `currency` | text | `USD` / `KRW` |
| `fetched_at` | timestamptz | 마지막 수집 시각 |

- **RLS**: 누구나 SELECT 가능
- **UNIQUE**: `(asset_id, range)`
- **갱신 주기**: KST 10:00 / 00:00 (pg_cron → `refresh-prices` Edge Function)

---

### 2.4 `portfolios` — 포트폴리오

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `portfolio_id` | uuid PK | |
| `user_id` | uuid FK | `auth.users.id` |
| `name` | text | 포트폴리오 이름 |
| `status` | text | `DRAFT` / `ACTIVE` |
| `is_main` | boolean | 메인 포트폴리오 여부 |
| `seed_money` | numeric | 시드머니 |
| `base_currency` | text | `KRW` / `USD` |
| `total_return_pct` | numeric | 누적 수익률 (%) |
| `average_risk_level` | numeric | 평균 리스크 레벨 |
| `started_at` | timestamptz | 시드머니 설정 시각 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

- **RLS**: `user_id = auth.uid()` 인 행만 접근

---

### 2.5 `portfolio_holdings` — 보유 종목

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `holding_id` | uuid PK | |
| `portfolio_id` | uuid FK | `portfolios.portfolio_id` |
| `asset_id` | uuid FK | `assets.asset_id` |
| `target_weight_pct` | numeric | 목표 비중 (%) |
| `quantity` | numeric | 보유 수량 |
| `avg_price` | numeric | 평균 매입가 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

- **RLS**: 포트폴리오 소유자만 접근

---

### 2.6 `portfolio_value_history` — 수익률 스냅샷

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | |
| `portfolio_id` | uuid FK | |
| `date` | date | 기준일 |
| `index_value` | numeric | 가중 지수값 (기준 100) |
| `return_pct` | numeric | 누적 수익률 (%) |
| `daily_return_pct` | numeric | 일별 수익률 (%) |

- **UNIQUE**: `(portfolio_id, date)`
- **갱신 주기**: KST 10:05 / 00:05 (pg_cron → `recalc-portfolio-returns`)

---

### 2.7 `arena_sessions` — 아레나 게임 세션

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `session_id` | uuid PK | |
| `user_id` | uuid FK | |
| `portfolio_id` | uuid FK | 완료 후 생성된 포트폴리오 |
| `name` | text | 세션(포트폴리오) 이름 |
| `status` | text | `IN_PROGRESS` / `COMPLETED` |
| `current_round` | int | 현재 라운드 (1–10) |
| `max_rounds` | int | 최대 라운드 (기본 10) |
| `risk_profile` | text | `AGGRESSIVE` / `BALANCED` / `SAFE` |
| `sectors` | text[] | 관심 섹터 목록 |
| `markets` | text[] | 관심 시장 (`US`, `KR`) |

- **RLS**: 소유자만 접근

---

### 2.8 `arena_rounds` — 아레나 라운드 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `round_id` | uuid PK | |
| `session_id` | uuid FK | |
| `round_number` | int | 라운드 번호 (1–10) |
| `candidate_asset_ids` | uuid[] | 추천된 3개 자산 ID |
| `picked_asset_id` | uuid FK | 선택한 자산 ID |
| `picked_at` | timestamptz | 선택 시각 |

- **RLS**: 세션 소유자만 접근

---

### 2.9 `fx_rates` — 환율

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | int PK | |
| `base` | text | 기준 통화 (예: `USD`) |
| `quote` | text | 상대 통화 (예: `KRW`) |
| `rate` | numeric | 환율 (1 base = rate quote) |
| `fetched_at` | timestamptz | 마지막 갱신 시각 |

- **RLS**: authenticated 사용자만 SELECT
- **초기값**: USD/KRW = 1380
- **갱신 주기**: KST 09:00 (pg_cron → `refresh-fx`)

---

## 3. RPC 함수

### 3.1 `recommend_arena_cards()`

아레나 라운드에서 추천 카드 3장을 반환하는 PostgreSQL 함수.

**파라미터:**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `p_risk_profile` | text | `AGGRESSIVE` / `BALANCED` / `SAFE` |
| `p_sectors` | text[] | 관심 섹터 (빈 배열이면 전체) |
| `p_exclude_ids` | uuid[] | 이미 선택/표시된 자산 ID |

**반환:** `asset_id`, `ticker`, `name`, `sector`, `current_risk_level`, `image_url`, `description`

**로직:**
1. `p_exclude_ids` 제외
2. 리스크 레벨 거리(`abs(current_risk_level - target)`) 기준 정렬
3. 섹터 매칭 우선순위 적용 (필터가 아닌 정렬로 처리 → 30개 후보 확보)
4. 상위 3개 반환

---

### 3.2 `finalize_arena_portfolio()`

아레나 10라운드 완료 후 포트폴리오를 생성하는 함수.

**파라미터:**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `p_session_id` | uuid | 완료된 아레나 세션 ID |
| `p_name` | text | 포트폴리오 이름 |

**반환:** `portfolio_id` (생성된 포트폴리오 UUID)

**로직:**
1. `arena_rounds`에서 선택된 10개 자산 조회
2. `portfolios` 행 생성 (`status = ACTIVE`)
3. `portfolio_holdings` 생성 (각 자산 `target_weight_pct = 10%`)
4. 기존 메인 포트폴리오 없으면 `is_main = true` 설정
5. `arena_sessions.portfolio_id` 업데이트

---

## 4. Edge Functions

> 모든 Edge Function은 `Authorization: Bearer <supabase-anon-key>` 또는 서비스 키 헤더 필요.
> 기본 URL: `{SUPABASE_URL}/functions/v1/`

---

### 4.1 `get-home`

홈 화면 데이터를 반환.

**Method:** `GET`

**응답:**
```ts
{
  portfolio: {
    portfolio_id: string
    name: string
    total_return_pct: number
    average_risk_level: number
    seed_money: number
    base_currency: "KRW" | "USD"
    started_at: string | null
  }
  holdings: Array<{
    asset_id: string
    ticker: string
    name: string
    image_url: string
    target_weight_pct: number
    current_price: number
    currency: "USD" | "KRW"
  }>
  chart: Array<{
    date: string      // "YYYY-MM-DD"
    index_value: number  // 기준 100
  }>
}
```

**로직:**
- 메인 포트폴리오(`is_main = true`) 조회
- 보유 종목별 1Y 가격 데이터 조회
- `portfolio_value_history` 에서 일별 지수값 조회
- 이미지: `website_domain` 우선 → `image_url` 폴백

---

### 4.2 `portfolio-seed-preview`

시드머니 입력 시 자산별 매수 수량을 DB write 없이 미리 계산.

**Method:** `POST`

**요청:**
```ts
{
  portfolio_id: string
  seed_money: number
  base_currency: "KRW" | "USD"
}
```

**응답:**
```ts
{
  holdings: Array<{
    asset_id: string
    ticker: string
    name: string
    target_weight_pct: number
    allocated_amount: number   // 배분 금액
    quantity: number           // 매수 수량
    price: number              // 현재가
    currency: "USD" | "KRW"
    price_in_base: number      // 기준 통화로 환산한 가격
  }>
  total_allocated: number
  remaining_cash: number
}
```

---

### 4.3 `portfolio-set-seed`

시드머니를 확정하고 보유 수량을 저장.

**Method:** `POST`

**요청:**
```ts
{
  portfolio_id: string
  seed_money: number
  base_currency: "KRW" | "USD"
}
```

**응답:**
```ts
{ success: true }
```

**로직:**
1. `portfolios.seed_money`, `base_currency`, `started_at` 업데이트
2. 각 보유 종목의 `quantity`, `avg_price` 계산 후 저장

---

### 4.4 `portfolio-holding-baseline`

보유 자산 현황 조회 (저장된 수량 기준, 환율 적용).

**Method:** `GET` (query: `portfolio_id`)

**응답:**
```ts
{
  holdings: Array<{
    asset_id: string
    ticker: string
    name: string
    quantity: number
    avg_price: number
    current_price: number
    current_price_krw: number   // KRW 환산가
    market_value: number        // 평가금액 (기준 통화)
    market_value_krw: number    // KRW 환산 평가금액
    gain_loss_pct: number       // 개별 손익률 (%)
  }>
  total_market_value_krw: number
  total_cost_krw: number
  total_gain_loss_pct: number
}
```

---

### 4.5 `portfolio-rebalance-status`

현재 비중 vs 목표 비중 편차를 계산하여 리벨런싱 필요 여부 반환.

**Method:** `GET` (query: `portfolio_id`, `threshold?` 기본 5)

**응답:**
```ts
{
  needs_rebalance: boolean
  holdings: Array<{
    asset_id: string
    ticker: string
    name: string
    target_weight_pct: number
    current_weight_pct: number
    deviation_pct: number       // 편차 (절댓값)
    needs_action: boolean       // threshold 초과 여부
  }>
}
```

---

### 4.6 `portfolio-topup-plan`

추가 입금 금액을 목표 비중에 맞게 배분하는 추천안 생성.

**Method:** `POST`

**요청:**
```ts
{
  portfolio_id: string
  topup_amount: number
  base_currency: "KRW" | "USD"
}
```

**응답:**
```ts
{
  plan: Array<{
    asset_id: string
    ticker: string
    name: string
    quantity_to_buy: number
    amount: number
    currency: "USD" | "KRW"
  }>
  total_used: number
  remaining: number
}
```

---

### 4.7 `portfolio-execute-topup`

추가 입금 추천안을 실행하여 보유 수량/평균가를 업데이트.

**Method:** `POST`

**요청:**
```ts
{
  portfolio_id: string
  topup_amount: number
  base_currency: "KRW" | "USD"
  addRemainingCashToBaseline?: boolean  // 잔여 현금도 seed_money에 합산 여부
}
```

**응답:**
```ts
{ success: true }
```

---

### 4.8 `recalc-portfolio-returns`

모든 활성 포트폴리오의 수익률을 재계산하여 `portfolio_value_history`에 저장.

**Method:** `POST` (pg_cron에서 호출, 수동 트리거도 가능)

**로직:**
1. `status = ACTIVE`인 모든 포트폴리오 조회
2. 각 포트폴리오의 보유 종목별 현재가 조회
3. 가중 지수값 계산: `Σ(weight × current_price / first_price) / Σ(weight) × 100`
4. `portfolio_value_history` UPSERT (`ON CONFLICT (portfolio_id, date)`)
5. `portfolios.total_return_pct` 갱신

**응답:**
```ts
{ updated: number }  // 업데이트된 포트폴리오 수
```

---

### 4.9 `refresh-prices`

Yahoo Finance v8 API에서 전체 종목 가격 데이터를 수집.

**Method:** `POST` (pg_cron에서 자동 호출)

**로직:**
1. 모든 `assets` 조회
2. US: `ticker` 그대로, KR: `ticker.KS` / `ticker.KQ` 형식
3. `1M`, `3M`, `1Y` 범위별 청크 단위 수집 (청크 크기: 3, 딜레이: 800ms)
4. `asset_prices` UPSERT

**응답:**
```ts
{ fetched: number, errors: number }
```

---

### 4.10 `refresh-fx`

open.er-api.com에서 USD/KRW 환율을 조회하여 저장.

**Method:** `POST` (pg_cron에서 자동 호출)

**응답:**
```ts
{ rate: number }  // 갱신된 USD/KRW 환율
```

---

## 5. 자동화 스케줄 (pg_cron)

| 실행 시각 (KST) | Edge Function | 설명 |
|----------------|--------------|------|
| 09:00 | `refresh-fx` | USD/KRW 환율 갱신 |
| 10:00 / 00:00 | `refresh-prices` | 전체 종목 주가 수집 |
| 10:05 / 00:05 | `recalc-portfolio-returns` | 포트폴리오 수익률 재계산 |

> 인증: Supabase Vault에 저장된 서비스 키 사용 (pg_net으로 HTTP 호출)

---

## 6. 클라이언트 API 함수

> 위치: `lib/api/`  
> 모든 함수는 Supabase SDK 또는 Axios(Edge Function 호출)를 사용.

### 6.1 인증 (`auth.ts`)

| 함수 | 설명 |
|------|------|
| `signInAnonymously()` | 익명 로그인 |
| `signup(email, password, nickname)` | 이메일 회원가입 / 익명→정규 업그레이드 |
| `login(email, password)` | 이메일 로그인 |
| `appleLogin(identityToken, authorizationCode)` | Apple 로그인 |
| `signOut()` | 로그아웃 |
| `checkEmail(email)` | 이메일 중복 확인 (현재 no-op) |

### 6.2 사용자 (`user.ts`)

| 함수 | 설명 |
|------|------|
| `getProfile()` | 내 프로필 조회 |
| `updateProfile(nickname)` | 닉네임 수정 |
| `deleteAccount()` | 계정 삭제 |

### 6.3 홈 (`home.ts`)

| 함수 | 설명 |
|------|------|
| `getHome()` | 메인 포트폴리오 + 보유 종목 + 차트 조회 |

### 6.4 종목 (`asset.ts`)

| 함수 | 파라미터 | 설명 |
|------|---------|------|
| `getAssetLibrary(filters, page, pageSize)` | market, type, sectors, riskLevels, query, sortBy, sortDirection | 종목 목록 (필터/정렬/페이지네이션) |
| `getAsset(assetId)` | - | 종목 상세 |
| `getAssetChart(assetId, range)` | `1M` / `3M` / `1Y` | 종목 차트 데이터 |

### 6.5 포트폴리오 (`portfolio.ts`)

| 함수 | 설명 |
|------|------|
| `getPortfolios()` | 내 포트폴리오 목록 |
| `getPortfolio(portfolioId)` | 포트폴리오 상세 (positions, topAssets, riskDistribution, diversityLevel) |
| `directCreatePortfolio(name, assets)` | 자산 리스트로 포트폴리오 직접 생성 |
| `updatePortfolioWeights(portfolioId, weights)` | 자산 비중 수정 |
| `deletePortfolio(portfolioId)` | 포트폴리오 삭제 |
| `setMainPortfolio(portfolioId)` | 메인 포트폴리오 설정 |
| `getSeedPreview(portfolioId, seedMoney, currency)` | 시드머니 미리보기 (DB write 없음) |
| `setSeed(portfolioId, seedMoney, currency)` | 시드머니 확정 및 수량 저장 |
| `getHoldingBaseline(portfolioId)` | 보유 자산 현황 (수량·평균가·손익) |
| `getRebalanceStatus(portfolioId)` | 리벨런싱 필요 여부 |
| `getRebalancingPlan(portfolioId)` | 리벨런싱 액션 플랜 |
| `getTopUpPlan(portfolioId, amount, currency)` | 추가 입금 추천안 |
| `executeTopUp(portfolioId, amount, currency, options)` | 추가 입금 실행 |
| `getPortfolioChart(portfolioId, range)` | 포트폴리오 차트 |
| `getPortfolioReturns(portfolioId)` | 기간별 수익률 (1D/1W/1M/1Y) |
| `triggerRecalc(portfolioId)` | 수익률 재계산 수동 트리거 |

### 6.6 아레나 (`arena.ts`)

| 함수 | 설명 |
|------|------|
| `recommendArenaCards(riskProfile, sectors, excludeIds)` | 라운드별 카드 3장 추천 (RPC) |
| `finalizeArenaPortfolio(sessionId, name)` | 아레나 완료 → 포트폴리오 생성 (RPC) |

---

## 7. React Query 훅

### 쿼리 훅 (`lib/hooks/query/`)

| 훅 | 파일 | staleTime | 설명 |
|----|------|-----------|------|
| `useSession()` | `use-session.tsx` | 기본 | 현재 세션 + auth 상태 동기화 |
| `useGetHomeQuery()` | `home.tsx` | 기본 | 홈 데이터 (비익명 사용자만) |
| `useGetAssetQuery(assetId)` | `asset.tsx` | 기본 | 종목 상세 |
| `useGetAssetChartQuery(assetId, range)` | `asset.tsx` | 기본 | 종목 차트 |
| `useGetAssetLibraryInfiniteQuery(filters)` | `use-get-asset-library-infinite-query.tsx` | 기본 | 종목 목록 무한스크롤 (pageSize: 20) |
| `useGetPortfoliosQuery()` | `portfolio.tsx` | 기본 | 포트폴리오 목록 |
| `useGetPortfolioQuery(portfolioId)` | `portfolio.tsx` | 기본 | 포트폴리오 상세 |
| `useGetHoldingBaselineQuery(portfolioId)` | `portfolio.tsx` | 기본 | 보유 자산 현황 |
| `useGetRebalanceStatusQuery(portfolioId)` | `portfolio.tsx` | 기본 | 리벨런싱 상태 |
| `useGetPortfolioChartQuery(portfolioId, range)` | `portfolio.tsx` | 5분 | 포트폴리오 차트 |
| `useGetPortfolioReturnsQuery(portfolioId)` | `portfolio.tsx` | 5분 | 기간별 수익률 |
| `useRecommendArenaCardsQuery(...)` | `arena.tsx` | Infinity | 아레나 카드 추천 (gcTime: 60s) |

### 뮤테이션 훅 (`lib/hooks/mutation/`)

| 훅 | 파일 | 설명 |
|----|------|------|
| `useLoginMutation()` | `auth.tsx` | 이메일 로그인 |
| `useSignupMutation()` | `auth.tsx` | 회원가입 |
| `useAnonymousSignIn()` | `use-anonymous-sign-in.tsx` | 익명 로그인 |
| `useGoogleAuth()` | `google-auth.tsx` | Google OAuth |
| `useAppleAuth()` | `apple-auth.tsx` | Apple OAuth (iOS) |
| `useDeleteAccountMutation()` | `user.tsx` | 계정 삭제 |
| `useUpdateProfileMutation()` | `user.tsx` | 프로필 수정 |
| `useDirectCreatePortfolioMutation()` | `portfolio.tsx` | 포트폴리오 생성 |
| `useUpdatePortfolioWeightsMutation()` | `portfolio.tsx` | 비중 수정 |
| `useDeletePortfolioMutation()` | `portfolio.tsx` | 포트폴리오 삭제 |
| `useSetSeedMutation()` | `portfolio.tsx` | 시드머니 확정 |
| `useSeedPreviewMutation()` | `portfolio.tsx` | 시드머니 미리보기 |
| `useGetRebalancingPlanMutation()` | `portfolio.tsx` | 리벨런싱 플랜 |
| `useGetTopUpPlanMutation()` | `portfolio.tsx` | 추가 입금 추천안 |
| `useExecuteTopUpMutation()` | `portfolio.tsx` | 추가 입금 실행 |
| `useSetMainPortfolioMutation()` | `portfolio.tsx` | 메인 포트폴리오 설정 (optimistic update) |
| `useFinalizeArenaPortfolioMutation()` | `arena.tsx` | 아레나 포트폴리오 확정 |

---

## 8. 전체 데이터 흐름

### 8.1 아레나 포트폴리오 생성

```
사용자: 리스크 프로필 + 섹터 선택
  │
  └── useRecommendArenaCardsQuery()
        → recommend_arena_cards() RPC
        → 3장 카드 반환 (라운드당)
            │
            └── [10라운드 반복]
                  │
                  └── useFinalizeArenaPortfolioMutation()
                        → finalize_arena_portfolio() RPC
                        → portfolios + portfolio_holdings 생성
                        → is_main 자동 지정
```

### 8.2 커스텀 포트폴리오 생성

```
사용자: 종목 선택 (최대 20개) + 포트폴리오 이름
  │
  └── useDirectCreatePortfolioMutation()
        → portfolios + portfolio_holdings 생성 (status: DRAFT)
            │
            └── useSeedPreviewMutation()
                  → portfolio-seed-preview Edge Function
                  → 수량 미리보기 (DB write 없음)
                      │
                      └── useSetSeedMutation()
                            → portfolio-set-seed Edge Function
                            → 시드머니 확정 + 수량 저장 (status: ACTIVE)
```

### 8.3 자동 가격 갱신 사이클

```
KST 09:00  → refresh-fx
              └── open.er-api.com에서 USD/KRW 환율 조회
                    → fx_rates UPSERT

KST 10:00  → refresh-prices
              └── Yahoo Finance v8에서 전체 종목 가격 수집
                    → asset_prices UPSERT (1M/3M/1Y)

KST 10:05  → recalc-portfolio-returns
              └── 활성 포트폴리오별 가중 지수 계산
                    → portfolio_value_history UPSERT
                    → portfolios.total_return_pct 갱신
```

### 8.4 추가 입금 플로우

```
사용자: 입금 금액 입력
  │
  └── useGetTopUpPlanMutation()
        → portfolio-topup-plan Edge Function
        → 목표 비중 기준 매수 추천안 생성
            │
            └── useExecuteTopUpMutation()
                  → portfolio-execute-topup Edge Function
                  → holdings.quantity + avg_price 업데이트
                  → (선택) seed_money 증가
```

### 8.5 리벨런싱 플로우

```
useGetRebalanceStatusQuery()
  → portfolio-rebalance-status Edge Function
  → 현재 비중 vs 목표 비중 비교 (임계값 기본 5%)
      │
      ├── needs_rebalance: false → 현황 표시만
      │
      └── needs_rebalance: true
            └── useGetRebalancingPlanMutation()
                  → 매도/매수 액션 플랜 생성
```

---

## 참고: 환경 변수

| 변수 | 용도 |
|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon 키 (클라이언트) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 키 (Edge Function 내부) |
| `EXPO_PUBLIC_API_BASE_URL` | Axios baseURL (Edge Function URL) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth Web Client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS Client ID |
