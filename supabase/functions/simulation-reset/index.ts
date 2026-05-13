// 모의투자 리셋: 해당 포트폴리오의 simulation 데이터 일체를 삭제.
// cascade로 simulation_holdings / value_history / holding_returns 자동 정리.
// 포트폴리오 자체(자산 비중 정의)는 그대로 유지.

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

  const { portfolioId } = await req.json();
  if (!portfolioId) return jsonRes({ error: 'portfolioId required' }, 400);

  // 소유권 검증: simulation 의 user_id 가 본인이어야 함
  const { data: simulation } = await userClient
    .from('simulations')
    .select('simulation_id, user_id')
    .eq('portfolio_id', portfolioId)
    .maybeSingle();

  if (!simulation) {
    return jsonRes({ ok: true, portfolioId, deleted: false });
  }

  if (simulation.user_id !== user.id) return jsonRes({ error: 'forbidden' }, 403);

  const { error: delErr } = await admin
    .from('simulations')
    .delete()
    .eq('simulation_id', simulation.simulation_id);
  if (delErr) return jsonRes({ error: delErr.message }, 500);

  return jsonRes({ ok: true, portfolioId, deleted: true });
});
