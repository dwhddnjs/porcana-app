-- pg_cron + pg_net으로 refresh-prices Edge Function을 KST 10:00 / 23:00에 호출
-- KST = UTC+9 → KST 10:00 = UTC 01:00, KST 23:00 = UTC 14:00
--
-- 사용 전 한 번 Vault에 시크릿 등록 필요:
--   select vault.create_secret('https://<project-ref>.functions.supabase.co/refresh-prices', 'refresh_prices_url');
--   select vault.create_secret('<service_role_jwt>', 'refresh_prices_token');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 기존 잡이 있으면 제거 (재실행 안전)
do $$
begin
  perform cron.unschedule('refresh-prices-morning');
exception when others then null;
end $$;

do $$
begin
  perform cron.unschedule('refresh-prices-night');
exception when others then null;
end $$;

select cron.schedule(
  'refresh-prices-morning',
  '0 1 * * *',
  $cmd$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'refresh_prices_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'refresh_prices_token'),
      'Content-Type',  'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cmd$
);

select cron.schedule(
  'refresh-prices-night',
  '0 14 * * *',
  $cmd$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'refresh_prices_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'refresh_prices_token'),
      'Content-Type',  'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cmd$
);
