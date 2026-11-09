---
name: project-bull-api-connectors-progress
description: "황소특보용 DART/Alpha Vantage API 커넥터 구현 완료(2026-09-23), KIS는 아직 미착수"
metadata:
  node_type: memory
  type: project
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-23T00:18:29.748Z
---

## 완료 사항

### DART(OpenDART 공시검색)
- `lib/source-facts/dart-connector.ts` — request builder, `DisclosureDocument` normalizer(types.ts에 이미 있던 타입 재사용), mock transport
- `lib/source-facts/dart-live-transport.ts` — live fetch, DART 상태코드(000=성공/013=결과없음/011=인증오류 등) 처리
- `scripts/check-source-facts-dart-connector.mjs` — 15개 항목 전체 통과
- env: `DART_API_KEY` 또는 `IROS_OPENDART_API_KEY`(우선순위 순, 둘 중 있는 거 사용)

### Alpha Vantage(GLOBAL_QUOTE, 미국장 시세)
- `lib/source-facts/alpha-vantage-connector.ts` — request builder, `EconomicIndicator` normalizer, mock transport
- `lib/source-facts/alpha-vantage-live-transport.ts` — live fetch. **주의**: Alpha Vantage는 rate limit/plan 제한을 HTTP 200 + `Note`/`Information` 필드로 돌려줌(비정상 HTTP status 아님) — 이걸 명시적으로 감지 안 하면 조용히 깨진 데이터로 정규화됨. 이번 구현은 이 케이스를 전부 에러로 분류함.
- `scripts/check-source-facts-alpha-vantage-connector.mjs` — 15개 항목 전체 통과
- env: `ALPHA_VANTAGE_API_KEY`
- `lib/source-facts/types.ts`의 `SourceProviderType`에 `"alpha_vantage"` 추가함(기존엔 ecos/kosis/opendart/fred만 있었음)
- 무료 티어 제약(5 req/min, 25 req/day)이 있어 여러 종목 조회 시 `collectAlphaVantageQuotesForSymbols`로 순차 처리+부분실패 허용 구조로 만듦

## 패턴 (다음 커넥터 만들 때 그대로 재사용)

모든 커넥터가 동일한 5-파일 구조를 따름 — 이 프로젝트의 확립된 관례:
1. `{name}-connector.ts` — request builder(+validation), raw response 타입, normalizer(→ 기존 `types.ts`의 도메인 타입), 동기/비동기 transport 인터페이스, mock transport factory
2. `{name}-live-transport.ts` — 유일하게 `process.env` 읽고 실제 `fetch()` 하는 파일. secret은 URL/에러메시지에 절대 노출 안 함(에러는 카테고리만). 응답 shape guard로 malformed 응답 거부
3. `scripts/check-source-facts-{name}-connector.mjs` — `_editorial-v2-ts-probe.mjs`의 `runTsProbe`/`typecheck` 사용, mock 데이터로 전체 파이프라인 검증(네트워크 없음)

중요 원칙(전부 지킬 것):
- 날짜/값을 절대 날조하지 않음 — 파싱 실패 시 무조건 `null` 리턴, fallback 값 금지
- 여러 항목 배치 처리 시 하나 실패해도 전체 안 죽게(`failed: [...]` 배열로 부분 실패 허용)
- API 키는 절대 로그/에러메시지에 노출 금지, `resolve{Name}ApiKey()`가 string|null만 반환
- 검증 스크립트에서 실제 env의 API 키 값을 절대 echo하지 않음(이번에 DART 검증 중 이 실수를 했다가 즉시 고침 — env에 진짜 키가 있으면 그 값이 그대로 테스트 출력에 찍히는 사고 위험 있음, boolean/타입 체크로만 검증할 것)

### KIS(한국투자증권, 국내주식 현재가 시세)
- `lib/source-facts/kis-connector.ts` — request builder, `EconomicIndicator` normalizer, mock transport
- `lib/source-facts/kis-token-cache.ts` — OAuth 토큰 파일 캐시(읽기/쓰기/만료판정). 캐시 경로: `C:/tmp/money-shorts-os/kis-token-cache.json`(기본값). 5분 안전마진 두고 만료판정, 서버모드(live/vts) 다르면 재사용 안 함
- `lib/source-facts/kis-live-transport.ts` — 토큰 발급(`POST /oauth2/tokenP`)+캐시 재사용 오케스트레이션 + 시세조회(`FHKST01010100`, `GET /uapi/domestic-stock/v1/quotations/inquire-price`)
- `scripts/check-source-facts-kis-connector.mjs` — 18개 항목 전체 통과
- env: `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`(비우면 KIS_SERVER_MODE 기준 기본 도메인으로 폴백), `KIS_SERVER_MODE`("live" 또는 "vts", 기본 live)
- **중요 버그 포인트(실제로 이번에 테스트로 잡아냄)**: KIS는 전일대비(`prdy_vrss`)를 항상 양수 절대값으로 주고, 부호는 별도 필드(`prdy_vrss_sign`: 1=상한/2=상승/3=보합/4=하한/5=하락)로 옴. 이걸 무시하고 `parseFloat`만 하면 **하락한 종목도 전부 양수(상승)로 잘못 표시**됨. `resolveKisSignedChange()` 함수가 이 부호코드를 해석해서 처리 — 다른 KIS 엔드포인트(체결가, 시세 등) 추가할 때도 이 패턴 재확인 필요.

## 3개 API 커넥터 + 지수 데이터 전부 완료 (2026-09-23)

사용자 지적으로 "종목 시세만으론 지수 멘트를 못 만든다"는 걸 재확인 후 지수 데이터도 추가함:
- **국내 지수(코스피/코스닥)**: `kis-connector.ts`에 `KisIndexQuoteRequest`/`normalizeKisIndexQuote`/`collectKisIndicesForCodes` 등 지수 전용 세트 추가(종목 조회와 tr_id·URL·응답필드 전부 다름 — FHPUP02100000, `/uapi/domestic-stock/v1/quotations/inquire-index-price`, 업종코드 0001=코스피/1001=코스닥). `kis-live-transport.ts`에 `createKisIndexLiveTransport` 추가.
- **미국 지수(S&P500/나스닥100/다우)**: 별도 코드 불필요 — 기존 Alpha Vantage GLOBAL_QUOTE가 ETF 심볼도 그대로 처리 가능해서 `US_INDEX_ETF_PROXIES` 상수(SPY/QQQ/DIA)만 추가.

DART(15) + Alpha Vantage(16, 지수proxy 포함) + KIS(23, 지수포함) = **총 54개 테스트 전부 통과**, 프로젝트 전체 타입체크 통과.

### 이번에 실제로 잡은 설계 버그
KIS 지수 정규화 초안에서 거래일(`tradingDateIso`)을 `fetchedAt`(조회 시각)에서 자동 유도하도록 만들었는데, 이건 이 프로젝트 전체가 지켜온 "날짜 절대 날조 금지" 원칙 위반이었음(장마감 후·주말·공휴일 조회 시 틀린 거래일 생성). 검증 스크립트 작성 중 실측 불일치로 발견 → 종목 조회(`collectKisQuote`)와 동일하게 `tradingDateIso`를 호출자가 명시적으로 넘기도록 시그니처 수정(`collectKisIndexQuote`/`collectKisIndicesForCodes` 둘 다).

## 보안 사고 및 수정 (2026-09-23)

**Alpha Vantage rate-limit 에러 메시지가 API 키 값을 그대로 노출함.** 실측 스캔 중 하루 25건 한도(무료 티어)에 도달했을 때, Alpha Vantage가 돌려주는 `Information` 필드가 `"We have detected your API key as <실제키값> and our standard API rate limit is..."` 형식이었다. `alpha-vantage-live-transport.ts`의 `parseAlphaVantageQuoteResponse`가 이 필드를 그대로 에러 메시지에 이어붙이고 있었고, 그 에러가 콘솔에 출력되면서 **실제 API 키 값이 대화/터미널 스크롤백에 노출됐다.**

- 즉시 수정: `Information` 필드는 내용을 절대 포함하지 않고 고정 문자열(`"Alpha Vantage rate limit or plan restriction (see provider dashboard for detail)"`)로만 응답하도록 변경. `Error Message` 필드도 만약을 대비해 200자로 길이 제한.
- 회귀 방지 테스트 추가(`scripts/check-source-facts-alpha-vantage-connector.mjs`) — 가짜 키 값을 담은 Information 필드를 넣고 에러 메시지에 그 값이 안 섞여 나오는지 검증.
- 노출된 실제 키(`JNQHDVQBOIVT3FHG`)는 Owner가 "지금은 안 바꾼다"고 결정 — 재발급은 보류 상태.
- **교훈**: 외부 API의 에러 응답 필드를 "안전한 진단 정보"로 가정하고 그대로 이어붙이면 안 된다. 특히 rate-limit/quota 관련 메시지는 provider가 친절하게(?) 키를 되짚어주는 경우가 있다 — 새 provider 연동 시 에러 메시지 필드를 통째로 노출하기 전에 실제 내용이 뭔지 먼저 확인할 것. DART/KIS도 에러 메시지에 msg1을 그대로 노출하는데, 이 두 provider는 지금까지 실측에서 키 값이 섞여 나온 적 없었지만 완전히 안심할 수는 없음 — 재확인 필요.

## 남은 작업

- 이 커넥터들을 실제로 황소특보 대본 파이프라인(아직 미설계)에 연결하는 작업은 별도.
- KIS는 실제 앱키로 라이브 호출을 한 번도 안 해봤음(mock만 검증) — 처음 실제 사용 시 토큰 발급이 실제로 되는지, `KIS_BASE_URL`이 live/vts 중 뭘로 설정되어 있는지 먼저 확인 필요.
- 섹터/업종별 등락(개별종목·지수 API로는 커버 안 됨), 뉴스 시황 텍스트(기존 `naver-news-connector.ts` 재사용 가능성 있음)는 아직 검토만 하고 구현 안 함 — 대본 설계 단계에서 필요 여부 재확인 필요.
