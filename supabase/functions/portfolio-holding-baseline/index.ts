// 보유 자산 현황 조회: 저장된 quantity/avg_price 기준, 현재가에 환율 적용

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
  asset_id: string;
  quantity: number | null;
  avg_price: number | null;
  target_weight_pct: number;
  assets: {
    ticker: string;
    name: string;
    market: string;
    image_url: string | null;
    website_domain: string | null;
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

  const { portfolioId } = await req.json();
  if (!portfolioId) return jsonRes({ error: 'portfolioId required' }, 400);

  const { data: portfolio, error: pErr } = await client
    .from('portfolios')
    .select(
      `portfolio_id, seed_money, base_currency,
      portfolio_holdings (
        asset_id, quantity, avg_price, target_weight_pct,
        assets ( ticker, name, market, image_url, website_domain,
          asset_prices ( range, current_price )
        )
      )`
    )
    .eq('portfolio_id', portfolioId)
    .single();

  if (pErr || !portfolio) return jsonRes({ error: pErr?.message ?? 'not found' }, 404);

  const baseCurrency = portfolio.base_currency ?? 'KRW';
  const seedMoney = Number(portfolio.seed_money ?? 0);

  if (!portfolio.seed_money) {
    return jsonRes({
      exists: false,
      baselineId: '',
      portfolioId,
      sourceType: '',
      baseCurrency,
      seedMoney: 0,
      totalValue: 0,
      cashAmount: 0,
      confirmedAt: '',
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

  const items = holdings.map((h) => {
    const prices = h.assets.asset_prices ?? [];
    const rawPrice = Number(prices.find((p) => p.range === '1M')?.current_price ?? 0);
    const assetCurrency = marketToCurrency(h.assets.market);

    let currentPrice = rawPrice;
    if (assetCurrency !== baseCurrency) {
      currentPrice = baseCurrency === 'KRW' ? rawPrice * usdToKrw : rawPrice / usdToKrw;
    }

    const qty = Number(h.quantity ?? 0);
    const avgPrice = Number(h.avg_price ?? 0);

    return {
      assetId: h.asset_id,
      symbol: h.assets.ticker,
      name: h.assets.name,
      market: h.assets.market,
      quantity: qty,
      avgPrice,
      targetWeightPct: Number(h.target_weight_pct),
      currentPrice,
      currentValue: qty * currentPrice,
      imageUrl: resolveImageUrl(h.assets.market, h.assets.ticker, h.assets.website_domain, h.assets.image_url),
    };
  });

  const totalValue = items.reduce((s, i) => s + i.currentValue, 0);
  const totalCostBasis = items.reduce((s, i) => s + i.quantity * i.avgPrice, 0);

  return jsonRes({
    exists: true,
    baselineId: portfolioId,
    portfolioId,
    sourceType: 'MANUAL',
    baseCurrency,
    seedMoney,
    totalValue,
    cashAmount: seedMoney - totalCostBasis,
    confirmedAt: '',
    items,
  });
});
