-- fx_rates_history: 환율 일별 시계열
-- refresh-fx Edge Function이 매일 09:00 KST에 1행씩 upsert
-- recalc-portfolio-returns에서 일별 가격 환산 시 사용 (다중 통화 포트폴리오 정확성)

create table public.fx_rates_history (
  base  text not null,
  quote text not null,
  date  date not null,
  rate  numeric(20, 8) not null,
  primary key (base, quote, date)
);

create index fx_rates_history_base_quote_date_idx
  on public.fx_rates_history(base, quote, date desc);

alter table public.fx_rates_history enable row level security;

create policy "fx_rates_history: authenticated read"
  on public.fx_rates_history for select
  to authenticated
  using (true);

-- 초기 시드: 오늘자 1380으로 백필 (실데이터는 refresh-fx가 채워나감)
insert into public.fx_rates_history (base, quote, date, rate)
values
  ('USD', 'KRW', current_date, 1380),
  ('KRW', 'USD', current_date, 1.0 / 1380)
on conflict do nothing;
