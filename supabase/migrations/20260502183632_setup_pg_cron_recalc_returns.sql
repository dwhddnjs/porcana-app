-- refresh-prices 완료 5분 후 recalc-portfolio-returns 호출 (KST 10:05 / 23:05)
-- Vault 시크릿 등록 필요:
--   select vault.create_secret('https://<project-ref>.functions.supabase.co/recalc-portfolio-returns', 'recalc_returns_url');
--   select vault.create_secret('<service_role_jwt>', 'recalc_returns_token');
-- (recalc_returns_token은 refresh_prices_token과 같은 값을 재사용해도 됨)

do $$
begin
  perform cron.unschedule('recalc-returns-morning');
exception when others then null;
end $$;

do $$
begin
  perform cron.unschedule('recalc-returns-night');
exception when others then null;
end $$;

-- KST 10:05 = UTC 01:05
select cron.schedule(
  'recalc-returns-morning',
  '5 1 * * *',
  $cmd$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'recalc_returns_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'recalc_returns_token'),
      'Content-Type',  'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $cmd$
);

-- KST 23:05 = UTC 14:05
select cron.schedule(
  'recalc-returns-night',
  '5 14 * * *',
  $cmd$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'recalc_returns_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'recalc_returns_token'),
      'Content-Type',  'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $cmd$
);
