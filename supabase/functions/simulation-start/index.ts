// 모의투자 시작/확정: simulations + simulation_holdings 에 기록
// (portfolios / portfolio_holdings 의 데이터는 건드리지 않음)

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

type HoldingRowTypes = {
  holding_id: string;
  asset_id: string;
  target_weight_pct: number;
  assets: {
    ticker: string;
    name: string;
    market: string;
    image_url: string | null;
    website_domain: string | null;
    asset_prices: { range: string; current_price: number | null; currency: string | null }[];
  };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authHeader = req.headers.get('Authorization') ?? '';

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonRes({ error: 'unauthorized' }, 401);

  const { portfolioId, seedMoney, baseCurrency = 'KRW' } = await req.json();
  if (!portfolioId || !seedMoney) return jsonRes({ error: 'portfolioId, seedMoney required' }, 400);

  const { data: portfolio, error: pErr } = await userClient
    .from('portfolios')
    .select(
      `portfolio_id, user_id,
      portfolio_holdings (
        holding_id, asset_id, target_weight_pct,
        assets ( ticker, name, market, image_url, website_domain,
          asset_prices ( range, current_price, currency )
        )
      )`
    )
    .eq('portfolio_id', portfolioId)
    .single();

  if (pErr || !portfolio) return jsonRes({ error: pErr?.message ?? 'not found' }, 404);

  const { data: fxRow } = await userClient
    .from('fx_rates')
    .select('rate')
    .eq('base', 'USD')
    .eq('quote', 'KRW')
    .single();
  const usdToKrw = Number(fxRow?.rate ?? 1380);

  const holdings = (portfolio.portfolio_holdings ?? []) as unknown as HoldingRowTypes[];

  const items = holdings.map((h) => {
    const prices = h.assets.asset_prices ?? [];
    const rawPrice = Number(prices.find((p) => p.range === '1M')?.current_price ?? 0);
    const assetCurrency = marketToCurrency(h.assets.market);

    let priceInBase = rawPrice;
    if (assetCurrency !== baseCurrency) {
      priceInBase = baseCurrency === 'KRW' ? rawPrice * usdToKrw : rawPrice / usdToKrw;
    }

    const weight = Number(h.target_weight_pct);
    const quantity = priceInBase > 0 ? Math.floor((seedMoney * (weight / 100)) / priceInBase) : 0;

    return {
      holdingId: h.holding_id,
      assetId: h.asset_id,
      symbol: h.assets.ticker,
      name: h.assets.name,
      market: h.assets.market,
      quantity,
      avgPrice: priceInBase,
      targetWeightPct: weight,
      currentPrice: priceInBase,
      currentValue: quantity * priceInBase,
      imageUrl: resolveImageUrl(h.assets.market, h.assets.ticker, h.assets.website_domain, h.assets.image_url),
    };
  });

  const nowIso = new Date().toISOString();

  // simulations upsert (portfolio_id unique). 기존 row 있으면 재시작 동작.
  const { data: simRow, error: simErr } = await admin
    .from('simulations')
    .upsert(
      {
        portfolio_id: portfolioId,
        user_id: user.id,
        seed_money: seedMoney,
        base_currency: baseCurrency,
        status: 'ACTIVE',
        total_return_pct: 0,
        started_at: nowIso,
        ended_at: null,
      },
      { onConflict: 'portfolio_id' }
    )
    .select('simulation_id')
    .single();
  if (simErr || !simRow) return jsonRes({ error: simErr?.message ?? 'simulation upsert failed' }, 500);

  const simulationId = simRow.simulation_id as string;

  // 기존 holdings 삭제 후 재삽입 (자산 비중이 바뀌었을 수 있음)
  await admin.from('simulation_holdings').delete().eq('simulation_id', simulationId);

  const insertRows = items
    .filter((item) => item.quantity > 0 || item.avgPrice > 0)
    .map((item) => ({
      simulation_id: simulationId,
      asset_id: item.assetId,
      quantity: item.quantity,
      avg_price: item.avgPrice,
    }));

  if (insertRows.length > 0) {
    const { error: insertErr } = await admin.from('simulation_holdings').insert(insertRows);
    if (insertErr) return jsonRes({ error: insertErr.message }, 500);
  }

  // 이전 모의투자의 수익률/시계열은 리셋
  await admin.from('simulation_value_history').delete().eq('simulation_id', simulationId);
  await admin.from('simulation_holding_returns').delete().eq('simulation_id', simulationId);

  const totalValue = items.reduce((s, i) => s + i.currentValue, 0);

  return jsonRes({
    exists: true,
    simulationId,
    portfolioId,
    sourceType: 'MANUAL',
    baseCurrency,
    seedMoney,
    totalValue,
    cashAmount: seedMoney - totalValue,
    confirmedAt: nowIso,
    items: items.map(({ holdingId: _h, ...rest }) => rest),
  });
});
