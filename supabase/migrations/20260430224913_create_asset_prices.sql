-- asset_prices: yahoo-finance 시세/차트 캐시 (range별)

create table public.asset_prices (
  asset_id uuid not null references public.assets(asset_id) on delete cascade,
  range text not null check (range in ('1M', '3M', '1Y')),
  points jsonb not null default '[]'::jsonb,
  current_price numeric(20, 6),
  currency text,
  fetched_at timestamptz not null default now(),
  primary key (asset_id, range)
);

create index asset_prices_fetched_at_idx on public.asset_prices(fetched_at);

-- RLS: 누구나 read
alter table public.asset_prices enable row level security;

create policy "asset_prices: public read"
  on public.asset_prices for select
  using (true);
