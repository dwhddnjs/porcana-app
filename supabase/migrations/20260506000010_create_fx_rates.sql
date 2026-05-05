-- fx_rates: KRW↔USD 환율 저장
-- refresh-fx Edge Function이 매일 09:00 KST에 갱신
-- 초기 시드: USD/KRW = 1380 (근사값)

create table public.fx_rates (
  base  text not null,
  quote text not null,
  rate  numeric(20, 8) not null,
  fetched_at timestamptz not null default now(),
  primary key (base, quote)
);

alter table public.fx_rates enable row level security;

create policy "fx_rates: authenticated read"
  on public.fx_rates for select
  to authenticated
  using (true);

insert into public.fx_rates (base, quote, rate) values
  ('USD', 'KRW', 1380),
  ('KRW', 'USD', 1.0 / 1380);
