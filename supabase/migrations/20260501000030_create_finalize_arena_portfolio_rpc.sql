-- finalize_arena_portfolio: 아레나 10라운드 완료 후 portfolio + holdings 일괄 생성
--   p_name              : 포트폴리오 이름
--   p_risk_profile      : AGGRESSIVE | BALANCED | SAFE  (현재 미사용. 추후 average_risk_level 외 메타에 활용 가능)
--   p_sectors           : 관심 섹터 (현재는 holdings 메타에 저장 안 함, 향후 확장용)
--   p_picked_asset_ids  : 선택한 10개 asset_id (순서 유지)
-- 반환: 생성된 portfolio_id

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

  insert into public.portfolios (user_id, name, status, average_risk_level, started_at)
  values (v_user_id, p_name, 'ACTIVE', coalesce(v_avg_risk, 0), now())
  returning portfolio_id into v_portfolio_id;

  -- 동일 가중치 10%
  insert into public.portfolio_holdings (portfolio_id, asset_id, target_weight_pct)
  select v_portfolio_id, asset_id, 10.0
  from unnest(p_picked_asset_ids) as t(asset_id)
  on conflict (portfolio_id, asset_id) do nothing;

  -- 메인 포트폴리오 미설정이면 자동 지정
  update public.profiles
  set main_portfolio_id = v_portfolio_id
  where user_id = v_user_id and main_portfolio_id is null;

  return v_portfolio_id;
end;
$$;

grant execute on function public.finalize_arena_portfolio(text, text, text[], uuid[]) to authenticated;
