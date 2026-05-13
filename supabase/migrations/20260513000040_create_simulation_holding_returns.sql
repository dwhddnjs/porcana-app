-- simulation_holding_returns: 종목별 누적/기여 수익률 캐시 (모의투자 기준)
-- recalc-portfolio-returns Edge Function이 매일 갱신.

create table public.simulation_holding_returns (
  simulation_id uuid not null references public.simulations(simulation_id) on delete cascade,
  asset_id uuid not null references public.assets(asset_id) on delete cascade,
  cumulative_return_pct numeric(10, 4) not null default 0,
  contribution_pct numeric(10, 4) not null default 0,
  base_price numeric(20, 6),
  latest_price numeric(20, 6),
  computed_at timestamptz not null default now(),
  primary key (simulation_id, asset_id)
);

create index simulation_holding_returns_simulation_id_idx
  on public.simulation_holding_returns(simulation_id);

alter table public.simulation_holding_returns enable row level security;

create policy "simulation_holding_returns: select own"
  on public.simulation_holding_returns for select
  using (
    exists (
      select 1 from public.simulations s
      where s.simulation_id = simulation_holding_returns.simulation_id
        and s.user_id = auth.uid()
    )
  );

-- insert/update/delete는 service_role(Edge Function)만 수행
