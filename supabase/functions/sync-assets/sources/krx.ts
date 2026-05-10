// 네이버 금융 모바일 API — 해외 IP에서도 접근 가능
import { mapKrxSector, NormalizedAssetTypes, toYahooSymbolKr } from '../normalize.ts';

const TOP_N = 500;
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
  Referer: 'https://m.stock.naver.com/',
  Accept: 'application/json',
};

// 네이버 증권 모바일 API — 시가총액 순 종목 목록
// 실제 응답 구조 확인을 위해 첫 응답을 에러에 포함
const fetchNaverPage = async (
  market: 'KOSPI' | 'KOSDAQ',
  page: number,
  pageSize: number
): Promise<NormalizedAssetTypes[]> => {
  const url = `https://m.stock.naver.com/api/stocks/marketValue/${market}?page=${page}&pageSize=${pageSize}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Naver ${market} HTTP ${res.status} (${url})`);

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Naver ${market} non-JSON: ${text.slice(0, 200)}`);
  }

  // 응답 구조 탐색: result.itemList, stocks, items, data 등 다양한 키 시도
  const obj = json as Record<string, unknown>;
  const itemList =
    (obj?.result as Record<string, unknown>)?.itemList ??
    obj?.stocks ??
    obj?.items ??
    obj?.data ??
    (Array.isArray(json) ? json : null);

  if (!Array.isArray(itemList) || itemList.length === 0) {
    // 빈 결과면 실제 응답 구조를 에러에 포함해 진단
    throw new Error(
      `Naver ${market} empty — response keys: ${Object.keys(obj).join(', ')} | preview: ${text.slice(0, 300)}`
    );
  }

  return (itemList as Record<string, unknown>[]).map((item) => {
    // 다양한 필드명 대응
    const ticker = String(item.itemCode ?? item.code ?? item.stockCode ?? '');
    const name = String(item.itemName ?? item.name ?? item.stockName ?? '');
    const sector = String(item.sectorName ?? item.sector ?? item.industryName ?? '');
    const exchange = (market === 'KOSDAQ' ? 'KOSDAQ' : 'KOSPI') as 'KOSDAQ' | 'KOSPI';
    return {
      ticker,
      yahoo_symbol: toYahooSymbolKr(ticker, exchange),
      name,
      market: 'KR' as const,
      market_subtype: exchange,
      type: 'STOCK' as const,
      sector: mapKrxSector(sector),
      website_domain: null,
    };
  }).filter((a) => a.ticker.length > 0);
};

export const fetchKrAssets = async (): Promise<NormalizedAssetTypes[]> => {
  const pageSize = 100;
  const pages = Math.ceil(TOP_N / pageSize / 2); // KOSPI + KOSDAQ 각각

  const results: NormalizedAssetTypes[] = [];
  const errors: string[] = [];

  for (const market of ['KOSPI', 'KOSDAQ'] as const) {
    for (let page = 1; page <= pages; page++) {
      try {
        const items = await fetchNaverPage(market, page, pageSize);
        results.push(...items);
        if (items.length < pageSize) break; // 마지막 페이지
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
        break; // 한 market의 첫 페이지 실패면 진단 정보 충분
      }
    }
  }

  if (results.length === 0 && errors.length > 0) {
    throw new Error(errors.join(' | '));
  }

  return results.slice(0, TOP_N);
};
