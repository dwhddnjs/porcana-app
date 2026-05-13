-- simulations: 모의투자 헤더. 1 portfolio = 1 simulation
-- 포트폴리오와 모의투자를 완전히 분리. 포트폴리오는 자산 비중 정의만 담당하고,
-- 모의투자는 시드/시작시점/수익률 등 게임 상태를 별도 엔티티로 보관.

create table public.simulations (
  simulation_id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(portfolio_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_money numeric(20, 2) not null,
  base_currency text not null default 'KRW',
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'ARCHIVED')),
  total_return_pct numeric(10, 4) not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id)
);

create index simulations_user_id_idx on public.simulations(user_id);
create index simulations_portfolio_id_idx on public.simulations(portfolio_id);
create index simulations_status_idx on public.simulations(status);

create trigger simulations_set_updated_at
  before update on public.simulations
  for each row execute function public.set_updated_at();

alter table public.simulations enable row level security;

create policy "simulations: select own"
  on public.simulations for select
  using (auth.uid() = user_id);

create policy "simulations: insert own"
  on public.simulations for insert
  with check (auth.uid() = user_id);

create policy "simulations: update own"
  on public.simulations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "simulations: delete own"
  on public.simulations for delete
  using (auth.uid() = user_id);
