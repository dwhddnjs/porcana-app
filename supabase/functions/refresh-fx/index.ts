// USD/KRW 환율을 open.er-api.com에서 가져와 fx_rates에 upsert
// pg_cron에서 KST 09:00 (UTC 00:00)에 호출됨

// @ts-expect-error Deno 표준 라이브러리
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error Supabase Edge Functions npm specifier
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: { env: { get: (k: string) => string | undefined } };

serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'User-Agent': 'porcana-app/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const krwRate = json?.rates?.KRW;
    if (!krwRate || typeof krwRate !== 'number') throw new Error('KRW rate not found');

    const nowIso = new Date().toISOString();
    const { error } = await admin.from('fx_rates').upsert(
      [
        { base: 'USD', quote: 'KRW', rate: krwRate, fetched_at: nowIso },
        { base: 'KRW', quote: 'USD', rate: 1 / krwRate, fetched_at: nowIso },
      ],
      { onConflict: 'base,quote' }
    );
    if (error) throw error;

    // KST 날짜로 일별 history 추가 (recalc-portfolio-returns에서 사용)
    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { error: histError } = await admin.from('fx_rates_history').upsert(
      [
        { base: 'USD', quote: 'KRW', date: kstDate, rate: krwRate },
        { base: 'KRW', quote: 'USD', date: kstDate, rate: 1 / krwRate },
      ],
      { onConflict: 'base,quote,date' }
    );
    if (histError) throw histError;

    return new Response(JSON.stringify({ ok: true, usdKrw: krwRate }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
