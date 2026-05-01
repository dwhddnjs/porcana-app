-- portfolio_holdings: 포트폴리오 보유 자산

create table public.portfolio_holdings (
  holding_id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(portfolio_id) on delete cascade,
  asset_id uuid not null references public.assets(asset_id) on delete restrict,
  target_weight_pct numeric(7, 4) not null default 0,
  quantity numeric(20, 6),
  avg_price numeric(20, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, asset_id)
);

create index portfolio_holdings_portfolio_id_idx on public.portfolio_holdings(portfolio_id);
create index portfolio_holdings_asset_id_idx on public.portfolio_holdings(asset_id);

create trigger portfolio_holdings_set_updated_at
  before update on public.portfolio_holdings
  for each row execute function public.set_updated_at();

-- RLS: portfolios의 owner만 접근
alter table public.portfolio_holdings enable row level security;

create policy "portfolio_holdings: select own"
  on public.portfolio_holdings for select
  using (
    exists (
      select 1 from public.portfolios p
      where p.portfolio_id = portfolio_holdings.portfolio_id
        and p.user_id = auth.uid()
    )
  );

create policy "portfolio_holdings: insert own"
  on public.portfolio_holdings for insert
  with check (
    exists (
      select 1 from public.portfolios p
      where p.portfolio_id = portfolio_holdings.portfolio_id
        and p.user_id = auth.uid()
    )
  );

create policy "portfolio_holdings: update own"
  on public.portfolio_holdings for update
  using (
    exists (
      select 1 from public.portfolios p
      where p.portfolio_id = portfolio_holdings.portfolio_id
        and p.user_id = auth.uid()
    )
  );

create policy "portfolio_holdings: delete own"
  on public.portfolio_holdings for delete
  using (
    exists (
      select 1 from public.portfolios p
      where p.portfolio_id = portfolio_holdings.portfolio_id
        and p.user_id = auth.uid()
    )
  );
