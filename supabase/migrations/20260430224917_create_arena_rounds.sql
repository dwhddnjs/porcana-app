-- arena_rounds: 아레나 라운드별 후보/선택 기록

create table public.arena_rounds (
  round_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.arena_sessions(session_id) on delete cascade,
  round_number integer not null check (round_number between 1 and 50),
  candidate_asset_ids uuid[] not null,
  picked_asset_id uuid references public.assets(asset_id) on delete set null,
  picked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, round_number)
);

create index arena_rounds_session_id_idx on public.arena_rounds(session_id);

-- RLS: arena_sessions owner만 접근
alter table public.arena_rounds enable row level security;

create policy "arena_rounds: select own"
  on public.arena_rounds for select
  using (
    exists (
      select 1 from public.arena_sessions s
      where s.session_id = arena_rounds.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "arena_rounds: insert own"
  on public.arena_rounds for insert
  with check (
    exists (
      select 1 from public.arena_sessions s
      where s.session_id = arena_rounds.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "arena_rounds: update own"
  on public.arena_rounds for update
  using (
    exists (
      select 1 from public.arena_sessions s
      where s.session_id = arena_rounds.session_id
        and s.user_id = auth.uid()
    )
  );
