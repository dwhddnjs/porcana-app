-- pg_cron + pg_net으로 refresh-fx Edge Function을 KST 09:00에 호출
-- KST = UTC+9 → KST 09:00 = UTC 00:00
--
-- 사용 전 Vault에 시크릿 등록 필요:
--   select vault.create_secret('https://<project-ref>.functions.supabase.co/refresh-fx', 'refresh_fx_url');
--   select vault.create_secret('<service_role_jwt>', 'refresh_fx_token');

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('refresh-fx-daily');
exception when others then null;
end $$;

select cron.schedule(
  'refresh-fx-daily',
  '0 0 * * *',
  $cmd$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'refresh_fx_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'refresh_fx_token'),
      'Content-Type',  'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
  $cmd$
);
