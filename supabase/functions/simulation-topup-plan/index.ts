// 추가 입금 추천안: simulation_holdings 기반으로 목표 비중 달성을 위한 매수 수량 계산

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

const resolveImageUrl = (
  market: string,
  ticker: string,
  websiteDomain: string | null,
  imageUrl: string | null
): string | string[] => {
  if (market === 'US') return imageUrl ?? `https://assets.parqet.com/logos/symbol/${ticker}`;
  if (websiteDomain) {
    const urls: string[] = [];
    if (imageUrl) urls.push(imageUrl);
    urls.push(
      `https://logo.clearbit.com/${websiteDomain}`,
      `https://unavatar.io/${websiteDomain}`,
      `https://www.google.com/s2/favicons?domain=${websiteDomain}&sz=128`
    );
    return [...new Set(urls)];
  }
  return imageUrl ?? '';
};

type SimHoldingRowTypes = {
  asset_id: string;
  quantity: number;
  avg_price: number;
  assets: {
    ticker: string;
    name: string;
    market: string;
    image_url: string | null;
    website_domain: string | null;
    asset_prices: { range: string; current_price: number | null }[];
  };
};

type PholdingRowTypes = {
  asset_id: string;
  target_weight_pct: number;
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

  const { portfolioId, additionalCash } = await req.json();
  if (!portfolioId || additionalCash == null) {
    return jsonRes({ error: 'portfolioId, additionalCash required' }, 400);
  }

  const { data: sim, error: simErr } = await client
    .from('simulations')
    .select('simulation_id, seed_money, base_currency')
    .eq('portfolio_id', portfolioId)
    .single();

  if (simErr || !sim) return jsonRes({ error: 'simulation not found' }, 404);

  const baseCurrency = sim.base_currency ?? 'KRW';

  const { data: simHoldings, error: shErr } = await client
    .from('simulation_holdings')
    .select(
      `asset_id, quantity, avg_price,
      assets ( ticker, name, market, image_url, website_domain,
        asset_prices ( range, current_price )
      )`
    )
    .eq('simulation_id', sim.simulation_id);

  if (shErr) return jsonRes({ error: shErr.message }, 500);

  const { data: phRows } = await client
    .from('portfolio_holdings')
    .select('asset_id, target_weight_pct')
    .eq('portfolio_id', portfolioId);

  const targetWeightMap = new Map<string, number>(
    (phRows ?? []).map((r: PholdingRowTypes) => [r.asset_id, Number(r.target_weight_pct)])
  );

  const { data: fxRow } = await client
    .from('fx_rates')
    .select('rate')
    .eq('base', 'USD')
    .eq('quote', 'KRW')
    .single();
  const usdToKrw = Number(fxRow?.rate ?? 1380);

  const holdings = (simHoldings ?? []) as unknown as SimHoldingRowTypes[];

  const enriched = holdings.map((h) => {
    const rawPrice = Number(
      h.assets.asset_prices?.find((p) => p.range === '1M')?.current_price ?? 0
    );
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
      market: h.assets.market,
      targetWeightPct: targetWeightMap.get(h.asset_id) ?? 0,
      currentPrice,
      currentValue: qty * currentPrice,
      imageUrl: resolveImageUrl(
        h.assets.market,
        h.assets.ticker,
        h.assets.website_domain,
        h.assets.image_url
      ),
    };
  });

  const currentTotalValue = enriched.reduce((s, e) => s + e.currentValue, 0);
  const newTotal = currentTotalValue + additionalCash;

  const recommendations = enriched
    .map((e) => {
      const currentWeightPct =
        currentTotalValue > 0 ? (e.currentValue / currentTotalValue) * 100 : 0;
      const targetValue = newTotal * (e.targetWeightPct / 100);
      const diff = targetValue - e.currentValue;

      if (diff <= 0 || e.currentPrice === 0) return null;

      const recommendedQuantity = Math.floor(diff / e.currentPrice);
      if (recommendedQuantity === 0) return null;

      const recommendedAmount = recommendedQuantity * e.currentPrice;
      const weightAfterBuy =
        ((e.currentValue + recommendedAmount) / (currentTotalValue + recommendedAmount)) * 100;

      return {
        assetId: e.assetId,
        symbol: e.symbol,
        name: e.name,
        market: e.market,
        targetWeightPct: e.targetWeightPct,
        currentWeightPct,
        weightAfterBuy,
        currentPrice: e.currentPrice,
        recommendedQuantity,
        recommendedAmount,
        reason: '목표 비중 달성',
        imageUrl: e.imageUrl,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const totalRecommended = recommendations.reduce((s, r) => s + r.recommendedAmount, 0);

  return jsonRes({
    portfolioId,
    simulationId: sim.simulation_id,
    additionalCash,
    baseCurrency,
    currentTotalValue,
    newTotalValue: newTotal,
    remainingCash: additionalCash - totalRecommended,
    recommendations,
  });
});
