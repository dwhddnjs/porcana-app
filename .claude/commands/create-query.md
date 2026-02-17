# Create Query Hook

주어진 인수를 바탕으로 `lib/hooks/query/` 에 React Query 쿼리 훅을 생성합니다.

**사용법**: `/create-query <리소스명> [설명]`

예시:
- `/create-query portfolios` → `useGetPortfoliosQuery` 훅 생성
- `/create-query asset-chart 에셋 차트 데이터 조회` → `useGetAssetChartQuery` 훅 생성

## 규칙

1. 훅 이름: **`useGet[Resource]Query`** (예: `useGetPortfoliosQuery`)
2. 파일명: `use-get-[resource].tsx` (kebab-case)
3. `queryKey`는 배열로, 리소스명 + 파라미터 포함 (예: `['portfolios', id]`)
4. `staleTime`, `gcTime`은 `lib/react-query.ts` 기본값 따름 (별도 설정 필요 시만 지정)
5. 파라미터가 있으면 훅 인수로 받을 것
6. 타입/인터페이스에는 `Types` 접미사
7. API 함수는 `lib/api/` 에서 임포트

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

생성 전에 기존 `lib/hooks/query/` 파일들을 읽어 패턴을 파악하세요.
