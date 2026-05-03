-- 카테고리·결제수단 초기값 (Supabase SQL Editor 등에서 실행)
-- categories.name / payment_methods.name 에 UNIQUE 제약이 있어야 ON CONFLICT (name) 가 동작합니다.

insert into categories (name) values
('식비(회사)'), ('카페(회사)'), ('식비(일반)'), ('카페(일반)'),
('교통비'), ('통신비'), ('관리비'), ('도시가스'), ('전기세'), ('수도세'),
('대출이자'), ('쇼핑(옷)'), ('쇼핑(화장품)'), ('쇼핑(생필품)'),
('쇼핑(약)'), ('쇼핑(그 외)'), ('문화생활'), ('선물'), ('계'),
('저축'), ('투자')
on conflict (name) do nothing;

insert into payment_methods (name) values
('체크카드(하나)'),
('신용카드(롯데)'),
('신용카드(삼성)'),
('네이버포인트(복지)')
on conflict (name) do nothing;
