-- assets: 종목 마스터

create table public.assets (
  asset_id uuid primary key default gen_random_uuid(),
  ticker text not null,
  yahoo_symbol text not null,
  name text not null,
  market text not null check (market in ('US', 'KR')),
  type text not null check (type in ('STOCK', 'ETF')),
  sector text,
  asset_class text,
  current_risk_level integer not null check (current_risk_level between 1 and 5),
  image_url text,
  description text,
  impact_hint text,
  personality jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market, ticker)
);

create index assets_market_sector_idx on public.assets(market, sector);
create index assets_current_risk_level_idx on public.assets(current_risk_level);
create index assets_yahoo_symbol_idx on public.assets(yahoo_symbol);

create trigger assets_set_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

-- RLS: 누구나 read
alter table public.assets enable row level security;

create policy "assets: public read"
  on public.assets for select
  using (true);
