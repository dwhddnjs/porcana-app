// 추가 입금 실행: simulation_holdings의 quantity/avg_price 업데이트, simulations.seed_money 증가

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

type SimHoldingRowTypes = {
  asset_id: string;
  quantity: number;
  avg_price: number;
  assets: { ticker: string; name: string };
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

  const { data: sim, error: simErr } = await userClient
    .from('simulations')
    .select('simulation_id, seed_money, base_currency')
    .eq('portfolio_id', portfolioId)
    .single();

  if (simErr || !sim) return jsonRes({ error: 'simulation not found' }, 404);

  const { data: simHoldings, error: shErr } = await userClient
    .from('simulation_holdings')
    .select('asset_id, quantity, avg_price, assets ( ticker, name )')
    .eq('simulation_id', sim.simulation_id);

  if (shErr) return jsonRes({ error: shErr.message }, 500);

  const holdings = (simHoldings ?? []) as unknown as SimHoldingRowTypes[];

  const updatedItems = [];
  let totalPurchaseAmount = 0;
  const upsertRows = [];

  for (const purchase of purchases) {
    const existing = holdings.find((h) => h.asset_id === purchase.assetId);
    const prevQty = Number(existing?.quantity ?? 0);
    const prevAvg = Number(existing?.avg_price ?? 0);
    const addedQty = purchase.quantity;
    const purchaseAmount = addedQty * purchase.purchasePrice;
    const newQty = prevQty + addedQty;
    const newAvg =
      newQty > 0 ? (prevQty * prevAvg + purchaseAmount) / newQty : purchase.purchasePrice;

    totalPurchaseAmount += purchaseAmount;

    upsertRows.push({
      simulation_id: sim.simulation_id,
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
    .from('simulation_holdings')
    .upsert(upsertRows, { onConflict: 'simulation_id,asset_id' });
  if (upsertErr) return jsonRes({ error: upsertErr.message }, 500);

  const remaining = additionalCash - totalPurchaseAmount;
  const seedMoney = Number(sim.seed_money ?? 0);

  if (addRemainingCashToBaseline) {
    const { error: updateErr } = await admin
      .from('simulations')
      .update({ seed_money: seedMoney + additionalCash })
      .eq('simulation_id', sim.simulation_id);
    if (updateErr) return jsonRes({ error: updateErr.message }, 500);
  }

  return jsonRes({
    portfolioId,
    simulationId: sim.simulation_id,
    baseCurrency: sim.base_currency ?? 'KRW',
    summary: {
      additionalCash,
      totalPurchaseAmount,
      remainingCash: remaining,
    },
    updatedItems,
  });
});
