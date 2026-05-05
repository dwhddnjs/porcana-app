// 리벨런싱 필요 여부 판단: holding-baseline 기반으로 각 자산의 비중 편차 계산

// @ts-expect-error Deno 표준 라이브러리
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error Supabase Edge Functions npm specifier
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: { env: { get: (k: string) => string | undefined } };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const marketToCurrency = (market: string) => (market === 'US' ? 'USD' : 'KRW');

type HoldingRowTypes = {
  asset_id: string;
  quantity: number | null;
  avg_price: number | null;
  target_weight_pct: number;
  assets: {
    ticker: string;
    name: string;
    market: string;
    asset_prices: { range: string; current_price: number | null }[];
  };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const authHeader = req.headers.get('Authorization') ?? '';
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return jsonRes({ error: 'unauthorized' }, 401);

  const { portfolioId, thresholdPct = 5 } = await req.json();
  if (!portfolioId) return jsonRes({ error: 'portfolioId required' }, 400);

  const { data: portfolio, error: pErr } = await client
    .from('portfolios')
    .select(
      `portfolio_id, seed_money, base_currency,
      portfolio_holdings (
        asset_id, quantity, avg_price, target_weight_pct,
        assets ( ticker, name, market,
          asset_prices ( range, current_price )
        )
      )`
    )
    .eq('portfolio_id', portfolioId)
    .single();

  if (pErr || !portfolio) return jsonRes({ error: pErr?.message ?? 'not found' }, 404);

  const baseCurrency = portfolio.base_currency ?? 'KRW';

  if (!portfolio.seed_money) {
    return jsonRes({
      portfolioId,
      hasBaseline: false,
      needsRebalancing: false,
      checkedAt: new Date().toISOString(),
      thresholdPct,
      baseCurrency,
      summary: { totalAssets: 0, overThresholdCount: 0 },
      items: [],
    });
  }

  const { data: fxRow } = await client
    .from('fx_rates')
    .select('rate')
    .eq('base', 'USD')
    .eq('quote', 'KRW')
    .single();
  const usdToKrw = Number(fxRow?.rate ?? 1380);

  const holdings = (portfolio.portfolio_holdings ?? []) as unknown as HoldingRowTypes[];

  const enriched = holdings.map((h) => {
    const rawPrice = Number(h.assets.asset_prices?.find((p) => p.range === '1M')?.current_price ?? 0);
    const assetCurrency = marketToCurrency(h.assets.market);
    let currentPrice = rawPrice;
    if (assetCurrency !== baseCurrency) {
      currentPrice = baseCurrency === 'KRW' ? rawPrice * usdToKrw : rawPrice / usdToKrw;
    }
    const qty = Number(h.quantity ?? 0);
    return {
      assetId: h.asset_id,
      symbol: h.assets.ticker,
      name: h.assets.name,
      targetWeightPct: Number(h.target_weight_pct),
      currentValue: qty * currentPrice,
    };
  });

  const totalValue = enriched.reduce((s, i) => s + i.currentValue, 0);

  if (totalValue === 0) {
    return jsonRes({
      portfolioId,
      hasBaseline: false,
      needsRebalancing: false,
      checkedAt: new Date().toISOString(),
      thresholdPct,
      baseCurrency,
      summary: { totalAssets: 0, overThresholdCount: 0 },
      items: [],
    });
  }

  const items = enriched.map((e) => {
    const currentWeightPct = (e.currentValue / totalValue) * 100;
    const deviationPct = Math.abs(currentWeightPct - e.targetWeightPct);
    return {
      assetId: e.assetId,
      symbol: e.symbol,
      name: e.name,
      targetWeightPct: e.targetWeightPct,
      currentWeightPct,
      deviationPct,
      overThreshold: deviationPct > thresholdPct,
    };
  });

  const overThresholdCount = items.filter((i) => i.overThreshold).length;

  return jsonRes({
    portfolioId,
    hasBaseline: true,
    needsRebalancing: overThresholdCount > 0,
    checkedAt: new Date().toISOString(),
    thresholdPct,
    baseCurrency,
    summary: { totalAssets: items.length, overThresholdCount },
    items,
  });
});
