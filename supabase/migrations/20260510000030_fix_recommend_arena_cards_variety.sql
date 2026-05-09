-- recommend_arena_cards 다양성 수정:
-- 이전 버전에서 sector_rank 내부에도 risk_distance asc가 있어서
-- 각 섹터 대표가 항상 목표 리스크에 가장 가까운 자산으로 고정됨 → 공격형이면 4~5만 반복 노출
-- → sector_rank 내부를 random()으로만 정렬해 범위 내 자산이 골고루 대표로 선출되도록 수정

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
      case when a.current_risk_level between v_min_risk and v_max_risk then 0 else 1 end as out_of_range,
      case
        when coalesce(cardinality(p_sectors), 0) = 0 then 0
        when a.sector = any(p_sectors) then 0
        else 1
      end as sector_priority,
      abs(a.current_risk_level - v_target_risk) as risk_distance,
      -- 섹터별 순위: 범위 내 여부만 따지고, 그 안에서는 random()
      -- → 같은 섹터 내 리스크 3, 4, 5가 균등하게 대표로 선출됨
      row_number() over (
        partition by a.sector
        order by
          case when a.current_risk_level between v_min_risk and v_max_risk then 0 else 1 end,
          random()
      ) as sector_rank
    from public.assets a
    where a.asset_id <> all(coalesce(p_exclude_ids, '{}'::uuid[]))
  ),
  selected as (
    select asset_id
    from ranked
    order by
      sector_rank     asc,   -- 각 섹터 1번 자산 우선 → 섹터 다양성
      out_of_range    asc,   -- 리스크 범위 내 자산 우선
      sector_priority asc,   -- 선택 섹터 우선
      random()               -- 나머지 랜덤 → 리스크 레벨 다양성
    limit 3
  )
  select a.*
  from public.assets a
  join selected s on s.asset_id = a.asset_id;
end;
$$;

grant execute on function public.recommend_arena_cards(text, text[], uuid[]) to anon, authenticated;
