# Porcana App

포트폴리오 기반 투자 시뮬레이션 모바일 앱 (React Native + Expo)

## Tech Stack

- **Framework**: React Native + Expo SDK 54 (New Architecture 활성화)
- **Routing**: Expo Router v6 (파일 기반 라우팅)
- **Language**: TypeScript (strict mode)
- **State**: Zustand (클라이언트) + TanStack React Query (서버)
- **Styling**: Tailwind CSS v4 + NativeWind + Uniwind + CVA
- **Form**: React Hook Form + Zod
- **HTTP**: Axios (인터셉터로 토큰 자동 주입/갱신)
- **UI**: React Native Reusables (shadcn/ui 스타일) + Lucide Icons
- **Auth**: Email/Password, Google OAuth, Apple Sign In
- **Charts**: react-native-gifted-charts, react-native-wagmi-charts
- **Storage**: AsyncStorage (Zustand persist)

## Project Structure

```
app/                          # Expo Router 파일 기반 라우팅
├── (tabs)/                   # 탭 네비게이션 (Portfolio, Add, MyPage)
│   ├── (portfolio)/(main)/   # 포트폴리오 홈, 상세([id]), 에셋 상세(asset/[assetId])
│   └── (mypage)/             # 마이페이지
├── (auth)/                   # 인증 플로우 (login, signup, enter-email/password/nickname)
├── (arena)/                  # 아레나 게임 세션 (start-arena, complete)
├── (common)/                 # 공통 라우트 (landing)
├── add-modal.tsx             # 포트폴리오 생성 모달
└── login-sheet.tsx           # 로그인 폼 시트
components/
├── ui/                       # 공통 UI 컴포넌트 (Button, Text, Input, Card, Dialog 등)
└── portfolio/                # 포트폴리오 전용 컴포넌트
lib/
├── api/                      # Axios 클라이언트 및 API 엔드포인트 (auth, portfolio, arena, asset, home)
├── hooks/
│   ├── mutation/             # React Query mutation 훅
│   ├── query/                # React Query query 훅
│   └── zustand/              # Zustand 상태 저장소
├── validations/              # Zod 스키마 (인증 폼 검증)
├── constant/                 # 상수 및 유틸 함수
├── utils.ts                  # cn() 클래스 머지 유틸리티
├── theme.ts                  # 라이트/다크 테마 정의
├── storage.ts                # AsyncStorage 어댑터
└── react-query.ts            # QueryClient 설정
```

## Commands

```bash
npm run dev          # Expo 개발 서버 시작 (캐시 클리어)
npm run ios          # iOS 시뮬레이터 실행
npm run android      # Android 에뮬레이터 실행
npm run web          # 웹 브라우저 실행
npm run clean        # .expo, node_modules 삭제
```

## Architecture Patterns

### API Layer
- Base URL: `EXPO_PUBLIC_API_BASE_URL/api/v1/` (프로덕션: `https://api.porcana.co.kr`)
- Request 인터셉터: `Authorization: Bearer {token}` 자동 주입, 게스트는 `X-Guest-Session-Id` 헤더 사용
- Response 인터셉터: 401 시 자동 토큰 리프레시 + 요청 큐잉 후 재시도

### State Management
- `useUserStore`: 사용자 정보 + 토큰 (AsyncStorage 영속화)
- `useSignupStore`: 회원가입 플로우 임시 상태
- `useArenaStore`: 아레나 세션 상태
- `useLoadingStore`: 글로벌 로딩 오버레이

### React Query Config
- staleTime: 5분, gcTime: 10분, retry: 2 (query) / 1 (mutation)
- expo-network 기반 네트워크 상태 감지
- 앱 포커스 시 자동 refetch

### Component Styling
- CVA(Class Variance Authority)로 variant 기반 컴포넌트 스타일링
- `cn()` 유틸리티: clsx + tailwind-merge 조합
- 다크/라이트 모드 지원 (Uniwind ThemeProvider)

### Auth Flow
- Email 인증: enter-email → enter-password → enter-nickname → signup → auto-login
- OAuth: Google (expo-auth-session), Apple (expo-apple-authentication)
- 토큰 관리: Zustand persist → AsyncStorage, 자동 리프레시 인터셉터

## Import Alias

`@/*` → 프로젝트 루트 (`tsconfig.json` paths 설정)

## Code Conventions

- Prettier: printWidth 100, singleQuote, tabWidth 2, trailingComma es5
- Tailwind 클래스 정렬: prettier-plugin-tailwindcss
- 컴포넌트: 함수형 + 화살표 함수 패턴
- 한글 UI 텍스트 사용 (한국 시장 타겟)

## Environment Variables

```
EXPO_PUBLIC_API_BASE_URL             # API 서버 URL
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     # Google OAuth Web 클라이언트 ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     # Google OAuth iOS 클라이언트 ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID # Google OAuth Android 클라이언트 ID
```

## Key API Endpoints

| Module    | Method | Path                                              | Description        |
|-----------|--------|---------------------------------------------------|--------------------|
| Auth      | POST   | /auth/signup                                      | 이메일 회원가입    |
| Auth      | POST   | /auth/login                                       | 로그인 (EMAIL/GOOGLE/APPLE) |
| Auth      | POST   | /auth/refresh                                     | 토큰 갱신          |
| Portfolio | POST   | /portfolios                                       | 포트폴리오 생성    |
| Portfolio | GET    | /portfolios                                       | 포트폴리오 목록    |
| Portfolio | GET    | /portfolios/:id                                   | 포트폴리오 상세    |
| Arena     | POST   | /arena/sessions                                   | 아레나 세션 생성   |
| Arena     | POST   | /arena/sessions/:id/rounds/current/pick-preferences | 선호도 설정      |
| Arena     | POST   | /arena/sessions/:id/rounds/current/pick-asset     | 에셋 선택          |
| Asset     | GET    | /assets/:id                                       | 에셋 상세          |
| Asset     | GET    | /assets/:id/chart?range=1M\|3M\|1Y               | 에셋 차트 데이터   |
| Home      | GET    | /home                                             | 홈 대시보드        |
