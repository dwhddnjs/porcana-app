# API Spec

OpenAPI 스펙을 조회하여 특정 엔드포인트의 상세 정보를 확인합니다.

**사용법**: `/api-spec [검색어]`

예시:
- `/api-spec portfolios` → portfolios 관련 엔드포인트 목록과 스펙 조회
- `/api-spec` → 전체 엔드포인트 목록 요약

## 절차

1. OpenAPI JSON 엔드포인트(`https://api.porcana.co.kr/v3/api-docs`) 를 WebFetch로 조회
2. 검색어와 관련된 path, method, request body, response schema를 추출
3. 결과를 표 또는 코드 블록으로 정리하여 출력

## 출력 형식

```
### POST /api/v1/portfolios

**설명**: 포트폴리오 생성

**Request Body**:
| 필드       | 타입   | 필수 | 설명         |
|-----------|--------|------|------------|
| name      | string | ✓   | 포트폴리오 이름 |
| ...       | ...    | ...  | ...        |

**Response (200)**:
| 필드    | 타입   | 설명        |
|--------|--------|------------|
| id     | string | 포트폴리오 ID |
| ...    | ...    | ...        |
```

조회 후 TypeScript 타입 정의가 필요하면 제안하세요.
