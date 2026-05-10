// 시드머니 미리보기: DB write 없이 자산별 매수 수량 계산 (환율 적용)

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
  const authHeader = req.headers.get('Authorization') ?? '';
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return jsonRes({ error: 'unauthorized' }, 401);

  const { portfolioId, seedMoney, baseCurrency = 'KRW' } = await req.json();
  if (!portfolioId || !seedMoney) return jsonRes({ error: 'portfolioId, seedMoney required' }, 400);

  const { data: portfolio, error: pErr } = await client
    .from('portfolios')
    .select(
      `portfolio_id,
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
    const priceRow = prices.find((p) => p.range === '1M');
    const rawPrice = Number(priceRow?.current_price ?? 0);
    const assetCurrency = marketToCurrency(h.assets.market);

    let priceInBase = rawPrice;
    if (assetCurrency !== baseCurrency) {
      priceInBase = baseCurrency === 'KRW' ? rawPrice * usdToKrw : rawPrice / usdToKrw;
    }

    const weight = Number(h.target_weight_pct);
    const quantity = priceInBase > 0 ? Math.floor((seedMoney * (weight / 100)) / priceInBase) : 0;
    const currentValue = quantity * priceInBase;

    return {
      assetId: h.asset_id,
      symbol: h.assets.ticker,
      name: h.assets.name,
      market: h.assets.market,
      quantity,
      avgPrice: priceInBase,
      targetWeightPct: weight,
      currentPrice: priceInBase,
      currentValue,
      imageUrl: resolveImageUrl(h.assets.market, h.assets.ticker, h.assets.website_domain, h.assets.image_url),
    };
  });

  const totalValue = items.reduce((s, i) => s + i.currentValue, 0);

  return jsonRes({
    exists: false,
    baselineId: '',
    portfolioId,
    sourceType: 'MANUAL',
    baseCurrency,
    seedMoney,
    totalValue,
    cashAmount: seedMoney - totalValue,
    confirmedAt: '',
    items,
  });
});
