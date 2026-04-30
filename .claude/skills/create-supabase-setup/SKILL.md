---
name: create-supabase-setup
description: Supabase 서버리스 환경을 일괄 셋업합니다. 패키지 설치, lib/supabase 클라이언트(anon/admin), .env.example 생성. 최초 1회만 실행.
argument-hint: ""
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Create Supabase Setup

Porcana 앱의 **Supabase** 기반 서버리스 환경을 초기 구성합니다.

> **이 skill은 최초 1회만 실행.** 이미 `lib/supabase/client.ts`가 있으면 중단하고 사용자에게 알리세요.

## 아키텍처 (반드시 숙지)

- **클라이언트 직접 쿼리**: `supabase` (anon key + RLS) → Postgres
- **외부 API / 복잡한 로직**: Supabase Edge Functions (Deno) → 외부 API 또는 Postgres
- Expo Router API Routes (`+api.ts`) 미사용. `app.json`의 `web.output`은 `"static"` 유지.
- 인증: Supabase Auth. 클라이언트에서 `supabase.auth.signIn*` 호출 → JWT 발급 → 이후 쿼리에 자동 첨부.

## 절차

1. **현재 상태 확인**: `lib/supabase/` 존재 여부 점검. 이미 있으면 멈춤.
2. **패키지 설치**:
   ```bash
   npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
   ```
3. **파일 생성** (아래 출력 예시 참고):
   - `lib/supabase/client.ts` — 클라이언트용 (anon key, AsyncStorage)
   - `lib/supabase/server.ts` — Edge Function·서버 전용 (service_role key)
   - `.env.example`
4. **사용자 안내** (작업 완료 후 출력):
   - Supabase 대시보드 → Settings → API에서 URL / anon key / service_role key 복사
   - `.env.example` 복사해 `.env` 만들고 값 채우기
   - 다음 단계: `/create-supabase-table <name>` 으로 테이블 추가

## 출력 예시

### `lib/supabase/client.ts`
```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### `lib/supabase/server.ts`
```ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('Supabase server env missing: EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
```

> `server.ts`는 Edge Functions에서만 사용. 앱 번들에 포함되지 않도록 주의.

### `.env.example`
```
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
```
