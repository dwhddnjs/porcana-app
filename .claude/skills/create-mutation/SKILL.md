---
name: create-mutation
description: lib/hooks/mutation/에 React Query 뮤테이션 훅을 생성합니다. 뮤테이션 훅 만들기, useMutation 생성, 데이터 변경 훅 시 사용.
argument-hint: "<액션명> [설명]"
allowed-tools: Read, Write, Glob, Grep
---

# Create Mutation Hook

주어진 인수를 바탕으로 `lib/hooks/mutation/` 에 React Query 뮤테이션 훅을 생성합니다.

인수: $ARGUMENTS

예시:
- `/create-mutation create-portfolio` → `useCreatePortfolioMutation` 훅 생성
- `/create-mutation delete-asset 에셋 삭제` → `useDeleteAssetMutation` 훅 생성

> 네이밍, 타입 등 일반 규칙은 CLAUDE.md를 따릅니다.

## 절차

1. 기존 `lib/hooks/mutation/` 파일들을 읽어 패턴 파악
2. 대응하는 API 함수(`lib/api/`)의 타입 확인 — 없으면 `/create-api` 먼저
3. `useLoadingStore`의 임포트 경로는 기존 코드를 확인 후 맞춤
4. 뮤테이션 훅 생성

> 백엔드는 Supabase + Expo Router API Routes로 이전됨. 응답 컨트랙트는 동일하므로 훅 코드 변경 없음.

## 뮤테이션 훅 전용 규칙

- 성공 시 관련 쿼리 `invalidateQueries` 수행
- 글로벌 로딩은 `useLoadingStore` 사용 (`show('메시지')` / `hide()`)
- 에러 처리는 `onError` 콜백에서 처리

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
