# CLAUDE.md - Porcana App

이 파일은 Claude Code (claude.ai/claude-code)가 이 저장소의 코드를 다룰 때 참고하는 가이드입니다.

## 프로젝트 개요

Porcana는 포트폴리오 및 투자 관리를 위한 React Native/Expo 핀테크 앱입니다. 게이미피케이션 요소인 "투자 아레나" 기능을 포함하며, iOS, Android, Web 플랫폼을 지원합니다.

## 기술 스택

- **프레임워크:** React Native 0.81.5, React 19.1.0, Expo 54.0.29
- **라우팅:** Expo Router 6.0.19 (파일 기반 라우팅)
- **상태 관리:** Zustand 5.0.10 + React Query 5.90.19
- **스타일링:** Tailwind CSS + UniWind 1.2.2 + CVA (class-variance-authority)
- **폼:** React Hook Form 7.71.1 + Zod 4.3.5
- **HTTP 클라이언트:** Axios 1.13.2
- **언어:** TypeScript 5.9.2

## 주요 명령어

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npx expo start

# iOS 시뮬레이터 실행
npx expo run:ios

# Android 에뮬레이터 실행
npx expo run:android

# 웹 실행
npx expo start --web

# TypeScript 타입 체크
npx tsc --noEmit

# 코드 포맷팅
npx prettier --write .
```

## 프로젝트 구조

```
app/                    # Expo Router 파일 기반 라우팅
├── (auth)/            # 인증 플로우 (로그인, 회원가입, 온보딩)
├── (tabs)/            # 메인 앱 (하단 탭 네비게이션)
│   ├── (portfolio)/   # 포트폴리오 화면
│   └── (mypage)/      # 마이페이지/설정
├── (arena)/           # 투자 아레나 게임 화면
└── (common)/          # 랜딩 및 공통 화면

components/
├── ui/                # 기본 UI 컴포넌트 (Button, Input, Card 등)
└── portfolio/         # 포트폴리오 관련 컴포넌트

lib/
├── api/               # API 레이어 (Axios 클라이언트, 엔드포인트)
├── hooks/
│   ├── mutation/      # React Query 뮤테이션
│   ├── query/         # React Query 쿼리
│   └── zustand/       # Zustand 스토어
├── validations/       # Zod 스키마
├── constant/          # 상수 및 설정
├── theme.ts           # 테마 색상
└── utils.ts           # 유틸리티 함수
```

## 아키텍처 패턴

### 상태 관리

- **Zustand 스토어** (`lib/hooks/zustand/`):
  - `useUserStore` - 유저 인증 상태 (토큰, 유저 데이터), AsyncStorage에 영속화
  - `useSignupStore` - 다단계 회원가입 플로우 상태
  - `useArenaStore` - 투자 아레나 게임 상태
  - `useLoadingStore` - 전역 로딩 오버레이 상태

### 전역 로딩 오버레이

- **컴포넌트:** `components/ui/loading-overlay.tsx`
- **사용법:**
  ```typescript
  const { show, hide } = useLoadingStore();
  show('로딩 중...');  // 메시지와 함께 로딩 표시
  hide();              // 로딩 숨기기
  ```
- **적용된 mutation:** 로그인, 회원가입, 포트폴리오 생성, 아레나 설정 등

- **React Query** (`lib/hooks/query/`, `lib/hooks/mutation/`):
  - 모든 서버 상태는 React Query로 관리
  - staleTime 5분, gcTime 10분
  - 앱 포커스 및 네트워크 재연결 시 자동 리페치

### API 레이어

- Base URL: `https://api.porcana.co.kr/api/v1/`
- Swagger 문서: `https://api.porcana.co.kr/swagger-ui/index.html`
- Axios 인터셉터 처리 사항:
  - Bearer 토큰 자동 주입
  - 401 응답 시 토큰 리프레시 및 요청 큐잉
  - `X-Guest-Session-Id` 헤더를 통한 게스트 세션 지원

#### Portfolio API (`lib/api/portfolio.ts`)

| 함수 | 메서드 | 엔드포인트 | 설명 |
|------|--------|------------|------|
| `createPortfolio` | POST | `/portfolios` | 포트폴리오 생성 |
| `getPortfolios` | GET | `/portfolios` | 포트폴리오 목록 조회 |
| `setMainPortfolio` | PUT | `/portfolios/{portfolioId}/main` | 메인 포트폴리오 설정 |

#### Portfolio Queries (`lib/hooks/query/portfolio.tsx`)

| 훅 | 설명 |
|----|------|
| `useGetPortfoliosQuery` | 포트폴리오 목록 조회 |

#### Portfolio Mutations (`lib/hooks/mutation/portfolio.tsx`)

| 훅 | 설명 |
|----|------|
| `useCreatePortfolioMutation` | 포트폴리오 생성 (게스트 세션 자동 처리) |
| `useSetMainPortfolioMutation` | 메인 포트폴리오 설정 |

### 스타일링

- Tailwind CSS + UniWind로 크로스 플랫폼 스타일링
- CVA로 컴포넌트 variant 관리 (버튼, 인풋 등)
- 테마 색상은 `lib/theme.ts`와 `global.css`에 정의
- 클래스 병합 시 `lib/utils.ts`의 `cn()` 유틸리티 사용

### 유효성 검사

- Zod 스키마: `lib/validations/auth.ts`
- `@hookform/resolvers`를 통해 React Hook Form과 통합

## 주요 파일

| 파일 | 용도 |
|------|------|
| `app/_layout.tsx` | 루트 레이아웃 (프로바이더 설정) |
| `lib/api/client.ts` | Axios 인스턴스 설정 |
| `lib/api/index.ts` | API 인터셉터 및 토큰 관리 |
| `lib/hooks/zustand/use-user-store.tsx` | 유저 인증 상태 |
| `lib/react-query.ts` | React Query 설정 |
| `lib/theme.ts` | 테마 색상 정의 |
| `global.css` | Tailwind CSS 설정 |

## 코드 컨벤션

### Import

루트에서 import 시 `@/` 경로 별칭 사용:
```typescript
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/lib/hooks/zustand/use-user-store'
```

### 컴포넌트 구조

컴포넌트는 Tailwind 클래스와 CVA를 사용한 variant 패턴 적용:
```typescript
const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', destructive: '...' },
    size: { default: '...', sm: '...', lg: '...' },
  },
})
```

### API 훅 네이밍

- 쿼리 훅: `useGet[Resource]Query()`
- 뮤테이션 훅: `use[Action]Mutation()`

### 파일 네이밍

- 컴포넌트: `kebab-case.tsx`
- 훅: `use-[name].tsx`
- API 파일: `[resource].ts`

## 인증

- 이메일/비밀번호 다단계 회원가입 플로우
- Apple 로그인 (iOS) - `expo-apple-authentication` 사용
- Google OAuth - `expo-auth-session` 사용
- 토큰은 Zustand에 저장, AsyncStorage로 영속화
- 401 응답 시 자동 토큰 리프레시

## 참고 사항

- New Architecture 활성화 (`newArchEnabled: true`)
- 앱 전체 한국어 지원
- 다크 모드 지원 (테마 시스템)
- 모든 화면에서 Safe Area 처리 필요
