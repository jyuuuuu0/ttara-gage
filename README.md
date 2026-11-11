# 따라가게 — 최애가 간 가게, 나도 따라가게

아이돌이 **공개 콘텐츠(방송·본인 SNS·인터뷰 등)** 에서 다녀가거나 추천한 가게를 팬이 제보하고, 다른 팬이 출처를 검증하면 지도에 올라가는 서비스.
가게의 영업시간·휴무·혼잡 시간대·매출 랭킹은 **eat.pl 잇플 가맹점 API(BC카드 결제 데이터)** 로 붙인다.

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

`.env.local` 에 Supabase 주소와 키가 들어 있어야 한다 (`.env.example` 참고). 이 파일은 깃에 올리지 않는다.

## Supabase

- 프로젝트: `ttara-gage` (서울 리전, 무료 플랜)
- 스키마: `supabase/migrations/0001_init.sql` — 테이블, RLS, 상태 트리거, 제보 속도 제한
- 예시 데이터: `supabase/seed.sql` — 데모 아이돌(가상 가게 9곳), 최연준(성지 없음)
- 새 프로젝트에 다시 만들 땐 대시보드 > SQL Editor 에서 두 파일을 차례로 실행
- 로그인: Google (Supabase Auth). 리디렉션 허용 주소에 `http://localhost:3000/**` 등록됨. 배포하면 배포 주소도 추가해야 한다.
- 권한은 DB(RLS)가 지킨다: 비로그인은 읽기만, 제보는 본인 이름으로만, 상태·확인 수는 트리거만 바꿀 수 있음, 본인 제보 확인 불가, 3명 확인 시 공개, 신고 2건 시 숨김, 1시간 10건 제보 제한
- `SUPABASE_SECRET_KEY` 는 가게 매칭 결과(spots.match) 저장에만 서버에서 쓴다

## 기능

| 기능 | 위치 |
|---|---|
| 아이돌 검색·등록 | `src/app/page.tsx` |
| 성지 지도·목록, "지금 영업 중"/"피크 시간 피하기"/업종 필터 | `src/components/IdolView.tsx` |
| 순례 코스 (같은 시·군·구 성지를 최근접 순서로 연결, 도보 시간) | `src/lib/course.ts`, `src/components/CourseList.tsx` |
| 제보 (출처 링크 필수, 공개 출처 체크, 사적 공간 키워드 차단, 잇플 가게 검색 연결) | `src/components/ReportForm.tsx`, `src/lib/store/validate.ts` |
| 검증 (3명 확인 시 공개, 제보자 본인 불가) / 신고 (2건 시 숨김) | `src/app/api/spots/[id]/*` |

## 잇플 API 연동

- `src/lib/eatpl/client.ts` 가 서버에서만 API를 호출한다. 잇플 API는 **사전 등록된 고정 IP** 에서만 호출되므로, 브라우저는 항상 `/api/merchants` 같은 Route Handler를 거친다.
- 실제 API로 바꾸려면 `.env.local` 에서
  ```
  EATPL_MODE=live
  EATPL_INST_NM=<제휴 시 발급받은 기관명>
  EATPL_BASE_URL=https://dev-api.paybooc.ai/api/mer
  ```
  그리고 서버를 **등록한 고정 IP** 에서 띄운다. (Vercel 같은 서버리스는 IP가 바뀌므로 고정 IP가 있는 서버/프록시 필요)
- 좌표는 TM128 → WGS84 로 변환해서 지도에 찍는다 (`src/lib/geo.ts`).
- 결과는 매출 상위 최대 100건·페이징 없음 → 가게명 + 지역을 같이 넣어 검색하고, `src/lib/match.ts` 의 유사도로 가장 맞는 가게를 고른다.
- 출처 표기 "eat.pl 잇플 · BC카드 결제 데이터 기반" 은 푸터에 노출된다. 1% 미만 랭킹은 소수점 유지 (`src/lib/format.ts`).

## 운영 원칙 (사생활 보호)

- 출처 링크 없는 제보는 받지 않는다.
- 목격담, 자택·숙소 근처, "자주 간다더라" 같은 사적인 정보는 받지 않는다 (키워드 차단 + 신고).
- 아티스트 사진·로고는 쓰지 않는다 (퍼블리시티권).
