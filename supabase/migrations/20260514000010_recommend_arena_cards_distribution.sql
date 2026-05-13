-- recommend_arena_cards 리스크 분포 개선:
-- 이전 버전은 성향별 좁은 범위(AGGRESSIVE=3-5 등)에서만 뽑아 공격형=4·5 위주, 방어형=1·2 위주로 쏠림
-- → 모든 성향에 전 리스크 레벨이 분산 등장하도록 가중 샘플링 적용 (Efraimidis-Spirakis)
-- 매 라운드 3장 구성: core 2장(target_risk ±1) + outlier 1장(target와 거리 ≥2)
-- 라운드 내 risk level 중복 금지 / 섹터 다양성 유지
--
-- 목표 분포 (한국 자산운용업계 표준형):
--          Lv1   Lv2   Lv3   Lv4   Lv5
-- AGGRESSIVE  5%   10%   20%   30%   35%
-- BALANCED   10%  22.5%  35%  22.5%  10%
-- SAFE       40%   35%   20%    5%    0%

create or replace function public.recommend_arena_cards(
  p_risk_profile text,
  p_sectors      text[],
  p_exclude_ids  uuid[]
) returns setof public.assets
language plpgsql
as $$
declare
  v_target_risk integer;
  v_weights     numeric[];   -- index 1..5 = risk level 1..5 의 비중
begin
  case p_risk_profile
    when 'AGGRESSIVE' then
      v_target_risk := 5;
      v_weights     := array[0.05, 0.10, 0.20, 0.30, 0.35];
    when 'BALANCED' then
      v_target_risk := 3;
      v_weights     := array[0.10, 0.225, 0.35, 0.225, 0.10];
    when 'SAFE' then
      v_target_risk := 1;
      v_weights     := array[0.40, 0.35, 0.20, 0.05, 0.00];
    else
      v_target_risk := 3;
      v_weights     := array[0.10, 0.225, 0.35, 0.225, 0.10];
  end case;

  return query
  with
  -- 각 risk level별로 후보 자산 1순위 선출 (섹터 우선 + random)
  candidates as (
    select
      a.asset_id,
      a.current_risk_level                                          as lv,
      v_weights[a.current_risk_level]                               as w,
      abs(a.current_risk_level - v_target_risk)                     as dist,
      row_number() over (
        partition by a.current_risk_level
        order by
          case when coalesce(cardinality(p_sectors), 0) > 0
                    and a.sector = any(p_sectors) then 0 else 1 end,
          random()
      )                                                             as rank_in_level
    from public.assets a
    where a.asset_id <> all(coalesce(p_exclude_ids, '{}'::uuid[]))
      and v_weights[a.current_risk_level] > 0   -- 해당 성향에서 비중 0인 레벨 제외
  ),
  -- risk level 대표 1장씩, 가중 샘플링 키 부여
  level_reps as (
    select
      asset_id,
      lv,
      w,
      dist,
      -- core: target ±1 / outlier: 거리 ≥2
      case when dist <= 1 then 'core' else 'outlier' end            as band,
      -- Efraimidis-Spirakis 가중 샘플링: key가 작을수록 선택 우선
      -ln(random()) / w                                             as sample_key
    from candidates
    where rank_in_level = 1
  ),
  -- core 그룹에서 2개 선택
  core_pick as (
    select asset_id, lv
    from level_reps
    where band = 'core'
    order by sample_key
    limit 2
  ),
  -- outlier 그룹에서 1개 선택 (core에서 이미 뽑힌 lv 제외)
  outlier_pick as (
    select asset_id, lv
    from level_reps
    where band = 'outlier'
      and lv not in (select lv from core_pick)
    order by sample_key
    limit 1
  ),
  -- core 2 + outlier 1 합치기
  chosen as (
    select asset_id from core_pick
    union all
    select asset_id from outlier_pick
  )
  select a.*
  from public.assets a
  join chosen c on c.asset_id = a.asset_id;
end;
$$;

grant execute on function public.recommend_arena_cards(text, text[], uuid[]) to anon, authenticated;
