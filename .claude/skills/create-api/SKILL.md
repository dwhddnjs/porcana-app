---
name: create-api
description: lib/api/에 Supabase SDK 호출 함수를 생성하거나 기존 파일에 추가합니다. API 함수 만들기, 엔드포인트 추가 시 사용.
argument-hint: "<리소스명> [설명]"
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Create API

주어진 인수를 바탕으로 `lib/api/` 에 Supabase SDK 호출 함수를 생성하거나 기존 파일에 추가합니다.

인수: $ARGUMENTS

예시:
- `/create-api notification` → `lib/api/notification.ts` 생성
- `/create-api portfolio 포트폴리오 좋아요 추가` → `lib/api/portfolio.ts` 에 함수 추가

> 네이밍, 타입 등 일반 규칙은 CLAUDE.md를 따릅니다.

## API Layer 규칙

- 백엔드: **Supabase SDK 직접 호출** (`@/lib/supabase/client` — anon key + RLS)
- 외부 API (주가 등)는 `supabase.functions.invoke('<edge-function-name>')` 사용
- `import { supabase } from '@/lib/supabase/client'` — Axios 클라이언트 사용 금지
- 인증: Supabase Auth가 자동 처리 (토큰 수동 첨부 불필요)
- request/response 타입은 `Types` 접미사 필수

## 절차

1. 인수 파싱 → 리소스명·용도 파악
2. 기존 `lib/api/<resource>.ts`가 있으면 읽고 패턴 맞춤. 없으면 신규 생성.
3. Supabase 테이블/Edge Function 이름을 사용자에게 확인 후 작성

## 출력 예시

### Supabase 직접 쿼리
```ts
// lib/api/notification.ts
import { supabase } from '@/lib/supabase/client';

export type NotificationTypes = {
  id: string;
  message: string;
  created_at: string;
};

export type CreateNotificationRequestTypes = {
  message: string;
};

export const getNotifications = async (): Promise<NotificationTypes[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createNotification = async (body: CreateNotificationRequestTypes): Promise<void> => {
  const { error } = await supabase.from('notifications').insert(body);
  if (error) throw error;
};
```

### Edge Function 호출 (외부 API)
```ts
// lib/api/stock.ts
import { supabase } from '@/lib/supabase/client';

export type StockPriceTypes = {
  ticker: string;
  price: number;
  change_pct: number;
};

export const getKrStockPrice = async (ticker: string): Promise<StockPriceTypes> => {
  const { data, error } = await supabase.functions.invoke('kr-stock', {
    body: { ticker },
  });
  if (error) throw error;
  return data as StockPriceTypes;
};
```
