-- 테스트용 더미 데이터: 메인 포트폴리오에 1년치 portfolio_value_history 삽입
-- 실행 전: 본인 portfolio_id로 교체 필요
-- SELECT portfolio_id, name, is_main FROM portfolios WHERE is_main = true;

do $$
declare
  v_portfolio_id uuid;
  v_date date;
  v_days int;
  v_index numeric;
  v_prev_index numeric;
begin
  -- is_main = true인 포트폴리오 조회
  select portfolio_id into v_portfolio_id
  from public.portfolios
  where is_main = true
  limit 1;

  if v_portfolio_id is null then
    raise notice '메인 포트폴리오가 없습니다. is_main = true로 설정 후 다시 실행하세요.';
    return;
  end if;

  -- 기존 더미 데이터 삭제
  delete from public.portfolio_value_history where portfolio_id = v_portfolio_id;

  -- 1년치 일별 데이터 생성 (기준 100, 약간의 랜덤 변동)
  v_index := 100.0;
  v_days := 0;

  while v_days < 365 loop
    v_date := current_date - (365 - v_days);

    -- 주말 제외 (토=6, 일=0)
    if extract(dow from v_date) not in (0, 6) then
      v_prev_index := v_index;
      -- 일간 변동: -0.8% ~ +1.0% 범위 (약간 상승 편향)
      v_index := v_index * (1 + (random() * 0.018 - 0.008));

      insert into public.portfolio_value_history (
        portfolio_id, date, index_value, return_pct, daily_return_pct
      ) values (
        v_portfolio_id,
        v_date,
        round(v_index::numeric, 6),
        round((v_index - 100)::numeric, 4),
        round(((v_index / v_prev_index) - 1) * 100::numeric, 4)
      )
      on conflict (portfolio_id, date) do nothing;
    end if;

    v_days := v_days + 1;
  end loop;

  -- portfolios.total_return_pct 갱신
  update public.portfolios
  set total_return_pct = round((v_index - 100)::numeric, 4)
  where portfolio_id = v_portfolio_id;

  raise notice '더미 데이터 삽입 완료: portfolio_id=%, 최종 수익률=% pct', v_portfolio_id, round((v_index - 100)::numeric, 2);
end $$;
