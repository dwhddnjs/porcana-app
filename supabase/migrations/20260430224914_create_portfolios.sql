-- portfolios: 사용자별 포트폴리오

create table public.portfolios (
  portfolio_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  is_main boolean not null default false,
  seed_money numeric(20, 2),
  base_currency text not null default 'KRW',
  total_return_pct numeric(10, 4) not null default 0,
  average_risk_level integer not null default 0,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index portfolios_user_id_idx on public.portfolios(user_id);
create index portfolios_user_main_idx on public.portfolios(user_id, is_main);

create trigger portfolios_set_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();

-- profiles.main_portfolio_id FK 추가 (profiles 테이블이 먼저 생성됨)
alter table public.profiles
  add constraint profiles_main_portfolio_id_fkey
  foreign key (main_portfolio_id) references public.portfolios(portfolio_id)
  on delete set null;

-- RLS: 본인 소유만
alter table public.portfolios enable row level security;

create policy "portfolios: select own"
  on public.portfolios for select
  using (auth.uid() = user_id);

create policy "portfolios: insert own"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

create policy "portfolios: update own"
  on public.portfolios for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "portfolios: delete own"
  on public.portfolios for delete
  using (auth.uid() = user_id);
