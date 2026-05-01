-- assets에 website_domain 추가 (Clearbit 로고 URL 매핑용)

alter table public.assets
  add column if not exists website_domain text;

-- 미국 종목 (도메인 직매핑)
update public.assets set website_domain = 'apple.com'           where ticker = 'AAPL';
update public.assets set website_domain = 'microsoft.com'       where ticker = 'MSFT';
update public.assets set website_domain = 'abc.xyz'             where ticker = 'GOOGL';
update public.assets set website_domain = 'amazon.com'          where ticker = 'AMZN';
update public.assets set website_domain = 'tesla.com'           where ticker = 'TSLA';
update public.assets set website_domain = 'nvidia.com'          where ticker = 'NVDA';
update public.assets set website_domain = 'meta.com'            where ticker = 'META';
update public.assets set website_domain = 'jpmorganchase.com'   where ticker = 'JPM';
update public.assets set website_domain = 'jnj.com'             where ticker = 'JNJ';
update public.assets set website_domain = 'visa.com'            where ticker = 'V';
update public.assets set website_domain = 'walmart.com'         where ticker = 'WMT';
update public.assets set website_domain = 'pg.com'              where ticker = 'PG';
update public.assets set website_domain = 'coca-cola.com'       where ticker = 'KO';
update public.assets set website_domain = 'thewaltdisneycompany.com' where ticker = 'DIS';
update public.assets set website_domain = 'netflix.com'         where ticker = 'NFLX';
update public.assets set website_domain = 'exxonmobil.com'      where ticker = 'XOM';
update public.assets set website_domain = 'chevron.com'         where ticker = 'CVX';
update public.assets set website_domain = 'boeing.com'          where ticker = 'BA';
update public.assets set website_domain = 'caterpillar.com'     where ticker = 'CAT';
update public.assets set website_domain = 'americantower.com'   where ticker = 'AMT';
update public.assets set website_domain = 'nexteraenergy.com'   where ticker = 'NEE';
update public.assets set website_domain = 'linde.com'           where ticker = 'LIN';
update public.assets set website_domain = 'investor.vanguard.com' where ticker = 'VOO';
update public.assets set website_domain = 'invesco.com'         where ticker = 'QQQ';
update public.assets set website_domain = 'ssga.com'            where ticker = 'SPY';

-- 한국 종목 (Clearbit 커버리지 약함 — 매핑되는 것만)
update public.assets set website_domain = 'samsung.com'         where market = 'KR' and ticker = '005930';
update public.assets set website_domain = 'skhynix.com'         where market = 'KR' and ticker = '000660';
update public.assets set website_domain = 'navercorp.com'       where market = 'KR' and ticker = '035420';
update public.assets set website_domain = 'kakaocorp.com'       where market = 'KR' and ticker = '035720';
update public.assets set website_domain = 'samsungbiologics.com' where market = 'KR' and ticker = '207940';
update public.assets set website_domain = 'hyundai.com'         where market = 'KR' and ticker = '005380';
update public.assets set website_domain = 'kia.com'             where market = 'KR' and ticker = '000270';
update public.assets set website_domain = 'lgchem.com'          where market = 'KR' and ticker = '051910';
update public.assets set website_domain = 'samsungsdi.com'      where market = 'KR' and ticker = '006400';
update public.assets set website_domain = 'lgensol.com'         where market = 'KR' and ticker = '373220';
update public.assets set website_domain = 'celltrion.com'       where market = 'KR' and ticker = '068270';
update public.assets set website_domain = 'kbfg.com'            where market = 'KR' and ticker = '105560';
update public.assets set website_domain = 'shinhangroup.com'    where market = 'KR' and ticker = '055550';
update public.assets set website_domain = 'hanafn.com'          where market = 'KR' and ticker = '086790';
update public.assets set website_domain = 'samsungcnt.com'      where market = 'KR' and ticker = '028260';
update public.assets set website_domain = 'lge.com'             where market = 'KR' and ticker = '066570';
update public.assets set website_domain = 'lg.com'              where market = 'KR' and ticker = '003550';
update public.assets set website_domain = 'kepco.co.kr'         where market = 'KR' and ticker = '015760';
update public.assets set website_domain = 'sktelecom.com'       where market = 'KR' and ticker = '017670';
update public.assets set website_domain = 'kt.com'              where market = 'KR' and ticker = '030200';
update public.assets set website_domain = 'sk.com'              where market = 'KR' and ticker = '034730';
update public.assets set website_domain = 'skinnovation.com'    where market = 'KR' and ticker = '096770';
update public.assets set website_domain = 'netmarble.com'       where market = 'KR' and ticker = '251270';
