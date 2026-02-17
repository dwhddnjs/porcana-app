# Create API

주어진 인수를 바탕으로 `lib/api/` 에 API 엔드포인트 파일을 생성하거나, 기존 파일에 엔드포인트를 추가합니다.

**사용법**: `/create-api <리소스명> [설명]`

예시:
- `/create-api notification` → `lib/api/notification.ts` 생성
- `/create-api portfolio 포트폴리오 좋아요 추가` → `lib/api/portfolio.ts` 에 엔드포인트 추가

## 규칙

1. 파일명은 **kebab-case** (예: `user-profile.ts`)
2. Base URL: `EXPO_PUBLIC_API_BASE_URL/api/v1/`
3. API 스펙 확인: OpenAPI JSON → `https://api.porcana.co.kr/v3/api-docs`
4. Request/Response 타입을 반드시 정의 (`Types` 접미사)
5. Axios 인스턴스는 `@/lib/api/client` (또는 기존 방식) 재사용
6. 각 함수는 리소스 동작을 명확히 표현 (예: `getPortfolios`, `createPortfolio`, `deletePortfolio`)

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

생성 전에 기존 `lib/api/` 파일들(portfolio.ts, auth.ts 등)을 읽어 Axios 클라이언트 임포트 방식과 패턴을 맞추세요.
OpenAPI 스펙을 조회하여 정확한 request/response 타입을 정의하세요.
