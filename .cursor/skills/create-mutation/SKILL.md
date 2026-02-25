---
name: create-mutation
description: React Query useMutation 커스텀 훅을 생성. Use when the user asks to create a mutation hook for POST, PUT, PATCH, or DELETE API calls.
---

# Create Mutation Hook

주어진 인수를 바탕으로 `lib/hooks/mutation/`에 React Query 뮤테이션 훅을 생성합니다.

**사용법**: `<액션명> [설명]`

예시:
- `create-portfolio` → `useCreatePortfolioMutation` 훅 생성
- `delete-asset 에셋 삭제` → `useDeleteAssetMutation` 훅 생성

> 네이밍, 타입 등 일반 규칙은 `.cursorrules`를 따릅니다.

## 뮤테이션 훅 전용 규칙

- 훅 이름: **`use[Action]Mutation`** (예: `useCreatePortfolioMutation`)
- 파일명: `use-[action].tsx`
- 성공 시 관련 쿼리 `invalidateQueries` 수행
- 글로벌 로딩은 `useLoadingStore` 사용 (`show('메시지')` / `hide()`)
- 에러 처리는 `onError` 콜백에서 처리
- API 함수는 `lib/api/`에서 임포트

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

## 절차

1. 기존 `lib/hooks/mutation/` 파일들을 읽어 패턴 파악
2. `useLoadingStore` 임포트 경로는 기존 코드 확인 후 맞추기
3. 대응하는 API 함수가 `lib/api/`에 있는지 확인, 없으면 먼저 생성
4. 훅 파일 생성
