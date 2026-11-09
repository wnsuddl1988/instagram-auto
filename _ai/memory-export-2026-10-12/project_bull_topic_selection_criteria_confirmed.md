---
name: project-bull-topic-selection-criteria-confirmed
description: "황소특보 소재 선정 기준 확정(2026-09-23) — API 임계치 트리거, 종목명 언급 제한 규칙"
metadata:
  node_type: memory
  type: project
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-23T00:41:59.361Z
---

## 확정 사항

전체 내용은 `_ai/CURRENT_STANDARDS.md` §3(황소특보) "소재 선정 원칙"에 기록 완료. 이 메모리는 결정 경위만 보존.

- **트리거**: API 데이터(KIS/Alpha Vantage) 임계치 초과 감지가 먼저, 뉴스/공시로 검증해서 소재 확정하는 순서(뉴스가 먼저 트리거하는 방식 아님).
- **임계치**: 지수(미국 2%+/국내 3%+), 대형주(코스피200급 5~6%+), 중소형주(10%+ 이슈동반 필수).
- **종목명 언급 제한**: 코스피200급 초대형주+미국 초대형주(애플/테슬라/구글급)만 실명 가능하되 기본값은 비언급. 그 외 전부 섹터/테마 단위로만.

## 시행착오

1. **초기 임계치(지수1%/개별종목3%) 제안을 Owner가 즉시 반려**: "1%, 3%는 너무 흔한거아냐???" — 코스피 일간 변동성을 감안 안 하고 아무 숫자나 찍었던 실수. 임계치를 제시할 땐 그 시장의 평소 변동폭 대비 "정말 드문 수준"인지 먼저 감을 잡고 제시해야 함.
2. **재조정안(지수2%/대형주5%)도 Owner가 세분화**: 미국/국내 지수 기준을 다르게(미국2%/국내3%), 개별종목도 대형주/중소형주로 나누고 중소형주는 수치+이슈 동반을 같이 요구. Owner가 실제 트레이딩 감각으로 구체적 숫자를 불러줬음(1번 옵션 기반+세부조정).
3. **종목명 언급 리스크를 Owner가 먼저 제기**: "정말 안정적인 대형주... 이런거 빼곤 개별종목은 종목 언급하지마, 매수 추천이 될수있어" — 이건 제가 놓치고 있던 핵심 리스크였음. 소재 선정 기준(뭘 다룰지)과 표현 규칙(어떻게 언급할지)이 분리되어야 한다는 걸 이때 깨달음 — 소재로는 채택해도 대본에서는 종목명 없이 섹터/테마로만 풀어야 하는 경우가 생김(예: 중소형주 10%+ 테마 급등은 소재로 유효하지만 "OO전자가 올랐다"가 아니라 "2차전지 관련주가 올랐다"로 써야 함).
4. **허용리스트 종목도 Owner가 추가로 제한**: "삼성전자, 애플 이런것도 굳이 언급할이유없으면 안해도돼" — 허용리스트는 "언급해도 되는 목록"이지 "언급을 권장하는 목록"이 아님. 기본값은 항상 비언급.

## 구현 완료 (2026-09-23)

`lib/source-facts/bull-topic-threshold-scanner.ts` — 순수 함수 스캐너(네트워크 없음, KIS/AlphaVantage로 이미 가져온 EconomicIndicator 배열을 받아 소재 후보 판정만 함).
- `classifyBullInstrument`: 지수US/지수KR/대형주/중소형주 4분류
- `evaluateBullTopicCandidate`: 임계치 판정 + 중소형주는 `issueConfirmed` 플래그 없으면 무조건 거부(옵션 생략 시에도 기본 거부 — 실수로 단순 급등락만으로 채택되는 사고 방지)
- `BULL_NAMEABLE_STOCKS`: 종목명 언급 허용리스트(삼성전자/SK하이닉스/현대차, AAPL/TSLA/GOOGL) — `nameable` 플래그로 대본 작성 단계에 전달
- `scanBullTopicCandidates`: 배치 스캔, accepted/rejected 분리
- 검증: `scripts/check-source-facts-bull-topic-threshold-scanner.mjs` 12개 항목 전체 통과

## 라이브 러너 구현 완료 (2026-09-23)

`scripts/run-bull-topic-scan-once.mjs` — 수동 실행용(cron 없음). no-log wrapper에 `bull-topic-scan` 서브커맨드로 등록(KIS 4개 env + `ALPHA_VANTAGE_API_KEY`만 주입, 인자는 `--arm` 하나뿐이라 임의 심볼 주입 통로 없음). 실행:
```
node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-scan --arm
```
국내 지수(코스피/코스닥)+허용리스트 국내 대형주(3종목)+미국 지수 ETF 프록시(3개)+허용리스트 미국 대형주(3종목) = 총 11개 계측치를 조회해서 임계치 스캐너에 통과시키고 결과를 콘솔에 출력.

### 실측 중 발견하고 고친 버그 2건

1. **KIS 지수 응답 필드명 추정이 틀림**: 애초에 "전일 지수(종가)" 필드를 `bstp_nmix_prdy_clpr`로 추정했는데, 실측하니 그런 필드 자체가 응답에 없었다(실제 필드는 `bstp_nmix_prpr`/`bstp_nmix_prdy_vrss`/`prdy_vrss_sign`/`bstp_nmix_prdy_ctrt`뿐). 해법: previousValue를 `latestValue - changeValue`로 산술 도출(이미 확보한 실측값 계산이라 날조 아님). `kis-connector.ts`의 타입·정규화 함수·`kis-live-transport.ts`의 shape guard 전부 수정, 테스트 픽스처도 실제 구조에 맞게 정정.
2. **종목 정규화에서 `indicatorCode`가 통째로 빠져있었음**: `normalizeKisQuote()`가 종목코드를 파라미터로 아예 안 받아서, 삼성전자(005930)를 조회해도 `indicatorCode`가 없어 `bull-topic-threshold-scanner`의 `classifyBullInstrument`가 **모든 국내 종목을 stock_other(중소형주)로 오분류**하고 있었다 — 허용리스트에 있는 초대형주조차 대형주 임계치(5%)가 아니라 중소형주 임계치(10%+이슈)로 잘못 걸러지는 심각한 버그. 실제 라이브 스캔 결과를 보고서야("005930이 왜 stock_other로 나오지?") 발견함 — **mock 테스트만으로는 못 잡았던 버그**(mock 테스트가 이 필드를 애초에 검증 안 하고 있었음). 해법: `normalizeKisQuote`에 `stockCode` 파라미터 추가, `collectKisQuote`가 `request.stockCode`를 자동 전달하도록 배선, 회귀 방지 테스트 2건 추가(`indicatorCode` 직접 검증 + `collectKisQuote` end-to-end 배선 검증).
3. Alpha Vantage rate limit(초당1건/일25건) 대응으로 요청 간 1.2초 딜레이 추가.

**교훈**: mock 기반 단위 테스트가 통과해도 "그 필드가 실제로 쓰이는지"까지는 검증 못 할 수 있다 — 특히 이번처럼 정규화 함수의 파라미터 하나가 통째로 빠진 경우, 각 필드를 개별로 assert하지 않으면 조용히 새는 버그가 생긴다. 실제 라이브 호출로 한 번 검증하는 과정이 mock 테스트의 사각지대를 드러냈다.

## 중소형주 뉴스 검색 러너 완료 (2026-09-23)

`scripts/run-bull-topic-news-search-once.mjs` — no-log wrapper `bull-topic-news-search` 서브커맨드로 등록(네이버뉴스 키만 주입).
```
node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-news-search --arm
```
기존 `naver-news-connector.ts`(`collectNaverNewsForKeywords`)를 재사용 — 새 커넥터 코드는 만들지 않음. 검색 키워드는 종목명이 아니라 "급등/상한가/급락/하한가/공급계약/테마주" 같은 이슈성 키워드로 고정(특정 종목을 미리 정해두고 찾는 게 아니라 오늘 뭐가 이슈인지 거꾸로 찾는 방식).

**중요 설계 결정(Owner 확정)**: 종목명·등락률을 뉴스 제목에서 자동 추출하지 않는다 — 제목이 자유형식 텍스트라 기계적 추출은 오인식 위험이 크다는 판단. 이 스크립트는 제목+링크+출처만 모아서 보여주고, 사람이 직접 읽고 판단(실제 종목·등락률·이슈 확인)한 뒤 `evaluateBullTopicCandidate`를 `issueConfirmed:true`로 수동 호출해서 임계치(10%+)를 넘는지 확인하는 다음 단계로 넘어간다. 실측 결과 "노타·더블유에스아이 등 6개 상한가", "스카이랩스 上" 같은 실제 유용한 후보 원재료가 정상적으로 검색됨.

## 소재 유형 6가지로 전면 확장 완료 (2026-09-23)

Owner 지적("수치만 가지고 뽑을꺼야?? 섹터/테마/공급계약/향후전망/주요일정은 소재가 안 된다고 생각하는거야??")으로 처음 만든 임계치 스캐너 1개만으로는 부족하다는 걸 재확인. 실제 인기 투자 채널(증시각도기TV 등) 조사 결과, 단순 시황 나열형은 조회수가 낮고 경고성·반전형 프레이밍이 훨씬 반응이 좋다는 게 확인됨 — 이건 대본구조의 "훅"+"반전/심리" 단계에서 반영(훅=감정적 "왜 중요한지", 본문=팩트만).

최종 6가지 소재 유형과 실행 명령은 `_ai/CURRENT_STANDARDS.md` §3 "소재 유형 6가지"에 전부 기록. 요약:
1. 수치급변(지수/대형주) — `bull-topic-scan --arm`(기존 완성)
2. 중소형주 급등락+이슈 — `bull-topic-news-search --arm`(기존 완성)
3. 공급계약/수주 공시 — `bull-topic-dart-scan --arm`(신규, DART corp_code 생략=전체시장스캔으로 확장)
4. 섹터/테마+향후전망/실적 — `bull-topic-sector-news-search --arm`(신규)
5. 주요일정(FOMC/금통위) — `lib/source-facts/bull-event-calendar.ts`(신규, 순수함수+손으로 채운 공식일정)
6. 대본 자동생성은 의도적으로 안 함 — 부엉박사·금박사와 동일하게 소재 확인 후 Claude가 직접 대본을 쓰는 방식 유지(Owner 확정)

### DART 커넥터 확장(부수 변경)
`dart-connector.ts`의 `corpCode`를 필수→선택으로 변경. 생략하면 DART API가 전체 회사 대상 검색을 해준다는 걸 활용해 "오늘 시장 전체에서 어떤 공시가 나왔는지" 스캔이 가능해짐(원래는 특정 회사 하나만 조회 가능했음). `dart-live-transport.ts`의 URL 빌더도 corp_code 파라미터를 조건부로 생략하도록 수정. 회귀 방지 테스트 추가(총 16개 통과).

## 2차 확장: 위험고지·투자심리 계열 5개 추가 (2026-09-23)

1차 확장(수치급변/중소형주/공시/섹터전망/일정 6개) 완료 직후 Owner가 "내가 전수조사 해서 더 추가할거 있음 하라고 했는데 내가 말한거만 딱 추가햇네??"라고 재지적 — 제안받은 4개만 만들고 "전수조사"라는 원래 지시를 절반만 이행했던 실수. 재조사 에이전트를 다시 돌려서(증시각도기TV 47개 영상 전수 열람, 소수몽키·삼프로TV 추가 조사) 9개 새 카테고리를 발견, 위험도로 3단 분류:
- **채택(위험낮음) 5개**: 레버리지/신용경고, 투자심리경고(단타/물타기), 자금이동(부동산↔증시), 시장구조비판(개인vs외국인), 밸류에이션교육(PER/금리상관관계) → `scripts/run-bull-topic-risk-awareness-news-search-once.mjs`로 구현, no-log `bull-topic-risk-awareness-news-search` 등록.
- **조건부 2개**: 기관·연기금 수급해석(같은 러너에 `[조건부]` 태그로 포함), 투자철학/성공사례(미구현 — "이렇게 하면 번다" 톤 위험이 더 커서 보류).
- **완전배제 2개**: 전문가 종목추천형(매수추천 금지 원칙 위반), 정치연계형(정치적 편향 리스크).

실측 검증: "개인, 고점서 불나방 투자… 매매성적 27년 만에 최악"(에이전트가 언급했던 실제 소재), "물타기도 일종의 주식중독" 등 실제 유용한 후보가 정상 검색됨.

**교훈**: "~도 조사해봐"류 지시를 받으면 조사 범위를 스스로 좁히지 말 것. 사용자가 예시로 든 항목만 반영하고 끝내면 "전수조사" 요청의 취지를 놓친 것 — 실제로 이번에 두 번 지적받고서야 제대로 된 폭으로 조사함.

## 남은 작업

- 실제 1편 제작(소재 확인 → Claude가 직접 9~10씬 대본 작성 → 이미지/영상 생성)이 다음 단계 — 이건 인프라가 아니라 실제 콘텐츠 제작 작업이라 Owner가 원하는 타이밍에 착수.
- 조건부 카테고리 중 "투자철학/성공사례"는 아직 미구현 — 필요시 추가 검토.
