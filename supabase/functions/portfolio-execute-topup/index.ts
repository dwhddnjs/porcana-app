// 추가 입금 실행: holdings.quantity/avg_price 업데이트, 옵션으로 seed_money 증가

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

type PurchaseItemTypes = {
  assetId: string;
  quantity: number;
  purchasePrice: number;
};

type HoldingRowTypes = {
  asset_id: string;
  quantity: number | null;
  avg_price: number | null;
  target_weight_pct: number;
  assets: { ticker: string; name: string; market: string };
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

  const {
    portfolioId,
    additionalCash,
    purchases,
    addRemainingCashToBaseline = false,
  }: {
    portfolioId: string;
    additionalCash: number;
    purchases: PurchaseItemTypes[];
    addRemainingCashToBaseline?: boolean;
  } = await req.json();

  if (!portfolioId || !purchases?.length) {
    return jsonRes({ error: 'portfolioId, purchases required' }, 400);
  }

  const { data: portfolio, error: pErr } = await userClient
    .from('portfolios')
    .select(
      `portfolio_id, seed_money, base_currency,
      portfolio_holdings (
        asset_id, quantity, avg_price, target_weight_pct,
        assets ( ticker, name, market )
      )`
    )
    .eq('portfolio_id', portfolioId)
    .single();

  if (pErr || !portfolio) return jsonRes({ error: pErr?.message ?? 'not found' }, 404);

  const holdings = (portfolio.portfolio_holdings ?? []) as unknown as HoldingRowTypes[];
  const seedMoney = Number(portfolio.seed_money ?? 0);

  const updatedItems = [];
  let totalPurchaseAmount = 0;

  const upsertRows = [];
  for (const purchase of purchases) {
    const existing = holdings.find((h) => h.asset_id === purchase.assetId);
    const prevQty = Number(existing?.quantity ?? 0);
    const prevAvg = Number(existing?.avg_price ?? 0);
    const addedQty = purchase.quantity;
    const newQty = prevQty + addedQty;
    const purchaseAmount = addedQty * purchase.purchasePrice;
    const newAvg =
      newQty > 0 ? (prevQty * prevAvg + purchaseAmount) / newQty : purchase.purchasePrice;

    totalPurchaseAmount += purchaseAmount;

    upsertRows.push({
      portfolio_id: portfolioId,
      asset_id: purchase.assetId,
      quantity: newQty,
      avg_price: newAvg,
    });

    updatedItems.push({
      assetId: purchase.assetId,
      symbol: existing?.assets?.ticker ?? '',
      name: existing?.assets?.name ?? '',
      previousQuantity: prevQty,
      addedQuantity: addedQty,
      newQuantity: newQty,
      previousAvgPrice: prevAvg,
      newAvgPrice: newAvg,
    });
  }

  const { error: upsertErr } = await admin
    .from('portfolio_holdings')
    .upsert(upsertRows, { onConflict: 'portfolio_id,asset_id' });
  if (upsertErr) return jsonRes({ error: upsertErr.message }, 500);

  const remaining = additionalCash - totalPurchaseAmount;
  if (addRemainingCashToBaseline) {
    const { error: updateErr } = await admin
      .from('portfolios')
      .update({ seed_money: seedMoney + additionalCash })
      .eq('portfolio_id', portfolioId);
    if (updateErr) return jsonRes({ error: updateErr.message }, 500);
  }

  const currentTotalValue = holdings.reduce((s, h) => {
    return s;
  }, 0);

  return jsonRes({
    portfolioId,
    baselineId: portfolioId,
    baseCurrency: portfolio.base_currency ?? 'KRW',
    summary: {
      additionalCash,
      totalPurchaseAmount,
      remainingCash: remaining,
      previousTotalValue: currentTotalValue,
      newTotalValue: currentTotalValue + totalPurchaseAmount,
      newCashAmount: seedMoney - currentTotalValue - totalPurchaseAmount + remaining,
    },
    updatedItems,
  });
});
