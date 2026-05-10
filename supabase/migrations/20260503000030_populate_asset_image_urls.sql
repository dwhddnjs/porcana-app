-- assets.image_url 일괄 채우기
-- US 종목: parqet 로고 CDN, KR 종목: clearbit (website_domain 기반)
-- 이후 신규 asset INSERT 시에도 동일 규칙 적용

-- US 종목: https://assets.parqet.com/logos/symbol/{ticker}
update public.assets
set image_url = 'https://assets.parqet.com/logos/symbol/' || ticker
where market = 'US' and (image_url is null or image_url = '');

-- KR 종목 (website_domain 있는 경우): clearbit
update public.assets
set image_url = 'https://logo.clearbit.com/' || website_domain
where market = 'KR'
  and website_domain is not null
  and (image_url is null or image_url = '');
