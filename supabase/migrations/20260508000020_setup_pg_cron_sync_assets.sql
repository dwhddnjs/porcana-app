-- pg_cron + pg_net으로 sync-assets Edge Function을 KST 월요일 03:00에 호출
-- KST = UTC+9 → KST 월요일 03:00 = UTC 일요일 18:00
--
-- 사용 전 Vault에 시크릿 등록 필요:
--   select vault.create_secret('https://<project-ref>.functions.supabase.co/sync-assets', 'sync_assets_url');
--   select vault.create_secret('<service_role_jwt>', 'sync_assets_token');
--
-- sync-assets는 Yahoo Finance Screener(US) + 네이버 금융(KR)을 사용하며 API 키 불필요

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('sync-assets-weekly');
exception when others then null;
end $$;

select cron.schedule(
  'sync-assets-weekly',
  '0 18 * * 0',  -- UTC 일요일 18:00 = KST 월요일 03:00
  $cmd$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'sync_assets_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sync_assets_token'),
      'Content-Type',  'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $cmd$
);
