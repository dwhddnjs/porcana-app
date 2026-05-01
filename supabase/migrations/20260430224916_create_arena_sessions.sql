-- arena_sessions: 아레나 게임 세션

create table public.arena_sessions (
  session_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  portfolio_id uuid references public.portfolios(portfolio_id) on delete set null,
  name text not null,
  status text not null default 'IN_PROGRESS'
    check (status in ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
  current_round integer not null default 0,
  max_rounds integer not null default 10,
  risk_profile text,
  sectors text[],
  markets text[] not null default array['US', 'KR']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index arena_sessions_user_id_idx on public.arena_sessions(user_id);
create index arena_sessions_status_idx on public.arena_sessions(status);

create trigger arena_sessions_set_updated_at
  before update on public.arena_sessions
  for each row execute function public.set_updated_at();

-- RLS: 본인 소유만
alter table public.arena_sessions enable row level security;

create policy "arena_sessions: select own"
  on public.arena_sessions for select
  using (auth.uid() = user_id);

create policy "arena_sessions: insert own"
  on public.arena_sessions for insert
  with check (auth.uid() = user_id);

create policy "arena_sessions: update own"
  on public.arena_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "arena_sessions: delete own"
  on public.arena_sessions for delete
  using (auth.uid() = user_id);
