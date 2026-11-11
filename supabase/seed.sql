-- 예시 데이터 (선택). 0001_init.sql 실행 뒤에 실행.
-- 데모 아이돌의 가게는 모두 가상의 예시이고, 최연준은 등록만 되어 있다.
insert into public.idols (id, name, group_name, agency, aliases, created_by) values
  ('00000000-0000-4000-8000-000000000001', '데모 아이돌', '예시 그룹', '예시 엔터테인먼트', '{데모,예시}', null),
  ('00000000-0000-4000-8000-000000000002', '최연준', 'TOMORROW X TOGETHER', '빅히트 뮤직', '{연준,TXT,투바투}', null);

insert into public.spots (idol_id, place_name, location, source_url, source_type, note, status, verify_count, reporter_id) values
  ('00000000-0000-4000-8000-000000000001', '모먼트 커피 성수', '서울 성동구', 'https://example.com/demo/d1', '본인 SNS', '[예시 데이터] 브이로그에서 아메리카노 마신 카페', 'verified', 3, null),
  ('00000000-0000-4000-8000-000000000001', '성수 소금빵 공방', '서울 성동구', 'https://example.com/demo/d2', '방송', '[예시 데이터] 예능 촬영지', 'verified', 3, null),
  ('00000000-0000-4000-8000-000000000001', '뚝섬 연탄갈비', '서울 성동구', 'https://example.com/demo/d3', '공식 콘텐츠', '[예시 데이터] 멤버 회식 장소로 공식 영상에 등장', 'verified', 3, null),
  ('00000000-0000-4000-8000-000000000001', '홍대 마라공방', '서울 마포구', 'https://example.com/demo/d4', '인터뷰', '[예시 데이터] 인터뷰에서 최애 마라탕집으로 언급', 'verified', 3, null),
  ('00000000-0000-4000-8000-000000000001', '연남 떡볶이집', '서울 마포구', 'https://example.com/demo/d5', '본인 SNS', '[예시 데이터] 라이브 방송 중 추천', 'verified', 3, null),
  ('00000000-0000-4000-8000-000000000001', '상수 이자카야 하루', '서울 마포구', 'https://example.com/demo/d6', '방송', '[예시 데이터] 웹예능 촬영지', 'verified', 3, null),
  ('00000000-0000-4000-8000-000000000001', '압구정 한우 오마카세', '서울 강남구', 'https://example.com/demo/d7', '공식 콘텐츠', '[예시 데이터] 데뷔 기념 회식', 'verified', 3, null),
  ('00000000-0000-4000-8000-000000000001', '한강 편의점 라면', '서울 영등포구', 'https://example.com/demo/d8', '방송', '[예시 데이터] 가게 정보가 없는 경우 예시', 'verified', 3, null),
  ('00000000-0000-4000-8000-000000000001', '동명동 카페 결', '광주 동구', 'https://example.com/demo/d9', '본인 SNS', '[예시 데이터] 지방 공연 때 들른 카페, 확인 대기 중', 'pending', 0, null);
