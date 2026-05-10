-- finalize_arena_portfolio 버그 수정:
-- profiles.main_portfolio_id만 설정하고 portfolios.is_main = true를 빠뜨린 문제 수정

create or replace function public.finalize_arena_portfolio(
  p_name text,
  p_risk_profile text,
  p_sectors text[],
  p_picked_asset_ids uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_portfolio_id uuid;
  v_avg_risk integer;
  v_has_main boolean;
begin
  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  if coalesce(cardinality(p_picked_asset_ids), 0) <> 10 then
    raise exception 'must pick exactly 10 assets, got %', cardinality(p_picked_asset_ids);
  end if;

  if p_risk_profile is null or p_risk_profile not in ('AGGRESSIVE', 'BALANCED', 'SAFE') then
    raise exception 'invalid risk_profile: %', p_risk_profile;
  end if;

  select round(avg(current_risk_level))::int into v_avg_risk
  from public.assets
  where asset_id = any (p_picked_asset_ids);

  -- 기존 메인 포트폴리오 여부 확인
  select (main_portfolio_id is not null) into v_has_main
  from public.profiles
  where user_id = v_user_id;

  insert into public.portfolios (user_id, name, status, average_risk_level, started_at)
  values (v_user_id, p_name, 'ACTIVE', coalesce(v_avg_risk, 0), now())
  returning portfolio_id into v_portfolio_id;

  insert into public.portfolio_holdings (portfolio_id, asset_id, target_weight_pct)
  select v_portfolio_id, asset_id, 10.0
  from unnest(p_picked_asset_ids) as t(asset_id)
  on conflict (portfolio_id, asset_id) do nothing;

  -- 메인 포트폴리오가 없으면 새 포트폴리오를 메인으로 설정
  if not coalesce(v_has_main, false) then
    update public.portfolios
    set is_main = true
    where portfolio_id = v_portfolio_id;

    update public.profiles
    set main_portfolio_id = v_portfolio_id
    where user_id = v_user_id;
  end if;

  return v_portfolio_id;
end;
$$;

grant execute on function public.finalize_arena_portfolio(text, text, text[], uuid[]) to authenticated;

-- 기존 데이터 보정: profiles.main_portfolio_id가 있지만 portfolios.is_main이 false인 경우 수정
update public.portfolios p
set is_main = true
from public.profiles pr
where pr.user_id = p.user_id
  and pr.main_portfolio_id = p.portfolio_id
  and p.is_main = false;
