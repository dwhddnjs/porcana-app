-- KR ETF 이미지 소스 추가
-- website_domain이 없는 ETF에 운용사 도메인 설정 (clearbit/unavatar fallback 체인 활성화)

-- KODEX 시리즈 (삼성자산운용)
update public.assets set website_domain = 'samsungfund.com'
where market = 'KR' and ticker in ('069500', '091160', '114800');

-- TIGER 시리즈 (미래에셋자산운용)
update public.assets set website_domain = 'miraeasset.com'
where market = 'KR' and ticker in ('360750', '305080');

-- website_domain이 생겼으니 image_url도 clearbit으로 채움
update public.assets
set image_url = 'https://logo.clearbit.com/' || website_domain
where market = 'KR'
  and ticker in ('069500', '091160', '114800', '360750', '305080')
  and (image_url is null or image_url = '');
