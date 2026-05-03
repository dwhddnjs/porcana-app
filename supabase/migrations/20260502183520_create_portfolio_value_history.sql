-- portfolio_value_history: 포트폴리오 일별 수익률 스냅샷 (차트/기간별 수익률 조회용)

create table public.portfolio_value_history (
  id bigserial primary key,
  portfolio_id uuid not null references public.portfolios(portfolio_id) on delete cascade,
  date date not null,
  index_value numeric(12, 6) not null default 100,  -- 기준 100 기반 지수값
  return_pct numeric(8, 4) not null default 0,       -- 기준일 대비 누적 수익률 (%)
  daily_return_pct numeric(8, 4),                    -- 전일 대비 일간 수익률 (%)
  created_at timestamptz not null default now(),
  unique (portfolio_id, date)
);

create index portfolio_value_history_portfolio_id_date_idx
  on public.portfolio_value_history(portfolio_id, date desc);

-- RLS: Edge Function(service_role)이 write, 클라이언트는 API Route 경유
alter table public.portfolio_value_history enable row level security;

create policy "portfolio_value_history: select own"
  on public.portfolio_value_history for select
  using (
    exists (
      select 1 from public.portfolios p
      where p.portfolio_id = portfolio_value_history.portfolio_id
        and p.user_id = auth.uid()
    )
  );

-- insert/update/delete는 service_role(Edge Function)만 수행 → 별도 정책 불필요
