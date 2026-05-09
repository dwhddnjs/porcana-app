-- assets.market_subtype 컬럼 추가
-- NASDAQ/NYSE/AMEX/KOSPI/KOSDAQ, nullable (기존 53개 시드는 null)

alter table public.assets
  add column if not exists market_subtype text
    check (market_subtype in ('NASDAQ', 'NYSE', 'AMEX', 'KOSPI', 'KOSDAQ'));
