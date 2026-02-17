# Create Mutation Hook

주어진 인수를 바탕으로 `lib/hooks/mutation/` 에 React Query 뮤테이션 훅을 생성합니다.

**사용법**: `/create-mutation <액션명> [설명]`

예시:
- `/create-mutation create-portfolio` → `useCreatePortfolioMutation` 훅 생성
- `/create-mutation delete-asset 에셋 삭제` → `useDeleteAssetMutation` 훅 생성

## 규칙

1. 훅 이름: **`use[Action]Mutation`** (예: `useCreatePortfolioMutation`, `useDeletePortfolioMutation`)
2. 파일명: `use-[action].tsx` (kebab-case)
3. 성공 시 관련 쿼리 `invalidateQueries` 수행
4. 글로벌 로딩은 `useLoadingStore` 사용 (`show('메시지')` / `hide()`) — mutation 시 권장
5. 에러 처리는 `onError` 콜백에서 처리
6. 타입/인터페이스에는 `Types` 접미사
7. API 함수는 `lib/api/` 에서 임포트

## 출력 예시

```tsx
// lib/hooks/mutation/use-create-portfolio.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortfolio } from '@/lib/api/portfolio';
import type { CreatePortfolioRequestTypes } from '@/lib/api/portfolio';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';

export const useCreatePortfolioMutation = () => {
  const queryClient = useQueryClient();
  const { show, hide } = useLoadingStore();

  return useMutation({
    mutationFn: (body: CreatePortfolioRequestTypes) => createPortfolio(body),
    onMutate: () => {
      show('포트폴리오 생성 중...');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
    onError: (error) => {
      console.error(error);
    },
    onSettled: () => {
      hide();
    },
  });
};
```

생성 전에 기존 `lib/hooks/mutation/` 파일들을 읽어 패턴을 파악하세요.
`useLoadingStore`의 임포트 경로는 기존 코드를 확인 후 맞추세요.
