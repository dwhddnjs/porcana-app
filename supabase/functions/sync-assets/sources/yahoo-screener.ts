// Yahoo Finance Predefined Screener — most_actives (대형주 위주, 인증 불필요)
// 스크리너 응답에 sector 포함 — quoteSummary 없이 섹터 확보 가능

import { NormalizedAssetTypes, mapFmpSector } from '../normalize.ts';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

const EXCHANGE_MAP: Record<string, 'NASDAQ' | 'NYSE' | 'AMEX'> = {
  NMS: 'NASDAQ',
  NGM: 'NASDAQ',
  NCM: 'NASDAQ',
  NYQ: 'NYSE',
  NYSEArca: 'NYSE',
  ASE: 'AMEX',
};

type YahooQuoteTypes = {
  symbol: string;
  shortName?: string;
  longName?: string;
  exchange?: string;
  sector?: string;
};

const fetchScreenerPage = async (offset: number, count: number): Promise<YahooQuoteTypes[]> => {
  const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=most_actives&count=${count}&offset=${offset}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Yahoo Screener HTTP ${res.status}`);
  const json = await res.json();
  return (json?.finance?.result?.[0]?.quotes as YahooQuoteTypes[]) ?? [];
};

export const fetchUsAssets = async (limit = 500): Promise<NormalizedAssetTypes[]> => {
  const pageSize = 100;
  const results: NormalizedAssetTypes[] = [];

  for (let offset = 0; offset < limit; offset += pageSize) {
    const count = Math.min(pageSize, limit - offset);
    const quotes = await fetchScreenerPage(offset, count);

    for (const q of quotes) {
      if (!q.symbol) continue;
      results.push({
        ticker: q.symbol,
        yahoo_symbol: q.symbol,
        name: q.longName ?? q.shortName ?? q.symbol,
        market: 'US' as const,
        market_subtype: EXCHANGE_MAP[q.exchange ?? ''] ?? 'NYSE',
        type: 'STOCK' as const,
        sector: mapFmpSector(q.sector),
        website_domain: null,
      });
    }

    if (quotes.length < pageSize) break;
  }

  return results;
};
