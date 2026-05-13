// 모의투자 수익률 재계산: asset_prices 갱신 후 pg_cron으로 호출.
// - status='ACTIVE' simulation 들의 일별 가중 지수를 simulation_value_history 에 upsert
// - 종목별 누적/기여 수익률을 simulation_holding_returns 에 upsert
// - simulations.total_return_pct 갱신
// - 다중 통화: base_currency 기준으로 일별 환율 적용 (fx_rates_history 사용, 없으면 fx_rates fallback)
//
// 포트폴리오 본체(portfolios) 의 수익률/시계열은 더 이상 갱신하지 않음.

// @ts-expect-error Deno 표준 라이브러리
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error Supabase Edge Functions npm specifier
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: { env: { get: (k: string) => string | undefined } };

type PricePointTypes = { t: string; c: number };

type HoldingRowTypes = {
  asset_id: string;
  target_weight_pct: number;
  assets: {
    market: string;
    asset_prices: { range: string; points: PricePointTypes[] }[];
  };
};

type SimulationRowTypes = {
  simulation_id: string;
  portfolio_id: string;
  started_at: string;
  base_currency: string | null;
  portfolios: {
    portfolio_holdings: HoldingRowTypes[];
  };
};

type HistoryRowTypes = {
  simulation_id: string;
  date: string;
  index_value: number;
  return_pct: number;
  daily_return_pct: number | null;
};

type HoldingReturnRowTypes = {
  simulation_id: string;
  asset_id: string;
  cumulative_return_pct: number;
  contribution_pct: number;
  base_price: number | null;
  latest_price: number | null;
  computed_at: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const marketToCurrency = (market: string) => (market === 'US' ? 'USD' : 'KRW');

const convertPrice = (
  price: number,
  fromCcy: string,
  toCcy: string,
  date: string,
  fxByDate: Map<string, Map<string, number>>,
  fxFallback: Map<string, number>
): number => {
  if (fromCcy === toCcy) return price;
  const key = `${fromCcy}->${toCcy}`;
  const dateFx = fxByDate.get(date);
  const rate = dateFx?.get(key) ?? fxFallback.get(key);
  if (!rate || !isFinite(rate)) return price;
  return price * rate;
};

type CalcResultTypes = {
  history: { date: string; index_value: number; return_pct: number; daily_return_pct: number | null }[];
  holdingReturns: { asset_id: string; cumulative_return_pct: number; contribution_pct: number; base_price: number; latest_price: number }[];
};

const calcWeightedIndex = (
  holdings: HoldingRowTypes[],
  startDate: string,
  baseCurrency: string,
  fxByDate: Map<string, Map<string, number>>,
  fxFallback: Map<string, number>
): CalcResultTypes => {
  const enriched = holdings.map((h) => {
    const range1Y = (h.assets?.asset_prices ?? []).find((p) => p.range === '1Y');
    const points: PricePointTypes[] = range1Y?.points ?? [];
    const assetCcy = marketToCurrency(h.assets?.market ?? '');

    const convertedMap = new Map<string, number>();
    points.forEach((p) => {
      const converted = convertPrice(p.c, assetCcy, baseCurrency, p.t, fxByDate, fxFallback);
      if (converted > 0) convertedMap.set(p.t, converted);
    });

    const sortedDates = [...convertedMap.keys()].sort();
    const onOrBefore = sortedDates.filter((d) => d <= startDate);
    const baseDate = onOrBefore.length ? onOrBefore[onOrBefore.length - 1] : null;
    const firstPrice = baseDate ? (convertedMap.get(baseDate) ?? 0) : 0;

    const latestDate = sortedDates.length ? sortedDates[sortedDates.length - 1] : null;
    const latestPrice = latestDate ? (convertedMap.get(latestDate) ?? 0) : 0;

    return {
      assetId: h.asset_id,
      weight: Number(h.target_weight_pct),
      priceMap: convertedMap,
      firstPrice,
      latestPrice,
    };
  });

  if (enriched.length === 0) return { history: [], holdingReturns: [] };

  const allDates = [...new Set(enriched.flatMap((e) => [...e.priceMap.keys()]))]
    .filter((d) => d >= startDate)
    .sort();
  if (allDates.length === 0) return { history: [], holdingReturns: [] };

  const totalWeight = enriched.reduce((s, e) => s + e.weight, 0);
  if (totalWeight === 0) return { history: [], holdingReturns: [] };

  const lastSeenPrice = new Map<string, number>();
  const indexValues: number[] = [];

  for (const date of allDates) {
    let indexValue = 0;
    let weightAccum = 0;
    for (const e of enriched) {
      const price = e.priceMap.get(date) ?? lastSeenPrice.get(e.assetId) ?? 0;
      if (price > 0) lastSeenPrice.set(e.assetId, price);
      if (price > 0 && e.firstPrice > 0) {
        indexValue += (e.weight / totalWeight) * (price / e.firstPrice) * 100;
        weightAccum += e.weight / totalWeight;
      }
    }
    indexValues.push(weightAccum > 0 ? indexValue / weightAccum : 0);
  }

  const history = allDates.map((date, i) => {
    const index_value = indexValues[i];
    const return_pct = index_value - 100;
    const daily_return_pct =
      i > 0 && indexValues[i - 1] > 0
        ? ((index_value / indexValues[i - 1]) - 1) * 100
        : null;
    return { date, index_value, return_pct, daily_return_pct };
  });

  const holdingReturns = enriched.map((e) => {
    const cumulative_return_pct =
      e.firstPrice > 0 && e.latestPrice > 0
        ? (e.latestPrice / e.firstPrice - 1) * 100
        : 0;
    const contribution_pct = cumulative_return_pct * (e.weight / 100);
    return {
      asset_id: e.assetId,
      cumulative_return_pct,
      contribution_pct,
      base_price: e.firstPrice,
      latest_price: e.latestPrice,
    };
  });

  return { history, holdingReturns };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  // body 로 portfolioId 또는 simulationId 단일 처리 가능
  let targetPortfolioId: string | null = null;
  let targetSimulationId: string | null = null;
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json();
      targetPortfolioId = body?.portfolioId ?? null;
      targetSimulationId = body?.simulationId ?? null;
    }
  } catch {
    // body 없으면 전체 처리
  }

  const fxByDate = new Map<string, Map<string, number>>();
  const { data: fxHistory } = await admin
    .from('fx_rates_history')
    .select('base, quote, date, rate');
  for (const row of (fxHistory ?? []) as Array<{ base: string; quote: string; date: string; rate: number }>) {
    const key = `${row.base}->${row.quote}`;
    const dateMap = fxByDate.get(row.date) ?? new Map<string, number>();
    dateMap.set(key, Number(row.rate));
    fxByDate.set(row.date, dateMap);
  }

  const fxFallback = new Map<string, number>();
  const { data: fxLatest } = await admin.from('fx_rates').select('base, quote, rate');
  for (const row of (fxLatest ?? []) as Array<{ base: string; quote: string; rate: number }>) {
    fxFallback.set(`${row.base}->${row.quote}`, Number(row.rate));
  }

  // ACTIVE simulation 조회 (portfolio_holdings 와 가격 시계열 포함)
  let query = admin
    .from('simulations')
    .select(
      `simulation_id,
      portfolio_id,
      started_at,
      base_currency,
      portfolios!inner (
        portfolio_holdings (
          asset_id, target_weight_pct,
          assets (
            market,
            asset_prices ( range, points )
          )
        )
      )`
    )
    .eq('status', 'ACTIVE');

  if (targetSimulationId) {
    query = query.eq('simulation_id', targetSimulationId);
  } else if (targetPortfolioId) {
    query = query.eq('portfolio_id', targetPortfolioId);
  }

  const { data: simulations, error: fetchError } = await query;

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const sim of (simulations ?? []) as unknown as SimulationRowTypes[]) {
    try {
      const holdings = sim.portfolios?.portfolio_holdings ?? [];
      if (holdings.length === 0) {
        skipped++;
        continue;
      }

      const baseCurrency = sim.base_currency ?? 'KRW';
      const kstDate = new Date(new Date(sim.started_at).getTime() + 9 * 60 * 60 * 1000);
      const startDate = kstDate.toISOString().slice(0, 10);

      const { history, holdingReturns } = calcWeightedIndex(
        holdings,
        startDate,
        baseCurrency,
        fxByDate,
        fxFallback
      );

      if (history.length === 0) {
        console.log(`skip simulation ${sim.simulation_id}: 시작일 이후 가격 데이터 없음`);
        skipped++;
        continue;
      }

      // 시작일 이전 데이터가 있을 때만 정리
      const { data: oldestRow } = await admin
        .from('simulation_value_history')
        .select('date')
        .eq('simulation_id', sim.simulation_id)
        .lt('date', startDate)
        .limit(1);

      if (oldestRow && oldestRow.length > 0) {
        await admin
          .from('simulation_value_history')
          .delete()
          .eq('simulation_id', sim.simulation_id)
          .lt('date', startDate);
      }

      const rows: HistoryRowTypes[] = history.map((h) => ({
        simulation_id: sim.simulation_id,
        date: h.date,
        index_value: h.index_value,
        return_pct: h.return_pct,
        daily_return_pct: h.daily_return_pct,
      }));

      const { error: upsertError } = await admin
        .from('simulation_value_history')
        .upsert(rows, { onConflict: 'simulation_id,date' });

      if (upsertError) {
        errors.push(`[${sim.simulation_id}] value_history upsert 실패: ${upsertError.message}`);
        continue;
      }

      const computedAt = new Date().toISOString();
      const holdingRows: HoldingReturnRowTypes[] = holdingReturns.map((h) => ({
        simulation_id: sim.simulation_id,
        asset_id: h.asset_id,
        cumulative_return_pct: h.cumulative_return_pct,
        contribution_pct: h.contribution_pct,
        base_price: h.base_price || null,
        latest_price: h.latest_price || null,
        computed_at: computedAt,
      }));

      const { error: holdingUpsertError } = await admin
        .from('simulation_holding_returns')
        .upsert(holdingRows, { onConflict: 'simulation_id,asset_id' });

      if (holdingUpsertError) {
        errors.push(`[${sim.simulation_id}] holding_returns upsert 실패: ${holdingUpsertError.message}`);
        continue;
      }

      const latestReturnPct = history[history.length - 1].return_pct;
      const { error: updateError } = await admin
        .from('simulations')
        .update({ total_return_pct: latestReturnPct })
        .eq('simulation_id', sim.simulation_id);

      if (updateError) {
        errors.push(`[${sim.simulation_id}] total_return_pct 갱신 실패: ${updateError.message}`);
        continue;
      }

      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${sim.simulation_id}] 처리 중 오류: ${msg}`);
    }
  }

  const hasFailure = errors.length > 0 || (processed === 0 && skipped === 0);
  const status = hasFailure ? 500 : 200;

  return new Response(JSON.stringify({ processed, skipped, errors }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});
