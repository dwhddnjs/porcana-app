-- portfolio_holding_returns: 종목별 최신 누적 수익률 및 기여 수익률 캐시
-- recalc-portfolio-returns Edge Function이 매일 갱신
-- cumulative_return_pct: 포트폴리오 생성일 기준 종목 단독 누적 수익률 (base_currency 기준, 환율 반영)
-- contribution_pct: cumulative_return_pct × target_weight_pct / 100
-- (Σ contribution_pct ≈ portfolios.total_return_pct 가 수학적으로 보장됨)

create table public.portfolio_holding_returns (
  portfolio_id uuid not null references public.portfolios(portfolio_id) on delete cascade,
  asset_id uuid not null references public.assets(asset_id) on delete cascade,
  cumulative_return_pct numeric(10, 4) not null default 0,
  contribution_pct numeric(10, 4) not null default 0,
  base_price numeric(20, 6),
  latest_price numeric(20, 6),
  computed_at timestamptz not null default now(),
  primary key (portfolio_id, asset_id)
);

create index portfolio_holding_returns_portfolio_id_idx
  on public.portfolio_holding_returns(portfolio_id);

alter table public.portfolio_holding_returns enable row level security;

create policy "portfolio_holding_returns: select own"
  on public.portfolio_holding_returns for select
  using (
    exists (
      select 1 from public.portfolios p
      where p.portfolio_id = portfolio_holding_returns.portfolio_id
        and p.user_id = auth.uid()
    )
  );

-- insert/update/delete는 service_role(Edge Function)만 수행
