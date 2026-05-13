-- simulation_holdings: 모의투자 시작 시점의 자산별 매수 수량/평단
-- portfolio_holdings는 자산 비중(target_weight_pct)만 책임지고,
-- 실제 보유 quantity/avg_price는 simulation_holdings에서 관리.

create table public.simulation_holdings (
  holding_id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(simulation_id) on delete cascade,
  asset_id uuid not null references public.assets(asset_id) on delete restrict,
  quantity numeric(20, 6) not null default 0,
  avg_price numeric(20, 6) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (simulation_id, asset_id)
);

create index simulation_holdings_simulation_id_idx on public.simulation_holdings(simulation_id);
create index simulation_holdings_asset_id_idx on public.simulation_holdings(asset_id);

create trigger simulation_holdings_set_updated_at
  before update on public.simulation_holdings
  for each row execute function public.set_updated_at();

alter table public.simulation_holdings enable row level security;

create policy "simulation_holdings: select own"
  on public.simulation_holdings for select
  using (
    exists (
      select 1 from public.simulations s
      where s.simulation_id = simulation_holdings.simulation_id
        and s.user_id = auth.uid()
    )
  );

create policy "simulation_holdings: insert own"
  on public.simulation_holdings for insert
  with check (
    exists (
      select 1 from public.simulations s
      where s.simulation_id = simulation_holdings.simulation_id
        and s.user_id = auth.uid()
    )
  );

create policy "simulation_holdings: update own"
  on public.simulation_holdings for update
  using (
    exists (
      select 1 from public.simulations s
      where s.simulation_id = simulation_holdings.simulation_id
        and s.user_id = auth.uid()
    )
  );

create policy "simulation_holdings: delete own"
  on public.simulation_holdings for delete
  using (
    exists (
      select 1 from public.simulations s
      where s.simulation_id = simulation_holdings.simulation_id
        and s.user_id = auth.uid()
    )
  );
