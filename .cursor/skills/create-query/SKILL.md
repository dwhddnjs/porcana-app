---
name: create-query
description: React Query useQuery 커스텀 훅을 생성. Use when the user asks to create a query hook for GET API calls or data fetching.
---

# Create Query Hook

주어진 인수를 바탕으로 `lib/hooks/query/`에 React Query 쿼리 훅을 생성합니다.

**사용법**: `<리소스명> [설명]`

예시:
- `portfolios` → `useGetPortfoliosQuery` 훅 생성
- `asset-chart 에셋 차트 데이터 조회` → `useGetAssetChartQuery` 훅 생성

> 네이밍, 타입 등 일반 규칙은 `.cursorrules`를 따릅니다.

## 쿼리 훅 전용 규칙

- 훅 이름: **`useGet[Resource]Query`** (예: `useGetPortfoliosQuery`)
- 파일명: `use-get-[resource].tsx`
- `queryKey`는 배열로, 리소스명 + 파라미터 포함 (예: `['portfolios', id]`)
- `staleTime`, `gcTime`은 `lib/react-query.ts` 기본값 따름 (별도 설정 필요 시만 지정)
- 파라미터가 있으면 훅 인수로 받을 것
- API 함수는 `lib/api/`에서 임포트

## 출력 예시

파라미터 없는 경우:

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

파라미터 있는 경우:

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

## 절차

1. 기존 `lib/hooks/query/` 파일들을 읽어 패턴 파악
2. 대응하는 API 함수가 `lib/api/`에 있는지 확인, 없으면 먼저 생성
3. 훅 파일 생성
