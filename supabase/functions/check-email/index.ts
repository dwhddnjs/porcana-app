// @ts-expect-error Deno 표준 라이브러리
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

declare const Deno: { env: { get: (k: string) => string | undefined } };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const { email } = await req.json();
  if (!email) return json({ error: 'email required' }, 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // auth.users를 admin REST API로 직접 조회 (service role key 필요)
  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(`email=${email}`)}`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  if (!res.ok) return json({ error: 'failed to check email' }, 500);

  const data = await res.json();
  const exists = (data.users ?? []).some(
    (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
  );

  return json({ available: !exists });
});
