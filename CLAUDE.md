# Porcana App

포트폴리오 기반 투자 시뮬레이션 모바일 앱 (React Native + Expo, 한국 시장 타겟)

## Tech Stack

- React Native + Expo SDK 54 (New Architecture), Expo Router v6, TypeScript strict
- 상태: Zustand (AsyncStorage persist) + TanStack React Query
- 스타일: Tailwind v4 + NativeWind + Uniwind + CVA, React Native Reusables, Lucide
- 폼: React Hook Form + Zod / 날짜: date-fns / HTTP: Axios

## Code Conventions

- 파일/폴더: kebab-case. 컴포넌트 `.tsx`, 훅 `use-[name].tsx`, API `[resource].ts`
- 컴포넌트: `export` 함수 표현식 / app 스크린: `export default` 함수 선언식
- 내부 함수(핸들러/유틸): 화살표 함수
- **이벤트 핸들러는 별도 선언 후 참조 전달** (인라인 금지: `onPress={() => {...}}` ✗ → `onPress={handleDelete}` ✓)
- 타입/인터페이스: `Types` 접미사 필수 (예: `PortfolioTypes`, `HomeResponseTypes`)
- 데이터 확인 후 request/response 타입 항상 정의
- 한글 UI 텍스트
- Prettier: printWidth 100, singleQuote, tabWidth 2, trailingComma es5, prettier-plugin-tailwindcss

## Import Alias

`@/*` → 프로젝트 루트 (`tsconfig.json` paths)

## 작업별 Skill

- API 추가: `/create-api` · 엔드포인트 조회: `/api-spec`
- 쿼리 훅: `/create-query` · 뮤테이션 훅: `/create-mutation`
- 컴포넌트: `/create-component` · 스크린: `/create-screen`
- 커밋: `/commit`

## Commands

```bash
npm run dev      # Expo 개발 서버
npm run ios      # iOS 시뮬레이터
npm run android  # Android 에뮬레이터
```
