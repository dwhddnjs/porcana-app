// Yahoo Finance v8 API 직접 호출 - US/KR 주가 데이터 (키 불필요)
// KR 심볼: ticker.KS (KOSPI) / ticker.KQ (KOSDAQ)
// pg_cron에서 KST 10:00 / 23:00 (UTC 01:00 / 14:00)에 호출됨.

// @ts-expect-error Deno 표준 라이브러리
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error Supabase Edge Functions npm specifier
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: { env: { get: (k: string) => string | undefined } };

type AssetRowTypes = {
  asset_id: string;
  ticker: string;
  market: 'US' | 'KR';
};

type RangeTypes = '1M' | '3M' | '1Y';
type PricePointTypes = { t: string; o: number; h: number; l: number; c: number; v: number };

const RANGES: { range: RangeTypes; months: number }[] = [
  { range: '1M', months: 1 },
  { range: '3M', months: 3 },
  { range: '1Y', months: 12 },
];

const CHUNK_SIZE = 10;
const CHUNK_DELAY_MS = 300;

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const toYahooSymbol = (ticker: string, market: 'US' | 'KR'): string => {
  if (market === 'US') return ticker;
  return `${ticker}.KS`; // KOSPI ETF/주식; KOSDAQ은 .KQ
};

const monthsAgo = (months: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
};

const fetchYahooHistory = async (symbol: string): Promise<PricePointTypes[]> => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y&includePrePost=false`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    const errMsg = json?.chart?.error?.description ?? 'empty response';
    throw new Error(errMsg);
  }

  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const opens: (number | null)[] = quote.open ?? [];
  const highs: (number | null)[] = quote.high ?? [];
  const lows: (number | null)[] = quote.low ?? [];
  const closes: (number | null)[] = quote.close ?? [];
  const volumes: (number | null)[] = quote.volume ?? [];

  return timestamps
    .map((ts, i) => ({
      t: new Date(ts * 1000).toISOString().slice(0, 10),
      o: opens[i],
      h: highs[i],
      l: lows[i],
      c: closes[i],
      v: volumes[i] ?? 0,
    }))
    .filter(
      (p): p is PricePointTypes =>
        p.c !== null && !isNaN(p.c) && p.o !== null && !isNaN(p.o)
    );
};

const sliceByMonths = (points: PricePointTypes[], months: number): PricePointTypes[] => {
  const cutoff = monthsAgo(months);
  return points.filter((p) => p.t >= cutoff);
};

serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: assets, error: assetsError } = await admin
    .from('assets')
    .select('asset_id, ticker, market');

  if (assetsError || !assets) {
    return new Response(JSON.stringify({ error: assetsError?.message ?? 'no assets' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let okCount = 0;
  const failures: { symbol: string; error: string }[] = [];

  for (const batch of chunk(assets as AssetRowTypes[], CHUNK_SIZE)) {
    await Promise.all(
      batch.map(async (asset) => {
        const symbol = toYahooSymbol(asset.ticker, asset.market);
        try {
          const allPoints = await fetchYahooHistory(symbol);
          if (allPoints.length === 0) throw new Error('empty response');

          const currency = asset.market === 'KR' ? 'KRW' : 'USD';

          await Promise.all(
            RANGES.map(async ({ range, months }) => {
              const points = sliceByMonths(allPoints, months);
              const currentPrice = points.length ? points[points.length - 1].c : null;

              const { error: upsertError } = await admin.from('asset_prices').upsert(
                {
                  asset_id: asset.asset_id,
                  range,
                  points,
                  current_price: currentPrice,
                  currency,
                  fetched_at: new Date().toISOString(),
                },
                { onConflict: 'asset_id,range' }
              );
              if (upsertError) throw upsertError;
              okCount += 1;
            })
          );
        } catch (err) {
          failures.push({
            symbol,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })
    );
    await sleep(CHUNK_DELAY_MS);
  }

  return new Response(
    JSON.stringify({
      assets: assets.length,
      ok: okCount,
      failed: failures.length,
      failures: failures.slice(0, 20),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
