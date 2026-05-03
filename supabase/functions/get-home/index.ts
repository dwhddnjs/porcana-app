// 홈 화면 데이터: 메인 포트폴리오 + 보유 종목 + 1Y 차트(가중 지수)
// 차트 = sum(weight * price/firstPrice) / sum(weight) * 100  (기준 100)

// @ts-expect-error Deno 표준 라이브러리
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error Supabase Edge Functions npm specifier
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: { env: { get: (k: string) => string | undefined } };

type PricePointTypes = { t: string; c: number };

type AssetRowTypes = {
  asset_id: string;
  ticker: string;
  name: string;
  image_url: string | null;
  website_domain: string | null;
  asset_prices: { range: string; points: PricePointTypes[]; current_price: number | null }[];
};

type HoldingRowTypes = {
  target_weight_pct: number;
  avg_price: number | null;
  quantity: number | null;
  assets: AssetRowTypes;
};

type PortfolioRowTypes = {
  portfolio_id: string;
  name: string;
  total_return_pct: number | null;
  started_at: string | null;
  portfolio_holdings: HoldingRowTypes[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getImageUrl = (websiteDomain: string | null, imageUrl: string | null): string | null => {
  if (websiteDomain) return `https://logo.clearbit.com/${websiteDomain}`;
  return imageUrl;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const authHeader = req.headers.get('Authorization') ?? '';

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { data: portfolio, error: portfolioError } = await client
    .from('portfolios')
    .select(
      `portfolio_id, name, total_return_pct, started_at,
      portfolio_holdings (
        target_weight_pct, avg_price, quantity,
        assets ( asset_id, ticker, name, image_url, website_domain,
          asset_prices ( range, points, current_price )
        )
      )`
    )
    .eq('user_id', user.id)
    .eq('is_main', true)
    .maybeSingle();

  if (portfolioError) {
    return new Response(JSON.stringify({ error: portfolioError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (!portfolio) {
    return new Response(
      JSON.stringify({
        chart: [],
        hasMainPortfolio: false,
        mainPortfolio: null,
        positions: [],
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const row = portfolio as PortfolioRowTypes;
  const holdings = row.portfolio_holdings ?? [];

  type EnrichedTypes = {
    targetWeightPct: number;
    avgPrice: number | null;
    points: PricePointTypes[];
    currentPrice: number;
    asset: AssetRowTypes;
  };

  const enriched: EnrichedTypes[] = holdings.map((h) => {
    const prices = h.assets.asset_prices ?? [];
    const range1Y = prices.find((p) => p.range === '1Y');
    const points = range1Y?.points ?? [];
    const currentPrice = Number(
      range1Y?.current_price ?? (points.length ? points[points.length - 1].c : 0)
    );
    return {
      targetWeightPct: Number(h.target_weight_pct),
      avgPrice: h.avg_price !== null ? Number(h.avg_price) : null,
      points,
      currentPrice,
      asset: h.assets,
    };
  });

  const positions = enriched.map((h) => {
    const firstPrice = h.points.length ? h.points[0].c : h.currentPrice;
    const returnPct =
      h.avgPrice && h.avgPrice > 0
        ? ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100
        : firstPrice > 0
          ? ((h.currentPrice - firstPrice) / firstPrice) * 100
          : 0;
    return {
      assetId: h.asset.asset_id,
      imageUrl: getImageUrl(h.asset.website_domain, h.asset.image_url),
      name: h.asset.name,
      returnPct,
      ticker: h.asset.ticker,
      weightPct: h.targetWeightPct,
      targetWeightPct: h.targetWeightPct,
    };
  });

  const dateSet = new Set<string>();
  enriched.forEach((h) => h.points.forEach((p) => dateSet.add(p.t)));
  const dates = [...dateSet].sort();

  const priceMaps = enriched.map((h) => {
    const map = new Map<string, number>();
    h.points.forEach((p) => map.set(p.t, p.c));
    return map;
  });

  const firstPrices = enriched.map((h) => (h.points.length ? h.points[0].c : 0));

  const chart = dates
    .map((d) => {
      let value = 0;
      let weightAccum = 0;
      enriched.forEach((h, i) => {
        const price = priceMaps[i].get(d);
        if (price && firstPrices[i] > 0) {
          value += (h.targetWeightPct / 100) * (price / firstPrices[i]) * 100;
          weightAccum += h.targetWeightPct / 100;
        }
      });
      if (weightAccum > 0) value = value / weightAccum;
      return { date: d, value };
    })
    .filter((p) => p.value > 0);

  const computedReturnPct = chart.length ? chart[chart.length - 1].value - 100 : 0;
  const totalReturnPct =
    Number(row.total_return_pct ?? 0) !== 0 ? Number(row.total_return_pct) : computedReturnPct;

  return new Response(
    JSON.stringify({
      chart,
      hasMainPortfolio: true,
      mainPortfolio: {
        name: row.name,
        portfolioId: row.portfolio_id,
        startedAt: row.started_at ?? '',
        totalReturnPct,
      },
      positions,
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
});
