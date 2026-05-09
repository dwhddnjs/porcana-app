-- finalize_arena_portfolio 개선:
-- 10개 종목 균등 가중치 10% 적용
-- (리스크 프로필은 종목 추천에만 영향, 비중과는 무관)

create or replace function public.finalize_arena_portfolio(
  p_name             text,
  p_risk_profile     text,
  p_sectors          text[],
  p_picked_asset_ids uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_portfolio_id uuid;
  v_avg_risk     integer;
  v_has_main     boolean;
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
  where asset_id = any(p_picked_asset_ids);

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
