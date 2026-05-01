// 아레나 카드 추천 / 포트폴리오 확정 (Supabase RPC 기반)

import { supabase } from '@/lib/supabase/client';
import type { AssetTypes } from '@/lib/hooks/zustand/use-arena-store';

type DbAssetRowTypes = {
  asset_id: string;
  ticker: string;
  yahoo_symbol: string;
  name: string;
  market: 'US' | 'KR';
  type: 'STOCK' | 'ETF';
  sector: string | null;
  asset_class: string | null;
  current_risk_level: number;
  image_url: string | null;
  impact_hint: string | null;
  website_domain: string | null;
};

const mapAsset = (row: DbAssetRowTypes): AssetTypes => ({
  assetId: row.asset_id,
  ticker: row.ticker,
  name: row.name,
  sector: row.sector ?? '',
  market: row.market,
  assetClass: row.asset_class,
  currentRiskLevel: row.current_risk_level,
  imageUrl: row.market === 'US'
    ? `https://assets.parqet.com/logos/symbol/${row.ticker}`
    : row.website_domain
      ? [
          `https://logo.clearbit.com/${row.website_domain}`,
          `https://unavatar.io/${row.website_domain}`,
          `https://www.google.com/s2/favicons?domain=${row.website_domain}&sz=128`,
        ]
      : (row.image_url ?? ''),
  impactHint: row.impact_hint ?? '',
});

export const recommendArenaCards = async ({
  riskProfile,
  sectors,
  excludeIds,
}: {
  riskProfile: string;
  sectors: string[];
  excludeIds: string[];
}): Promise<AssetTypes[]> => {
  const { data, error } = await supabase.rpc('recommend_arena_cards', {
    p_risk_profile: riskProfile,
    p_sectors: sectors,
    p_exclude_ids: excludeIds,
  });
  if (error) {
    console.error('recommendArenaCards failed:', error);
    throw error;
  }
  return ((data ?? []) as DbAssetRowTypes[]).map(mapAsset);
};

export const finalizeArenaPortfolio = async ({
  name,
  riskProfile,
  sectors,
  pickedAssetIds,
}: {
  name: string;
  riskProfile: string;
  sectors: string[];
  pickedAssetIds: string[];
}): Promise<{ portfolioId: string }> => {
  const { data, error } = await supabase.rpc('finalize_arena_portfolio', {
    p_name: name,
    p_risk_profile: riskProfile,
    p_sectors: sectors,
    p_picked_asset_ids: pickedAssetIds,
  });
  if (error) {
    console.error('finalizeArenaPortfolio failed:', error);
    throw error;
  }
  return { portfolioId: data as string };
};
