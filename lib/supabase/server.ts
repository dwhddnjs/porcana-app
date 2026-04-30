import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('Supabase server env missing: EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
