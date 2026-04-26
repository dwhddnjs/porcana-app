---
name: create-query
description: lib/hooks/query/에 React Query 쿼리 훅을 생성합니다. 쿼리 훅 만들기, 데이터 조회 훅, useQuery 생성 시 사용.
argument-hint: "<리소스명> [설명]"
allowed-tools: Read, Write, Glob, Grep
---

# Create Query Hook

주어진 인수를 바탕으로 `lib/hooks/query/` 에 React Query 쿼리 훅을 생성합니다.

인수: $ARGUMENTS

예시:
- `/create-query portfolios` → `useGetPortfoliosQuery` 훅 생성
- `/create-query asset-chart 에셋 차트 데이터 조회` → `useGetAssetChartQuery` 훅 생성

> 네이밍, 타입 등 일반 규칙은 CLAUDE.md를 따릅니다.

## 절차

1. 기존 `lib/hooks/query/` 파일들을 읽어 패턴 파악
2. 대응하는 API 함수(`lib/api/`)의 타입 확인
3. 쿼리 훅 생성

## 쿼리 훅 전용 규칙

- `queryKey`는 배열로, 리소스명 + 파라미터 포함 (예: `['portfolios', id]`)
- `staleTime`, `gcTime`은 `lib/react-query.ts` 기본값(staleTime 5분, gcTime 10분, retry 2)을 따름 — 별도 설정 필요 시만 지정
- 파라미터가 있으면 훅 인수로 받을 것 (`enabled: !!param`로 가드)
- 네트워크 감지(expo-network) 및 앱 포커스 시 자동 refetch는 전역 설정됨 — 개별 훅에서 신경 쓸 필요 없음

## 출력 예시

```tsx
// lib/hooks/query/use-get-portfolios.tsx
import { useQuery } from '@tanstack/react-query';
import { getPortfolios } from '@/lib/api/portfolio';
import type { GetPortfoliosResponseTypes } from '@/lib/api/portfolio';

export const useGetPortfoliosQuery = () => {
  return useQuery<GetPortfoliosResponseTypes>({
    queryKey: ['portfolios'],
    queryFn: getPortfolios,
  });
};
```

파라미터가 있는 경우:

```tsx
// lib/hooks/query/use-get-portfolio.tsx
import { useQuery } from '@tanstack/react-query';
import { getPortfolio } from '@/lib/api/portfolio';
import type { GetPortfolioResponseTypes } from '@/lib/api/portfolio';

type UseGetPortfolioQueryTypes = {
  id: string;
};

export const useGetPortfolioQuery = ({ id }: UseGetPortfolioQueryTypes) => {
  return useQuery<GetPortfolioResponseTypes>({
    queryKey: ['portfolios', id],
    queryFn: () => getPortfolio(id),
    enabled: !!id,
  });
};
```
