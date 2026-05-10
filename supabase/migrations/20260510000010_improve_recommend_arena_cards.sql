-- recommend_arena_cards 개선:
-- 1. 리스크 범위 확장 (공격형 3~5, 중립형 2~4, 수비형 1~3) - 부족하면 범위 밖도 포함
-- 2. 섹터 다양성 보장 - 각 섹터의 최적 자산을 먼저 선택해 매 라운드 다른 섹터 노출

create or replace function public.recommend_arena_cards(
  p_risk_profile text,
  p_sectors      text[],
  p_exclude_ids  uuid[]
) returns setof public.assets
language plpgsql
as $$
declare
  v_target_risk integer;
  v_min_risk    integer;
  v_max_risk    integer;
begin
  case p_risk_profile
    when 'AGGRESSIVE' then v_target_risk := 5; v_min_risk := 3; v_max_risk := 5;
    when 'BALANCED'   then v_target_risk := 3; v_min_risk := 2; v_max_risk := 4;
    when 'SAFE'       then v_target_risk := 1; v_min_risk := 1; v_max_risk := 3;
    else                   v_target_risk := 3; v_min_risk := 2; v_max_risk := 4;
  end case;

  return query
  with ranked as (
    select
      a.asset_id,
      -- 리스크 범위 밖이면 패널티 (부족할 때 fallback 용도)
      case when a.current_risk_level between v_min_risk and v_max_risk then 0 else 1 end as out_of_range,
      -- 선택 섹터 미매칭 패널티
      case
        when coalesce(cardinality(p_sectors), 0) = 0 then 0
        when a.sector = any(p_sectors) then 0
        else 1
      end as sector_priority,
      abs(a.current_risk_level - v_target_risk) as risk_distance,
      -- 섹터별 순위 - 각 섹터의 1등 자산을 먼저 선택해 섹터 다양성 확보
      row_number() over (
        partition by a.sector
        order by
          case when a.current_risk_level between v_min_risk and v_max_risk then 0 else 1 end,
          abs(a.current_risk_level - v_target_risk),
          random()
      ) as sector_rank
    from public.assets a
    where a.asset_id <> all(coalesce(p_exclude_ids, '{}'::uuid[]))
  ),
  selected as (
    select asset_id
    from ranked
    order by
      sector_rank    asc,    -- 각 섹터 1번 자산 우선 → 섹터 다양성
      out_of_range   asc,    -- 리스크 범위 내 자산 우선
      sector_priority asc,   -- 선택 섹터 우선
      risk_distance  asc,    -- 목표 리스크에 가까울수록
      random()               -- 동점 랜덤
    limit 3
  )
  select a.*
  from public.assets a
  join selected s on s.asset_id = a.asset_id;
end;
$$;

grant execute on function public.recommend_arena_cards(text, text[], uuid[]) to anon, authenticated;
