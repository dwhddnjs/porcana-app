-- recommend_arena_cards: 리스크 프로필 + 섹터 + 기존 선택 제외 조건으로 카드 3장 추천
--   p_risk_profile  : AGGRESSIVE | BALANCED | SAFE  (현재 리스크와의 거리로 가중)
--   p_sectors       : 관심 섹터 코드 배열 (빈 배열이면 전체)
--   p_exclude_ids   : 이미 선택한 asset_id 배열

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
    and (
      coalesce(cardinality(p_sectors), 0) = 0
      or a.sector = any (p_sectors)
    )
  order by
    case p_risk_profile
      when 'AGGRESSIVE' then abs(a.current_risk_level - 5)
      when 'BALANCED'   then abs(a.current_risk_level - 3)
      when 'SAFE'       then abs(a.current_risk_level - 1)
      else 0
    end asc,
    random()
  limit 3;
$$;

grant execute on function public.recommend_arena_cards(text, text[], uuid[]) to anon, authenticated;
