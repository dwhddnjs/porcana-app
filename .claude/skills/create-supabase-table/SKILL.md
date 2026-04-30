---
name: create-supabase-table
description: Supabase Postgres 테이블의 SQL 마이그레이션 파일을 생성합니다. supabase/migrations/ 에 작성, RLS는 기본 비활성화(API Route에서 검증), 타입 동기화 가이드 포함. 새 테이블 추가 시 사용.
argument-hint: "<테이블명> [설명]"
allowed-tools: Read, Write, Glob, Grep
---

# Create Supabase Table

`supabase/migrations/` 에 신규 테이블 SQL 마이그레이션 파일을 생성합니다.

인수: $ARGUMENTS

예시:
- `/create-supabase-table portfolios`
- `/create-supabase-table positions 포트폴리오 보유 자산`

> 환경 미셋업이면 먼저 `/create-supabase-setup`. 컬럼은 사용자와 합의 후 작성.

## 규칙

- 파일명: `supabase/migrations/<YYYYMMDDHHMMSS>_<table_name>.sql` (실행 시점 timestamp)
- 모든 테이블은 `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` 기본 포함
- 사용자 데이터 테이블은 `user_id uuid references auth.users(id) on delete cascade` + `guest_session_id text` 둘 다 nullable로 두고, 둘 중 하나는 not null이도록 check 제약
- **RLS는 기본 비활성화** — service_role이 우회하므로 의미 없음. 권한 검증은 API Route(`requireAuth` + 쿼리 필터)에서 수행. RLS 정책 템플릿은 주석으로 남겨 추후 활성화 가능하게.
- snake_case 컬럼명. enum은 `create type ... as enum (...)`로 별도 정의.
- 인덱스: 자주 조회되는 외래키/필터 컬럼에 명시
- `updated_at` 자동 갱신 트리거 추가

## 절차

1. 기존 `supabase/migrations/` 파일 확인 — 네이밍/스타일 참고
2. 사용자에게 컬럼 정의 확인 (기존 `Types` 정의 있으면 그것을 1차 제안)
3. timestamp 생성: `date -u +"%Y%m%d%H%M%S"`
4. SQL 파일 작성
5. 사용자에게 실행 안내:
   - **권장**: Supabase CLI — `supabase db push`
   - **대안**: 대시보드 SQL Editor에 붙여넣기
6. 타입 동기화 안내: `npx supabase gen types typescript --project-id <id> > types/db.ts`

## 출력 예시

### `supabase/migrations/20260501123000_portfolios.sql`
```sql
-- portfolios: 사용자/게스트별 포트폴리오

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_session_id text,
  name text not null,
  status text not null default 'ACTIVE',
  is_main boolean not null default false,
  total_return_pct numeric(10, 4) not null default 0,
  average_risk_level integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolios_owner_check check (
    user_id is not null or guest_session_id is not null
  )
);

create index portfolios_user_id_idx on portfolios(user_id);
create index portfolios_guest_session_id_idx on portfolios(guest_session_id);

-- updated_at 자동 갱신
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger portfolios_set_updated_at
  before update on portfolios
  for each row execute function set_updated_at();

-- RLS: 기본 비활성화 (API Route에서 검증)
-- 활성화하려면 아래 주석 해제:
-- alter table portfolios enable row level security;
-- create policy "own portfolios" on portfolios
--   for all using (auth.uid() = user_id);
```

## 셋업 후 다음 단계 안내

테이블 생성 후 일반적으로:
1. `/create-api-route <table>` — 해당 테이블의 CRUD 엔드포인트
2. `/create-api <table>` — 클라이언트 호출 함수
3. `/create-query <table>` 또는 `/create-mutation <action>-<table>` — React Query 훅
