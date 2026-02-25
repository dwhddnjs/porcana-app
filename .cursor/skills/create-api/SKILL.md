---
name: create-api
description: API 엔드포인트 파일을 lib/api/에 생성하거나 기존 파일에 추가. Use when the user asks to create API functions, endpoints, or add new API calls.
---

# Create API

주어진 인수를 바탕으로 `lib/api/`에 API 엔드포인트 파일을 생성하거나, 기존 파일에 엔드포인트를 추가합니다.

**사용법**: `<리소스명> [설명]`

예시:
- `notification` → `lib/api/notification.ts` 생성
- `portfolio 포트폴리오 좋아요 추가` → `lib/api/portfolio.ts`에 엔드포인트 추가

> 네이밍, 타입 등 일반 규칙은 `.cursorrules`를 따릅니다.

## API 전용 규칙

- Base URL: `EXPO_PUBLIC_API_BASE_URL/api/v1/`
- Axios 인스턴스는 `@/lib/api/client` 재사용
- 함수명은 리소스 동작을 명확히 표현 (예: `getPortfolios`, `createPortfolio`, `deletePortfolio`)

## 절차

1. 기존 `lib/api/` 파일들(portfolio.ts, auth.ts 등)을 읽어 Axios 클라이언트 임포트 방식과 패턴 맞추기
2. OpenAPI 스펙(`https://api.porcana.co.kr/v3/api-docs`)을 조회하여 정확한 request/response 타입 정의
3. API 파일 생성 또는 기존 파일에 추가

## 출력 예시

```ts
// lib/api/notification.ts
import { client } from '@/lib/api/client';

export type GetNotificationsResponseTypes = {
  id: string;
  message: string;
  createdAt: string;
}[];

export type CreateNotificationRequestTypes = {
  message: string;
};

export const getNotifications = async (): Promise<GetNotificationsResponseTypes> => {
  const { data } = await client.get('/notifications');
  return data;
};

export const createNotification = async (
  body: CreateNotificationRequestTypes
): Promise<void> => {
  await client.post('/notifications', body);
};
```
