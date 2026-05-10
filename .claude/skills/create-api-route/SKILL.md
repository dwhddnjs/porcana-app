---
name: create-api-route
description: Supabase Edge Function을 생성합니다. 외부 API 프록시(주가 데이터 등), 복잡한 비즈니스 로직에 사용. supabase/functions/<name>/index.ts 생성.
argument-hint: "<함수명> [용도 설명]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Create Supabase Edge Function

Supabase Edge Functions (Deno 기반)를 생성합니다. 외부 API 호출·복잡한 서버 로직에 사용하고, 단순 Postgres 조회는 클라이언트에서 `supabase` SDK로 직접 처리합니다.

인수: $ARGUMENTS

예시:
- `/create-api-route stock-price` → `supabase/functions/stock-price/index.ts`
- `/create-api-route kr-stock 한국 주식 현재가 API 프록시`

> 네이밍, 타입 등 일반 규칙은 CLAUDE.md를 따릅니다.

## 언제 Edge Function이 필요한가

- 외부 API key를 숨겨야 할 때 (주가 API, 환율 API 등)
- 여러 테이블을 조인해 복잡한 계산 후 반환할 때
- 웹훅 수신 (결제, 알림 등)
- 단순 Postgres CRUD → 클라이언트 SDK 직접 사용

## 규칙

- 함수명은 kebab-case. `supabase/functions/<name>/index.ts` 구조.
- Deno 환경. `import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'` 사용.
- CORS 헤더 포함 (`OPTIONS` preflight 처리).
- 인증: `Authorization: Bearer <JWT>` 헤더에서 Supabase JWT 검증.
- 환경변수: `Deno.env.get('...')`. 민감 키는 `supabase secrets set` 으로 등록.
- 응답은 `Response` 객체 직접 반환.

## 절차

1. 인수 파싱 → 함수명·용도 파악
2. `supabase/functions/<name>/` 디렉토리 생성 후 `index.ts` 작성
3. 필요한 외부 API나 환경변수 목록을 사용자에게 안내
4. 배포 명령어 안내

## 출력 예시

### 외부 API 프록시 (한국 주식 현재가)
```ts
// supabase/functions/kr-stock/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const { ticker } = await req.json();
  if (!ticker) {
    return new Response(JSON.stringify({ error: 'ticker required' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('KR_STOCK_API_KEY')!;
  const res = await fetch(`https://api.example.com/stock/${ticker}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
```

### 배포 안내 (작성 후 출력)
```bash
# Edge Function 배포
npx supabase functions deploy <name>

# 환경변수 등록
npx supabase secrets set KR_STOCK_API_KEY=your_key

# 로컬 테스트
npx supabase functions serve <name>
```

### 클라이언트에서 호출 (`lib/api/<resource>.ts`)
```ts
import { supabase } from '@/lib/supabase/client';

export const getKrStock = async (ticker: string) => {
  const { data, error } = await supabase.functions.invoke('kr-stock', {
    body: { ticker },
  });
  if (error) throw error;
  return data;
};
```
