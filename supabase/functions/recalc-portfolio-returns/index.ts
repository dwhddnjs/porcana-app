// 포트폴리오 수익률 재계산: asset_prices 갱신 후 pg_cron으로 호출
// - ACTIVE 포트폴리오(또는 특정 portfolioId)의 일별 가중 지수를 portfolio_value_history에 upsert
// - portfolios.total_return_pct 갱신

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
    asset_prices: { range: string; points: PricePointTypes[] }[];
  };
};

type PortfolioRowTypes = {
  portfolio_id: string;
  created_at: string;
  portfolio_holdings: HoldingRowTypes[];
};

type HistoryRowTypes = {
  portfolio_id: string;
  date: string;
  index_value: number;
  return_pct: number;
  daily_return_pct: number | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const calcWeightedIndex = (
  holdings: HoldingRowTypes[],
  createdDate: string // YYYY-MM-DD: 이 날짜 이후만 계산, 이 날의 가격이 기준(100)
): { date: string; index_value: number; return_pct: number; daily_return_pct: number | null }[] => {
  const enriched = holdings.map((h) => {
    const range1Y = (h.assets?.asset_prices ?? []).find((p) => p.range === '1Y');
    const points: PricePointTypes[] = range1Y?.points ?? [];
    const priceMap = new Map<string, number>();
    points.forEach((p) => priceMap.set(p.t, p.c));

    // 생성일 또는 그 이전 가장 가까운 거래일의 종가를 기준 가격으로 사용
    const sortedDates = [...priceMap.keys()].sort();
    const onOrBefore = sortedDates.filter((d) => d <= createdDate);
    const baseDate = onOrBefore.length ? onOrBefore[onOrBefore.length - 1] : null;
    const firstPrice = baseDate ? (priceMap.get(baseDate) ?? 0) : 0;

    return { weight: Number(h.target_weight_pct), priceMap, firstPrice };
  });

  if (enriched.length === 0) return [];

  // 생성일 이후 날짜만, 한 종목 이상에 가격이 있는 모든 거래일 사용 (union)
  const allDates = [...new Set(enriched.flatMap((e) => [...e.priceMap.keys()]))]
    .filter((d) => d >= createdDate)
    .sort();
  if (allDates.length === 0) return [];

  const totalWeight = enriched.reduce((s, e) => s + e.weight, 0);
  if (totalWeight === 0) return [];

  const indexValues: number[] = [];

  for (const date of allDates) {
    let indexValue = 0;
    let weightAccum = 0;
    for (const e of enriched) {
      const price = e.priceMap.get(date);
      if (price && e.firstPrice > 0) {
        indexValue += (e.weight / totalWeight) * (price / e.firstPrice) * 100;
        weightAccum += e.weight / totalWeight;
      }
    }
    indexValues.push(weightAccum > 0 ? indexValue / weightAccum : 0);
  }

  return allDates.map((date, i) => {
    const index_value = indexValues[i];
    const return_pct = index_value - 100;
    const daily_return_pct =
      i > 0 && indexValues[i - 1] > 0
        ? ((index_value / indexValues[i - 1]) - 1) * 100
        : null;
    return { date, index_value, return_pct, daily_return_pct };
  });
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  let targetPortfolioId: string | null = null;
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json();
      targetPortfolioId = body?.portfolioId ?? null;
    }
  } catch {
    // body 없으면 전체 처리
  }

  // ACTIVE 포트폴리오 조회 (created_at 포함)
  let query = admin
    .from('portfolios')
    .select(
      `portfolio_id,
      created_at,
      portfolio_holdings (
        asset_id, target_weight_pct,
        assets (
          asset_prices ( range, points )
        )
      )`
    )
    .eq('status', 'ACTIVE');

  if (targetPortfolioId) {
    query = query.eq('portfolio_id', targetPortfolioId);
  }

  const { data: portfolios, error: fetchError } = await query;

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const portfolio of (portfolios ?? []) as unknown as PortfolioRowTypes[]) {
    try {
      const holdings = portfolio.portfolio_holdings ?? [];
      if (holdings.length === 0) {
        skipped++;
        continue;
      }

      const createdDate = portfolio.created_at.slice(0, 10);
      const history = calcWeightedIndex(holdings, createdDate);
      if (history.length === 0) {
        console.log(`skip portfolio ${portfolio.portfolio_id}: 생성일 이후 가격 데이터 없음`);
        skipped++;
        continue;
      }

      // 생성일 이전에 잘못 쌓인 백테스트 데이터 정리
      await admin
        .from('portfolio_value_history')
        .delete()
        .eq('portfolio_id', portfolio.portfolio_id)
        .lt('date', createdDate);

      const rows: HistoryRowTypes[] = history.map((h) => ({
        portfolio_id: portfolio.portfolio_id,
        date: h.date,
        index_value: h.index_value,
        return_pct: h.return_pct,
        daily_return_pct: h.daily_return_pct,
      }));

      const { error: upsertError } = await admin
        .from('portfolio_value_history')
        .upsert(rows, { onConflict: 'portfolio_id,date' });

      if (upsertError) {
        errors.push(`[${portfolio.portfolio_id}] upsert 실패: ${upsertError.message}`);
        continue;
      }

      const latestReturnPct = history[history.length - 1].return_pct;
      const { error: updateError } = await admin
        .from('portfolios')
        .update({ total_return_pct: latestReturnPct })
        .eq('portfolio_id', portfolio.portfolio_id);

      if (updateError) {
        errors.push(`[${portfolio.portfolio_id}] total_return_pct 갱신 실패: ${updateError.message}`);
        continue;
      }

      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${portfolio.portfolio_id}] 처리 중 오류: ${msg}`);
    }
  }

  return new Response(JSON.stringify({ processed, skipped, errors }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});
