# 따라가게 — 최애가 간 가게, 나도 따라가게

아이돌이 **공개 콘텐츠(방송·본인 SNS·인터뷰 등)** 에서 다녀가거나 추천한 가게를 팬이 제보하고, 다른 팬이 출처를 검증하면 지도에 올라가는 서비스.
가게의 영업시간·휴무·혼잡 시간대·매출 랭킹은 **eat.pl 잇플 가맹점 API(BC카드 결제 데이터)** 로 붙인다.

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

`.env.local` 에 Supabase 주소와 키가 들어 있어야 한다 (`.env.example` 참고). 이 파일은 깃에 올리지 않는다.

## 배포

- Vercel: https://ttara-gage.vercel.app (GitHub `main` 에 push 하면 자동 배포, 함수 리전 `icn1`)
- 환경변수는 Vercel > Settings > Environment Variables 에 `.env.local` 과 같은 값을 넣는다.
- Vercel 화면에서 Supabase 연동 버튼을 누르면 새 Supabase 프로젝트가 따로 생기니 쓰지 않는다.

## Supabase

- 프로젝트: `ttara-gage` (서울 리전, 무료 플랜)
- 스키마: `supabase/migrations/0001_init.sql` — 테이블, RLS, 상태 트리거, 제보 속도 제한
- 예시 데이터: `supabase/seed.sql` — 데모 아이돌(가상 가게 9곳), 최연준(성지 없음)
- 새 프로젝트에 다시 만들 땐 대시보드 > SQL Editor 에서 두 파일을 차례로 실행
- 로그인: Google (Supabase Auth). 리디렉션 허용 주소에 `http://localhost:3000/**`, `https://ttara-gage.vercel.app/**` 등록됨. 새 배포 주소가 생기면 Supabase > Authentication > URL Configuration 에 추가해야 한다.
- Google OAuth 앱은 테스트 모드라 Google Cloud > Google 인증 플랫폼 > 대상 에 등록한 테스트 사용자만 로그인할 수 있다.
- 아이돌 목록(`/`)은 누구나 볼 수 있고, 아이돌 성지 페이지(`/idol/[id]`)와 제보·확인·신고는 로그인해야 한다.
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

`src/lib/eatpl/client.ts` 가 서버에서만 API를 호출한다. 잇플 API는 **사전 등록된 고정 IP** 에서만 호출되므로 브라우저는 항상 `/api/merchants` 같은 Route Handler를 거친다.

### 실제 API로 전환하는 순서

1. 제휴 협의 후 **기관명(instNm)** 을 발급받는다. (문의: bcaimerchant@bccard.com)
2. 고정 IP 서버를 하나 준비한다. (AWS Lightsail/EC2 + 고정 IP 등)
3. 그 서버에 `relay/server.mjs` 를 올려 실행하고, 서버 IP를 잇플에 등록한다.
   ```bash
   RELAY_SECRET=16자이상_아무_문자열 EATPL_BASE_URL=https://dev-api.paybooc.ai/api/mer PORT=8080 node server.mjs
   ```
   의존성이 없는 파일 하나라 Node 18 이상만 있으면 된다. HTTPS는 앞단에 Caddy/Nginx 등을 둔다.
4. Vercel 환경변수를 바꾸고 다시 배포한다.
   ```
   EATPL_MODE=live
   EATPL_INST_NM=<발급받은 기관명>
   EATPL_RELAY_URL=https://<중계 서버 주소>
   EATPL_RELAY_SECRET=<3번과 같은 문자열>
   ```
   고정 IP 서버에서 앱을 직접 띄운다면 중계 서버 없이 `EATPL_BASE_URL` 만 쓰면 된다.
5. 개발 서버로 테스트가 끝나면 운영 주소 `https://api.paybooc.ai/api/mer` 로 바꾼다.

### 응답 처리

- 문서상 `loclPrsnPpltYn`, `frnrVsitYn`, `empyVsitYn` 은 boolean 이다. `"Y"/"N"` 문자열이 와도 `yes()` 로 처리한다.
- 휴무·혼잡 요일은 `"월"`, `"월요일"` 어느 형식이 와도 첫 글자로 처리한다.
- 좌표는 TM128 → WGS84 로 변환해서 지도에 찍는다 (`src/lib/geo.ts`).
- 결과는 매출 상위 최대 100건·페이징 없음 → 가게명 + 지역을 같이 넣어 검색하고, `src/lib/match.ts` 의 유사도로 가장 맞는 가게를 고른다.
- `rspCode` 가 `00000` 이 아니거나 HTTP 오류면 서버 로그에 응답 앞부분을 남긴다. 첫 연동 때 Vercel > Logs 에서 확인한다.
- 1% 미만 랭킹은 소수점을 유지한다 (`src/lib/format.ts`).
- 출처 표기("eat.pl 잇플 · BC카드 결제 데이터 기반") 요청이 있으므로, live 전환 시 화면 표시 여부를 제휴 조건에 맞춘다.
- 이미 DB(`spots.match`)에 저장된 목업 가게 정보는 그대로 남는다. live 전환 후 다시 매칭하려면 SQL 에서 `update spots set match = null;` 을 실행한다.

## 운영 원칙 (사생활 보호)

- 출처 링크 없는 제보는 받지 않는다.
- 목격담, 자택·숙소 근처, "자주 간다더라" 같은 사적인 정보는 받지 않는다 (키워드 차단 + 신고).
- 아티스트 사진·로고는 쓰지 않는다 (퍼블리시티권).
