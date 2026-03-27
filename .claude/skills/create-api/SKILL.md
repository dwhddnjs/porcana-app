---
name: create-api
description: lib/api/에 API 엔드포인트 파일을 생성하거나 기존 파일에 엔드포인트를 추가합니다. API 함수 만들기, 엔드포인트 추가 시 사용.
argument-hint: "<리소스명> [설명]"
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch
---

# Create API

주어진 인수를 바탕으로 `lib/api/` 에 API 엔드포인트 파일을 생성하거나, 기존 파일에 엔드포인트를 추가합니다.

인수: $ARGUMENTS

예시:
- `/create-api notification` → `lib/api/notification.ts` 생성
- `/create-api portfolio 포트폴리오 좋아요 추가` → `lib/api/portfolio.ts` 에 엔드포인트 추가

> 네이밍, 타입 등 일반 규칙은 CLAUDE.md를 따릅니다.

## 절차

1. OpenAPI 스펙 조회 (`https://api.porcana.co.kr/v3/api-docs`) 로 정확한 request/response 타입 확인
2. 기존 `lib/api/` 파일들을 읽어 Axios 클라이언트 임포트 방식과 패턴을 맞춤
3. 파일 생성 또는 기존 파일에 추가

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
