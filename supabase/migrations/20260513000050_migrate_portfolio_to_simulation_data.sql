-- 기존 portfolios.seed_money / portfolio_holdings.quantity·avg_price /
-- portfolio_value_history / portfolio_holding_returns 데이터를
-- 신규 simulation_* 테이블로 1회성 이관.
--
-- 안전성: portfolios / portfolio_holdings 의 기존 컬럼은 DROP 하지 않음 (롤백 안전).
-- 후속 PR에서 deprecated 컬럼들을 제거할 예정.

-- 1) seed_money 가 설정된 portfolio → simulations 신규 row
insert into public.simulations
  (portfolio_id, user_id, seed_money, base_currency, status, total_return_pct, started_at, created_at)
select
  p.portfolio_id,
  p.user_id,
  p.seed_money,
  coalesce(p.base_currency, 'KRW'),
  case when p.status = 'ARCHIVED' then 'ARCHIVED' else 'ACTIVE' end,
  coalesce(p.total_return_pct, 0),
  coalesce(p.started_at, p.created_at),
  coalesce(p.started_at, p.created_at)
from public.portfolios p
where p.seed_money is not null
on conflict (portfolio_id) do nothing;

-- 2) portfolio_holdings.quantity/avg_price → simulation_holdings
insert into public.simulation_holdings (simulation_id, asset_id, quantity, avg_price)
select
  s.simulation_id,
  ph.asset_id,
  coalesce(ph.quantity, 0),
  coalesce(ph.avg_price, 0)
from public.portfolio_holdings ph
join public.simulations s on s.portfolio_id = ph.portfolio_id
where ph.quantity is not null
on conflict (simulation_id, asset_id) do nothing;

-- 3) portfolio_value_history → simulation_value_history
insert into public.simulation_value_history
  (simulation_id, date, index_value, return_pct, daily_return_pct, created_at)
select
  s.simulation_id,
  pvh.date,
  pvh.index_value,
  pvh.return_pct,
  pvh.daily_return_pct,
  pvh.created_at
from public.portfolio_value_history pvh
join public.simulations s on s.portfolio_id = pvh.portfolio_id
on conflict (simulation_id, date) do nothing;

-- 4) portfolio_holding_returns → simulation_holding_returns
insert into public.simulation_holding_returns
  (simulation_id, asset_id, cumulative_return_pct, contribution_pct, base_price, latest_price, computed_at)
select
  s.simulation_id,
  phr.asset_id,
  phr.cumulative_return_pct,
  phr.contribution_pct,
  phr.base_price,
  phr.latest_price,
  phr.computed_at
from public.portfolio_holding_returns phr
join public.simulations s on s.portfolio_id = phr.portfolio_id
on conflict (simulation_id, asset_id) do nothing;
