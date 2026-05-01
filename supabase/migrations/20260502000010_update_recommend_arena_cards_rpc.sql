-- 아레나 추천 RPC 업데이트:
-- 섹터를 WHERE 필터에서 정렬 우선순위로 변경 → 섹터 매칭 자산이 부족할 때도 30장 채워짐.

create or replace function public.recommend_arena_cards(
  p_risk_profile text,
  p_sectors text[],
  p_exclude_ids uuid[]
) returns setof public.assets
language sql
stable
as $$
  select a.*
  from public.assets a
  where a.asset_id <> all (coalesce(p_exclude_ids, '{}'::uuid[]))
  order by
    case
      when coalesce(cardinality(p_sectors), 0) = 0 then 0
      when a.sector = any (p_sectors) then 0
      else 1
    end asc,
    case p_risk_profile
      when 'AGGRESSIVE' then abs(a.current_risk_level - 5)
      when 'BALANCED'   then abs(a.current_risk_level - 3)
      when 'SAFE'       then abs(a.current_risk_level - 1)
      else 0
    end asc,
    random()
  limit 3;
$$;
