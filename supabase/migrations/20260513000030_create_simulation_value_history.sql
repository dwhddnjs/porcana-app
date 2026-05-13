-- simulation_value_history: 모의투자 일별 수익률 스냅샷 (차트/기간별 수익률 조회용)
-- portfolio_value_history는 deprecated, 신규 데이터는 이 테이블에 기록됨.

create table public.simulation_value_history (
  id bigserial primary key,
  simulation_id uuid not null references public.simulations(simulation_id) on delete cascade,
  date date not null,
  index_value numeric(12, 6) not null default 100,
  return_pct numeric(8, 4) not null default 0,
  daily_return_pct numeric(8, 4),
  created_at timestamptz not null default now(),
  unique (simulation_id, date)
);

create index simulation_value_history_simulation_id_date_idx
  on public.simulation_value_history(simulation_id, date desc);

alter table public.simulation_value_history enable row level security;

create policy "simulation_value_history: select own"
  on public.simulation_value_history for select
  using (
    exists (
      select 1 from public.simulations s
      where s.simulation_id = simulation_value_history.simulation_id
        and s.user_id = auth.uid()
    )
  );

-- insert/update/delete는 service_role(Edge Function)만 수행
