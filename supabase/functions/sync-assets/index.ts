// sync-assets: US/KR 종목 마스터 자동 동기화
// US: Yahoo Finance Screener (시가총액 상위, 인증 불필요)
// KR: 네이버 금융 API (해외 IP 허용)
// 큐레이션(sector/hint/risk)은 backfill-assets가 별도 담당
// pg_cron: KST 월요일 03:00 (UTC 일요일 18:00)

// @ts-expect-error Deno 표준 라이브러리
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error Supabase Edge Functions npm specifier
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { fetchUsAssets } from './sources/yahoo-screener.ts';
import { fetchKrAssets } from './sources/krx.ts';
import { NormalizedAssetTypes } from './normalize.ts';

declare const Deno: { env: { get: (k: string) => string | undefined } };

const MAX_NEW_INSERTS = 200;

type UpsertResultTypes = {
  inserted: number;
  updated: number;
  failures: { ticker: string; error: string }[];
};

const upsertAssets = async (
  admin: ReturnType<typeof createClient>,
  assets: NormalizedAssetTypes[],
  existingSet: Set<string>,
  dryRun: boolean
): Promise<UpsertResultTypes> => {
  let inserted = 0;
  let updated = 0;
  const failures: { ticker: string; error: string }[] = [];

  for (const asset of assets) {
    const key = `${asset.market}:${asset.ticker}`;
    const isNew = !existingSet.has(key);

    if (dryRun) {
      isNew ? inserted++ : updated++;
      continue;
    }

    try {
      if (isNew) {
        const { error } = await admin.from('assets').insert({
          ticker: asset.ticker,
          yahoo_symbol: asset.yahoo_symbol,
          name: asset.name,
          market: asset.market,
          market_subtype: asset.market_subtype,
          type: asset.type,
          sector: asset.sector,
          asset_class: asset.type,
          website_domain: asset.website_domain,
          current_risk_level: 3,
          impact_hint: null,
          personality: null,
        });
        if (error) throw error;
        inserted++;
      } else {
        // 큐레이션 필드(impact_hint/personality/current_risk_level)는 덮어쓰지 않음
        // sector는 null인 경우에만 채움 (coalesce 패턴)
        const { error } = await admin
          .from('assets')
          .update({
            name: asset.name,
            yahoo_symbol: asset.yahoo_symbol,
            market_subtype: asset.market_subtype,
            ...(asset.sector ? { sector: asset.sector } : {}),
          })
          .eq('market', asset.market)
          .eq('ticker', asset.ticker);
        if (error) throw error;
        updated++;
      }
    } catch (err) {
      failures.push({
        ticker: asset.ticker,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { inserted, updated, failures };
};

serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const dryRun = Deno.env.get('SYNC_ASSETS_DRY_RUN') === 'true';

  const admin = createClient(supabaseUrl, serviceKey);

  const result = {
    dry_run: dryRun,
    us_inserted: 0,
    us_updated: 0,
    kr_inserted: 0,
    kr_updated: 0,
    fetch_errors: [] as string[],
    failures: [] as { ticker: string; error: string }[],
  };

  // 기존 종목 목록 1회만 조회 (US/KR 공통)
  const { data: existing } = await admin
    .from('assets')
    .select('ticker, market')
    .in('market', ['US', 'KR']);
  const existingSet = new Set<string>(
    (existing ?? []).map((r: { ticker: string; market: string }) => `${r.market}:${r.ticker}`)
  );

  // ── US: Yahoo Finance Screener ──
  let usAssets: NormalizedAssetTypes[] = [];
  try {
    usAssets = await fetchUsAssets(MAX_NEW_INSERTS);
  } catch (err) {
    const msg = `US fetch: ${err instanceof Error ? err.message : String(err)}`;
    console.error(msg);
    result.fetch_errors.push(msg);
  }

  // ── KR: 네이버 금융 ──
  let krAssets: NormalizedAssetTypes[] = [];
  try {
    krAssets = (await fetchKrAssets()).slice(0, MAX_NEW_INSERTS);
  } catch (err) {
    const msg = `KR fetch: ${err instanceof Error ? err.message : String(err)}`;
    console.error(msg);
    result.fetch_errors.push(msg);
  }

  // ── Upsert ──
  if (usAssets.length > 0) {
    const { inserted, updated, failures } = await upsertAssets(
      admin,
      usAssets,
      existingSet,
      dryRun
    );
    result.us_inserted = inserted;
    result.us_updated = updated;
    result.failures.push(...failures);
  }

  if (krAssets.length > 0) {
    const { inserted, updated, failures } = await upsertAssets(
      admin,
      krAssets,
      existingSet,
      dryRun
    );
    result.kr_inserted = inserted;
    result.kr_updated = updated;
    result.failures.push(...failures);
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
