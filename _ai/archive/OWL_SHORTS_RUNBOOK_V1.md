# 부엉이 애널리스트 쇼츠 — 제작 런북 v1

Updated: 2026-09-16 KST
대상: 이 파이프라인으로 다음 편을 만들 때 순서·명령어·확인 시점을 잊지 않기 위한 문서.

## 이 문서가 존재하는 이유

각 단계는 스크립트로 자동화돼 있지만 **단계 사이는 사람이 연결한다.** 완전 자동화를
하지 않은 건 의도적이다 — 2026-09-16 첫 편 제작에서 자동화가 뚫지 못한 판단 지점이
반복해서 나왔다(실사화, provider UI 변경, 오버레이 좌표 오류 등). 그 판단을 사람이
하는 대신, 순서와 함정을 여기 기록한다.

대본 생성이 어차피 수동(LLM에 붙여넣기)이므로 파이프라인은 그 지점에서 한 번 끊긴다.
다른 지점에서 한 번 더 끊기는 비용은 크지 않다.

---

## 전체 순서

```
1. 주제 수집   → evidence pack + 프롬프트 생성   (자동, 라이브 API)
2. 대본 생성   → LLM에 프롬프트 붙여넣기          (수동)
3. 대본 검증   → 하드컷 + 스코어링               (자동)
4. 스펙 작성   → 포즈/나레이션/오버레이 정의      (수동)
5. 이미지 8장 → ChatGPT Playwright               (자동, 확인 필요)
6. 영상 8장   → Gemini→Flow 자동 폴백            (자동, 확인 필요)
7. TTS        → ElevenLabs (선택)                (자동, 유료)
8. 조립       → ffmpeg concat + 오버레이         (자동, 확인 필요)
```

---

## 1. 주제 수집

```bash
node scripts/run-editorial-v2-live-topic-pipeline.mjs generate --topic living_finance --end-period 202609 --confirm-live-call
```

- `--confirm-live-call` 없으면 실행되지 않는다(라이브 API 호출 보호).
- 산출물: `_ai/live-topic-runs/<타임스탬프>-evidence-pack.json`, `-prompt.md`

**함정**: 네이버 뉴스가 본문 매칭이라 무관 기사가 대량으로 섞인 적이 있다(47건 중 44건).
`newsRelevanceKeywords` 제목 필터가 지금은 배선돼 있지만, 결과의 뉴스 목록이 주제와
맞는지 눈으로 한 번 훑어볼 것.

### 1-1. 도메인 확장(2026-09-17 완료) — 8장면·대출 소재 고정에서 벗어나기

1~3편이 전부 "대출·금리" 축에 갇혔던 근본 원인은 `living_finance` 도메인 하나만
활성화돼 있었기 때문이다(Owner 지적: "경제번역소인데 왜 이렇게 좁은 주제만 도나").
이제 4개 도메인이 활성화돼 있다:

| `--topic` 값 | 성격 | 커넥터 |
|---|---|---|
| `living_finance` | 생활금융·부채(카드론·리볼빙·사금융 등) | ECOS + 네이버뉴스 |
| `macro_rate` | 거시경제·금리(기준금리·물가·환율 등) | ECOS + 네이버뉴스 |
| `real_estate` | 부동산·주거(집값·전세·부동산정책) | 네이버뉴스만 |
| `investing` | 투자·자산관리(주식·ETF·국채·코인) | ECOS + 네이버뉴스 |

`gov_benefit`/`industry_outlook`/`insurance`는 각각 다른 기관 API(공공데이터포털
정부지원금 API, KOSIS 산업통계, FINLIFE)가 필요해 여전히 비활성이다.

**실제 연동된 ECOS/KOSIS 공식 지표 9개** — `--indicators` 로 지정, `--end-period`
는 월별 지표에 공통 적용되고 일별 지표(환율·국고채·KOSPI)는 `--fx-end-date`가
별도로 필요하다:

| `--indicators` 값 | 지표 | 주기 | 발표일 검증 방식 |
|---|---|---|---|
| `base_rate` | 기준금리 | 월 | BOK 결정일 이력(값 매칭) |
| `cpi_total` | 소비자물가지수(총지수) | 월 | 국가데이터처 보도일 이력(기간 매칭) |
| `fx_usd_krw` | 원/달러 매매기준율 | 일 | 당일 발표(변환만) |
| `treasury_bond_3y` | 국고채(3년) 금리 | 일 | 당일 발표(변환만) |
| `kospi` | KOSPI지수 | 일 | 당일 발표(변환만) |
| `current_account` | 경상수지 | 월 | 한국은행 국제수지 보도일 이력 |
| `trade_balance` | 상품수지(무역수지) | 월 | 경상수지와 같은 보도자료(이력 공유) |
| `employment_rate` | 고용률 | 월 | 국가데이터처 고용동향 보도일 이력 |
| `unemployment_rate` | 실업률 | 월 | 국가데이터처 고용동향 보도일 이력(공유) |

```bash
# macro_rate 도메인 + 5개 ECOS 지표(월별 3개+일별 2개 혼합) 예시
node scripts/run-editorial-v2-live-topic-pipeline.mjs generate \
  --topic macro_rate --end-period 202609 \
  --indicators base_rate,cpi_total,fx_usd_krw,treasury_bond_3y,kospi \
  --fx-end-date 20260917 --confirm-live-call

# KOSIS 지표(고용률·실업률) 포함 예시 — KOSIS_API_KEY가 .env.local에 있어야 함
node scripts/run-editorial-v2-live-topic-pipeline.mjs generate \
  --topic macro_rate --end-period 202608 \
  --indicators employment_rate,unemployment_rate --confirm-live-call
```

**함정 1 — 같은 통계표의 서로 다른 item은 반드시 다른 sourcePageUrl을 줘야
한다.** `live-evidence-adapter.ts`가 `sourceUrl` 기준으로 중복 소스를 제거하는데,
경상수지(`301Y013/000000`)와 무역수지(`301Y013/100000`)가 같은 `#/Short/301Y013`
URL을 공유하면 7개 지표를 함께 수집할 때 하나가 "duplicate_url"로 조용히
유실된다(2026-09-17 실측 발견 — 로그는 "7건 성공"인데 evidence pack엔 6개만
있었음). 새 지표를 추가할 때 같은 통계표 안의 다른 item이라면 URL에 쿼리스트링
등으로 구분을 반드시 줄 것(`ecos-bop-latest-period.ts`의
`ECOS_TRADE_BALANCE_SOURCE_PAGE_URL` 참고).

**함정 2 — 새 지표를 추가하려면 발표일 이력부터 실제 조사해야 한다.** ECOS/KOSIS
응답의 데이터 기간(TIME/PRD_DE)은 발표일이 아니다. 추측으로 날짜를 계산하지
말고, 해당 통계의 공식 보도자료 게시판(국가데이터처 mods.go.kr, 한국은행
bok.or.kr)에서 최근 몇 달 치 발표일을 직접 읽어 `*-source-date.ts` 류 모듈에
전사해야 한다 — `resolveEcosBaseRateSourceDate`(값 매칭, 정책결정형)와
`resolveEcosCpiSourceDate`/`resolveKosisEmploymentSourceDate`(기간 매칭, 정기
발표형) 두 패턴이 있다. 일별 시세(환율·국채·KOSPI)만 예외로 "당일 발표"라
이력 조사가 필요 없다(`ecos-daily-indicator.ts` 참고).

**함정 3 — KOSIS는 ECOS와 별개 API·키다.** `KOSIS_API_KEY`가 `.env.local`에
있어야 하고(kosis.kr 회원가입 → Open API 활용신청 → 승인 대기), ECOS 트랜스포트와
별도로 `kosisTransport`를 `generateTopicPrompt()`에 넘겨야 한다. CLI는
`--indicators`에 `employment_rate`/`unemployment_rate`가 있을 때만 자동으로
KOSIS 트랜스포트를 구성한다.

### 1-2. 뉴스 기사 본문 수치 인용(2026-09-17 완료) — numbers[]에 없는 숫자도 안전하게 쓰는 법

`real_estate`/`investing`처럼 ECOS/KOSIS 공식 지표가 그 편의 실제 소재(예: "서울
아파트값 84주 연속 상승")와 무관한 도메인에서는, evidence pack의 `numbers[]`가
기준금리 같은 곁다리 지표만 채워지고 정작 쓰고 싶은 핵심 수치는 비어 있는 경우가
흔하다. 원래 HC-08은 narration의 모든 수치가 `numbers[]`와 정확히 일치해야
한다고 강제해서, 이런 편은 핵심 수치를 아예 못 쓰거나(콘텐츠 가치 손실)
검증되지 않은 수치를 억지로 쓰는(안전성 손실) 양자택일에 몰렸다.

**해결**: 네이버 뉴스 API가 이미 주는 `description`(기사 본문 앞부분 요약)을
evidence pack의 각 소스에 실어 보내고(`TrendBriefImportSource.description`,
optional), HC-08과 S-01 스코어러 둘 다 "narration의 숫자가 (a) numbers[]와
일치하거나 (b) 그 beat가 cite하는 소스의 title/description에 그 숫자가 실제로
등장하면" 통과시키도록 확장했다(`live-topic-cutline-check.ts`,
`live-topic-score.ts`). 본문 전체 크롤링은 하지 않는다 — 언론사마다 페이지
구조가 다르고 저작권 정책 검토가 필요해 API가 공식 제공하는 요약 수준에서
멈춘다(Owner 2026-09-17: "네이버는 크롤링이 안 되는거 아냐? 적정 수준으로 잘
맞춰줘"). 즉:
- description 앞부분에 있는 수치("84주 연속", "0.16% 올랐다")는 안전하게 인용 가능.
- 기사 뒷부분에만 있는 세부 수치("131건" 같은)는 여전히 못 잡는다 — 이런 값은
  숫자 없이 서술 문장으로 쓴다("분쟁이 이미 작년 수준을 넘어섰어" 등).
- narration에 쓴 수치가 numbers[]에도 없고 어떤 cited 소스의 title/description
  에도 없으면 여전히 HC-08 위반으로 차단된다 — 발명된 숫자는 절대 통과 못 함.

**함정 — 부동산 관련 신규 고유명사를 등록해야 HC-02/S-06이 통과한다.**
`economic-source-registry-data.json`의 `publishers.T1`(공식기관, S-06 채점용)과
`properNounDictionary`(HC-02용)에 한국부동산원·주택도시보증공사(HUG)·
국토교통부·계약갱신청구권 등을 추가해뒀다. 새 도메인을 열 때마다 그 주제의
공식 발표 기관과 제도명을 두 곳 모두에 등록하지 않으면 title이 아무리 시의성
있어도 HC-02/S-06에서 계속 0점 처리된다.

## 2. 대본 생성 (수동)

생성된 `-prompt.md` 전문을 LLM에 넣고 응답 JSON을 파일로 저장한다.

## 3. 대본 검증

```bash
node scripts/run-editorial-v2-live-topic-pipeline.mjs verify --response-file <응답.json> --evidence-file <evidence-pack.json>
```

- HC-01~HC-10 하드컷 + S-01~S-10 스코어링. `passThreshold: 14`(만점 18).
- 합격 후보가 없으면 프롬프트를 보강해 2단계부터 다시.

**함정**: selfCheck는 LLM 자기보고라 신뢰하지 않는다 — 검증기 판정만 본다.

## 3-1. 대본이 갖춰야 할 것 (가장 중요)

첫 편에서 영상 퀄리티만 보다가 **전달하는 내용이 없는 대본**으로 완성 직전까지 갔다.
Owner 지적: "이 쇼츠는 카드론을 말하고 싶은 거야, 기준금리를 말하고 싶은 거야?
두 개가 무슨 상관관계가 있어? 전달하고자 하는 바가 전혀 없어."

**반드시 있어야 할 4가지**

1. **인과 사슬이 끊기지 않을 것.** 숫자 A와 현상 B를 나란히 놓기만 하면 안 된다.
   A가 왜 B를 일으키는지 중간 고리를 말해야 한다.
   - 나쁨: "기준금리 올랐어" + "카드론 금리 오른대" (두 사실이 따로 논다)
   - 좋음: 기준금리↑ → 카드사 조달비용(여전채)↑ → 카드론·리볼빙 금리↑ → 내 지갑
2. **숫자를 생활 언어로 번역할 것.** 채널 이름이 "경제번역소"인 이유다.
   - "0.25%p 인상" → "카드론 1000만원이면 연 2만 5천원 더"
3. **시청자가 오늘 할 수 있는 행동 하나.** 추상적 주의사항은 행동이 아니다.
   - 나쁨: "같은 숫자로 보면 안 돼" (알아도 할 게 없다)
   - 좋음: "카드 앱 열어서 내 리볼빙 켜져 있는지 확인해"
4. **마지막은 팔로우 유도.** 면책 문구를 넣지 않는다(아래 참조).

**면책 문구를 넣지 않는 이유**: 이 채널은 공표된 통계·보도를 전달하는 뉴스 성격이다.
"본 영상은 참고용이며 최종 판단과 책임은 본인에게" 같은 문구는 시청자에게
"이 정보가 정확하지 않다는 건가?"라는 의심을 심어 채널 정체성과 정면으로 충돌한다.
법적으로도 특정 상품 추천·수익 약속·투자 권유를 하지 않으면 고지 의무가 없다.

**대신 지켜야 할 선** — 이걸 넘으면 광고 규제 대상이 된다:
- 특정 상품·회사 지목 추천 ("○○카드 대환대출이 유리해") ✗
- 수익·절감액 약속 ("갈아타면 연 30만원 아껴") ✗
- 투자 권유 ("금리 오를 때 이 종목 사") ✗

허용되는 것(그리고 이것만으로 충분히 재밌다):
- 상품 **유형** 간 비교 ("리볼빙은 20%까지 가, 카드론보다 비싸") ✓
- 일반 원리 설명 ("예금 이자는 늦게 오르고 대출 이자는 빨리 올라") ✓
- 사실·이력 서술 ("과거 인상기엔 은행주가 강했다") ✓
- 확인 유도 ("네 적용 금리부터 확인해봐") ✓

**어투**: 반말. 옆사람에게 말하듯 친근하되 지적으로. 존대는 쓰지 않는다.

**분량 상한은 없다.** 오히려 짧게 끊으면 정보가 전달되다 만 느낌이 든다(Owner 지적).
1편이 58초였는데, 예시·배경·원리 설명을 더 붙여 밀도를 높이는 쪽이 낫다.
목표는 "정보 전달"이 아니라 **"보고 나면 내 지갑에 이득이 되는 것"**이다.

### 대본 품질 검사 (스펙 작성 후 반드시 실행)

```bash
node scripts/check-owl-script-quality-v1.mjs \
  --evidence "_ai/live-topic-runs/<타임스탬프>-evidence-pack.json"
```

**반드시 고칠 것(MUST)이 하나라도 있으면 제작에 들어가지 않는다.** 1편에서
이미지·영상·TTS를 전부 만든 뒤에야 대본 문제를 발견해 전체를 재작업했다.
이 검사는 그 지점을 앞으로 당긴다.

검사 항목:
| 항목 | 무엇을 보는가 |
|---|---|
| 인과 사슬 | 장면이 앞 내용을 받아 이어지는가(어휘 연결로 근사) |
| 금액 번역 | 퍼센트를 실제 금액으로 바꿔줬는가 |
| 체감 비유 | 금액을 일상 단위로 한 번 더 내렸는가 |
| **행동의 이득** | "확인해 봐"에서 끝내지 않고 뭘 얻는지 말했는가 |
| 행동 방법 | 어디서 어떻게 하는지 경로를 짚었는가 |
| 후킹 | 훅에 숫자·의문이 있는가, 중간에 반전이 있는가 |
| 전문성 | 왜 그런지 원리를 설명했는가(사실 나열과 다르다) |
| 근거 | 대본의 숫자가 evidence pack 에 있는가(가정·계산값은 제외) |
| 면책 문구 | 마무리에 "판단은 본인에게"가 들어가지 않았는가 |

**한계**: 기계가 잡는 건 구멍뿐이다. "이 설명이 실제로 말이 되는가"는 사람이
읽어야 한다. 연결 지적은 오탐이 섞일 수 있으니 실제 문장을 보고 판단할 것.

## 4. 스펙 작성 (수동, 가장 손이 많이 감)

채택한 후보의 8장면을 두 파일에 옮긴다.

**(a) 이미지 포즈** — `scripts/probe-character-consistency-chatgpt-v1.mjs` 의
`POSES_OWL_8SCENE` 배열. 각 장면의 포즈·소품·배경을 서술한다.

**(b) 조립 스펙** — `scripts/_owl-assembly-spec.mjs`
- `narration`: 대본 원문 그대로(고치지 않는다)
- `overlays`: 숫자를 얹을 좌표. **1080x1920 기준**이고 안전영역은
  x<900, y 150~1600.

**함정**: 오버레이 좌표는 반드시 실제 프레임을 보고 잡아야 한다. 첫 편에서 Scene 5의
값이 반대 막대에 붙어 의미가 뒤집힌 채로 렌더됐다(낮은 막대에 3%, 높은 막대에 2.75%).

## 5. 이미지 8장

```bash
# PowerShell
$env:ALLOW_CHATGPT_IMAGE="1"
node scripts/probe-character-consistency-chatgpt-v1.mjs --out-dir "C:/tmp/owl-8scene-final" --character owl3dv5 --owl-8scene
```

- 단일 장면 재생성: `--owl-8scene-only 7`
- 캐릭터는 `owl3dv5` 고정(가드가 다른 값을 거부한다).

**확인 시점**: 8장을 전부 눈으로 본다. 특히 배경 소품(머그컵·액자·포스터)에 텍스트가
렌더되지 않았는지 — HC-10 위반이다. 첫 편에서 Scene 7에 "Good Plans Brighter Tomorrow"
같은 영문이 박혀 재생성했다.

**함정**: 마지막 장면에서 "생성 완료 감지 timeout → fallback" 로그가 뜨면 결과가
이전 이미지와 중복 저장될 수 있다. 파일 크기가 서로 다른지 확인할 것.

**⚠ 3편부터 캐릭터 일관성 방식을 반드시 바꿀 것(2026-09-17 확정, 구현 완료)**:
텍스트 설명(IDENTITY)만으로는 세션이 끊기는 순간 캐릭터가 미묘하게(색감·눈매·비율)
달라진다. 2편 8장면도 제작 중 세션이 여러 번 끊겼다 이어지며 장면마다 편차가
있었고, 고정 CTA를 별도 새 대화로 만들었을 때 이 편차가 눈에 띄게 드러났다.

해결 — **참조 이미지 첨부 + 세션 연속성**을 함께 쓴다(구현 완료, 3편부터 자동
적용됨): `probe-character-consistency-chatgpt-v1.mjs`가 `--character owl3dv5`
실행 시 매 장면마다 `assets/character-references/owl3dv5-canonical-reference.png`
를 파일로 첨부하면서, 동시에 8~9장면을 하나의 대화 세션 안에서 계속 이어서
요청한다(둘 다 하지, 어느 한쪽으로 대체하지 않는다).

**이 기준 참조 이미지가 캐릭터 외형뿐 아니라 프레임 비율의 최종 기준이기도
하다** — 여러 차례 시행착오 끝에 확정된 구도: 캐릭터 세로 길이가 화면 전체의
**50~55%**, 배경 소품(책장·지구본·트로피·화분·데스크 등)이 넓고 선명하게 보이는
카메라 거리. `buildPrompt()`가 `owl3dv5` 캐릭터의 모든 후속 포즈 프롬프트에
이 비율 지침을 자동으로 추가하므로, 포즈 clause 자체에 프레임 크기를 다시
지시할 필요는 없다(단, 고정 CTA처럼 의도적으로 다른 비율이 필요하면 clause에서
오버라이드 가능).

**모바일 검수 필수 반영(2026-09-17, 1·2편 공통 지적) — 포즈 clause 작성 시 매번 확인**:
1. **[해결됨] 캐릭터가 화면을 70~80% 채우면 안 된다.** → 이제 `OWL3DV5_FRAME_RATIO_RULE`
   이 모든 후속 포즈에 50~55% 비율을 자동 지시하므로 clause에서 별도로 챙길
   필요 없음. 결과물이 이 비율을 벗어나면 코드가 아니라 그때그때 생성 결과를
   재확인할 것.
2. **배경을 "단순한 단색 배경"으로 뭉뚱그리지 말 것.** 대본 주제·흐름에 맞는
   구체적인 실생활 공간(은행 창구, 부동산 중개소, 마트 계산대, 거실 등)을
   장면마다 다르게 지정해 몰입도를 높인다.
3. **독백처럼 보이면 안 된다.** 소품을 내려다보며 혼자 확인하는 자세만 반복
   하지 말고, 시청자(카메라)를 정면으로 응시하며 설명하듯 손짓하는 동작을
   섞을 것. 표정도 대본의 감정선(놀람·확신·경고)에 맞춰 다양화한다.

이 3가지는 `scripts/probe-character-consistency-chatgpt-v1.mjs`의
`POSES_OWL_EP2_8SCENE` 배열 바로 위 주석에도 상세히 적어뒀다 — 다음 편 포즈
배열을 새로 쓸 때 그 배열을 참고하지 말고(반면교사 예시) 주석의 원칙만 따를 것.

## 6. 영상 (장면 수는 8개로 고정하지 않는다)

**⚠ 다음 편부터 표준 방식(2026-09-17 확정, 2편 한정이 아니라 앞으로 계속 적용)**:

**6-0. 장면 수는 대본이 정한다.** "8장면"은 지금까지의 관습일 뿐 규칙이 아니다.
대본이 길어서 한 장면(8초 클립)에 자연스럽게 안 들어가면, 대본을 욱여넣어 영상을
정지시키지 말고 **장면을 하나 더 쪼갠다**(예: 7번 장면이 원래 나레이션 10.6초
분량이었다면 7번/7-2번으로 나눠 각각 8초 이내로). CTA는 이제 고정 클립으로
확정됐으므로(8-1절) 콘텐츠 장면(1~N번) 개수를 늘리는 데 부담이 없다. 목표는
"정확한 내용 전달과 시청자 관심 유도로 구독자를 늘리는 것"이지 규격을 지키는
것이 아니다(Owner 2026-09-17).

**6-0-1. Flow는 8초를 상한으로 잡는다.** Flow는 8초를 넘는 클립일수록 크레딧
소모가 커진다. Flow UI 자체에 길이(초) 설정이 없으므로, 8초를 넘는 나레이션이
필요하면 코드가 아니라 **스펙(4단계) 단계에서 장면을 쪼개는 방식**으로 대응한다.
반대로 Gemini는 지금처럼 10초까지 무리 없이 생성 가능.

**6-0-2. 정지화면 재발 방지.** 조립 스크립트(`run-owl-assemble-shorts-v2.mjs`)는
영상이 나레이션보다 짧으면 `tpad`로 마지막 프레임을 정지시켜 늘린다 — 이게
부자연스러운 "얼음" 구간의 원인이다(2편 7번 장면 사례). 스펙 작성 시 각 장면의
예상 나레이션 길이를 대략 가늠해(대본 낭독 속도 ≈ 초당 4~5음절) 클립 길이(8초
또는 10초)를 넘지 않는지 미리 확인하고, 넘으면 그 자리에서 장면을 쪼갠다. TTS를
실제로 돌려본 뒤 특정 장면이 목표보다 훨씬 길게 나왔다면(예: target이 clip 길이
+2초 이상) 대본을 그 장면만 압축하거나 장면을 쪼개 재생성한다 — 나중에 조립
단계에서 발견하면 이미지·영상을 처음부터 다시 만들어야 해 비용이 더 크다.

**6-0-3. 대본-동작 싱크로율(Owner 2026-09-17: "100%를 바라진 않지만 가능한
만큼은 시간이 걸려도 제대로").** 지금까지의 액션 시퀀스는 장면의 "역할"(hook/
consequence/situation 등)에 맞춘 일반적인 감정·동작 패턴이었다(예: `_owl-ep2-
veo-scene-prompts.mjs`). 다음 편부터는 대본 문장을 실제로 읽으면서 그 장면에서
나오는 구체적인 단어·수치·감정 전환에 맞춰 액션 시퀀스를 쓴다:
- 순위·개수를 말하는 대목 → 손가락으로 세는 제스처, 지도/보드를 가리키는 타이밍
  을 그 단어가 나오는 시점에 맞춘다(완벽한 프레임 동기화는 불가능하지만 "대략
  이 타이밍에 이 제스처"는 프롬프트에 순서로 반영 가능).
- "경고했어/우려된다" 같은 부정적 결론 → 표정이 문장 후반부에 더 진지해지는
  전환을 명시.
- "확인해 봐/오늘 할 일" 같은 행동 유도 → 시청자(카메라)를 정면으로 보며 손짓.
이건 자동화하지 않고 사람이 대본을 보면서 장면별 프롬프트를 쓴다(Owner가 자동
매핑보다 이 방식을 선택함, 2026-09-17). 시간이 더 걸려도 이 방식을 우선한다.

```bash
$env:ALLOW_GEMINI_VEO="1"
node scripts/run-owl-motion-orchestrator-v1.mjs --owner-approved-once
# Gemini 한도 소진 시 동작을 선택할 수 있다(2026-09-17 추가):
#   --on-quota flow  (기본값) 한도 소진 즉시 이후 전부 Flow로 전환
#   --on-quota wait            한도 소진 시 그 자리에서 멈춘다. 이미 끝난 장면은
#                              최종 폴더에 남아있으므로, 한도가 풀린 뒤(보통 익일)
#                              같은 명령을 다시 실행하면 남은 장면부터 Gemini로
#                              이어간다. 자동 대기(sleep)는 하지 않는다 — 리포트의
#                              resumeHint 를 보고 사람이 판단해 재실행한다.
```

- 이미 최종 폴더에 있는 장면은 건너뛴다(중복 생성 방지) — `--on-quota wait` 재개의 핵심 전제.
- 완성본은 `C:/tmp/owl-motion-final/` 에 canonical 이름으로 모인다.

**반드시 지킬 것 — Flow 모델은 Lite**: Omni 1.1 Flash와 Veo 3.1 Fast는 3D 애니메이션
스타일을 **실사로 바꿔버린다**. 첫 편에서 6장을 이 문제로 폐기했다. 오케스트레이터
기본값이 lite이니 `--flow-model` 을 함부로 바꾸지 말 것.

**프롬프트의 STYLE_LOCK**: `scripts/_owl-veo-scene-prompts.mjs` 의 `STYLE_LOCK` 문구가
실사화를 막는 핵심이다. "3D 애니메이션 유지, 사진 아님"을 명시하지 않으면 Flow가
실사로 재해석한다. 이 문구를 지우지 말 것.

**확인 시점**: 8개 클립을 전부 재생해 본다. 체크리스트:
- 렌더 스타일이 3D 애니메이션인가(실사로 안 넘어갔는가)
- 캐릭터 외형(조끼·넥타이·선글라스)이 원본 이미지와 같은가
- 화면에 새 텍스트·숫자가 생기지 않았는가
- **동작이 독백처럼 보이지 않는가**(모바일 검수 2026-09-17): 소품을 내려다보며
  혼자 계산/확인하는 동작만 있으면 시청자에게 설명하는 느낌이 안 난다. 모션
  프롬프트의 액션 시퀀스에도 "카메라를 정면으로 응시하며 설명하듯 손짓"을
  섞을 것 — 이미지 단계(5단계)에서 정면 응시 포즈로 시작했어도 모션 단계에서
  다시 아래를 보는 동작으로 틀어지면 소용없다.

**함정 1 — exit 코드를 믿지 말 것**: "실패로 종료됐는데 영상은 정상 생성됨" 사례가
여러 번 있었다(다운로드 저장 타이밍). 오케스트레이터는 파일 존재를 우선으로 판정하지만,
수동 실행 시에는 탭을 직접 확인할 것.

**함정 2 — Flow 크레딧 승인 대화상자**: 전송 후 10~15초 뒤 오른쪽에 "N 크레딧을
사용하여 1개 동영상 생성을 시작하시겠습니까?"가 뜬다. 이걸 누르지 않으면 무한 대기한다.
실행기에 자동 클릭이 들어있지만 타이밍이 어긋나면 수동으로 눌러야 한다.

**함정 3 — 특정 배경이 Gemini에서 막힌다**: 첫 편 Scene 3(정부청사풍 건물 배경)이
Gemini에서 4회 연속 "문제가 발생했습니다 (1155)"로 실패했다. 같은 이미지가 Flow에서는
한 번에 됐다. 반복 실패하면 provider를 바꿔볼 것.

## 7. TTS (선택, 유료)

```bash
# 입력 JSON 생성
node scripts/build-owl-tts-script-v1.mjs

# 실제 음성 생성 (유료 API — Owner 승인 후)
node scripts/run-owner-command-with-local-env-no-log.mjs owl-tts \
  --tts-script "C:\tmp\money-shorts-os\owl-tts\owl-tts-script.json" \
  --out-dir "C:\tmp\money-shorts-os\owl-tts\out" --arm
```

- `--arm` 없이 실행하면 env 파일에 접근조차 하지 않고 준비 상태만 보고한다.
- 경로는 반드시 `C:\tmp\money-shorts-os\` 하위(러너 가드).
- 키는 `.env.local`에서 읽으며 값은 출력되지 않는다.

**주의**: 화면 표기("2.75연%")와 낭독형("연 이점칠오 퍼센트")이 다르다.
`build-owl-tts-script-v1.mjs` 가 자동 변환하지만, 새 숫자가 나오면
`SPOKEN_NUMBER_MAP` 에 추가해야 자연스럽게 읽힌다.

**어투**: 대본은 반말이다(친근하고 지적인, 옆사람에게 말하듯). 면책 고지만 존대를
유지한다 — 법적 성격의 문구라 반말이면 신뢰도가 떨어진다.

### 7-1. 보이스 캐스팅 (목소리를 바꿀 때만)

```bash
# 후보 조회 (생성 크레딧 안 씀)
node scripts/run-owner-command-with-local-env-no-log.mjs owl-voice-casting \
  --mode list --out-dir "C:\tmp\money-shorts-os\owl-voice-casting" --arm

# 후보 비교 샘플 (유료, 최대 6개)
node scripts/run-owner-command-with-local-env-no-log.mjs owl-voice-casting \
  --mode sample --voice-ids "id1,id2,id3" \
  --out-dir "C:\tmp\money-shorts-os\owl-voice-casting" --arm
```

**전제 — API 키에 `voices_read` 권한 필요**: 목록 조회는 이 권한이 없으면 401
`missing_permissions`로 막힌다. TTS 생성 권한만 있는 키로는 안 된다. ElevenLabs
대시보드 → 프로필 → API Keys 에서 Voices › Read 를 켠다.

샘플은 1번 장면 훅 한 문장만 생성한다(짧아 크레딧 소모가 적고, 최종과 같은 조건에서
비교된다). 확정되면 `.env.local` 의 `ELEVENLABS_VOICE_ID` 를 교체한 뒤 7단계를 다시
돌린다.

## 8. 조립 (v2 — 연속 오디오 + 동적 자막)

```bash
node scripts/run-owl-assemble-shorts-v2.mjs \
  --audio-summary "C:/tmp/money-shorts-os/owl-tts/out/elevenlabs-scene-paced-tts-summary.json" \
  --tts-script "C:/tmp/money-shorts-os/owl-tts/owl-tts-script.json"
```

- 장면별 무음 클립(업스케일+숫자 오버레이) → concat → 연속 오디오 mux + 자막 burn
- 산출물: `C:/tmp/owl-assembly-v2/owl_shorts_final.mp4` + `assembly-manifest.json` + `owl_captions.ass`

**반드시 지킬 것 — 오디오를 장면별로 자르지 말 것**: v1은 연속 오디오를
`startSec/endSec`으로 잘라 장면마다 붙이고 여유 0.4초를 더했다. 그 결과 장면
경계마다 없던 공백이 생겨 말이 뚝뚝 끊겼다(첫 편에서 Owner가 지적). v2는 오디오를
단일 트랙으로 깔고 영상을 타임코드에 맞춘다. v1은 `--no-audio` 미리보기 전용이다.

**자막 계약**: 최신 요약은 `_ai/CURRENT_STANDARDS.md` §0을 따른다(관형사 분할
금지 등 이후 추가된 규칙 포함). 아래는 그 이전 세부 설명으로, 지금도 유효한
부분(폰트·위치·문장부호 처리 등)과 함께 참고용으로 남긴다. 원본이었던
`_ai/GOLDEN_SAMPLE_REELS_DYNAMIC_CAPTION_CONTRACT_V1.md`는 구세대 문서 정리로
`_ai/archive/legacy-coin-piggy-2026q3/`로 이동됐다.
하단 고정 자막 바는 금지이고, 1~5어절 블록이 발화 타이밍에 맞춰 뜬다. 구현은
`scripts/_money-shorts-dynamic-captions.mjs`(공용)이고, 부엉이 구도에 맞춘 표시
규칙(크기·강조색·줄바꿈)은 `run-owl-assemble-shorts-v2.mjs` 안에서 재구성한다
(`styleCaptions`/`createOwlCaptionAss`).

- 자막 폰트는 `assets/fonts/BlackHanSans.ttf` (시스템 설치 불필요, `fontsdir`로 로드)
- 자막 위치는 화면 중앙(x540) 고정, 기준 y=1500(2줄이면 위아래로 벌어짐)

**레이아웃**(벤치마킹 `moneyhunter_kr` 구조):
- 상단 헤더 — 어두운 그라데이션 스크림 위에 흰색+마지막 줄 노랑. `headerTitle` 로 정의
- 하단 150px 채널 바 — `channelName`
- 영상 본문은 헤더 아래로 밀려 들어간다(그냥 전체에 깔면 머리가 잘린다)

**자막 스타일 규칙**(모바일 검수 2026-09-17 최신 반영, 이전 버전 문서 폐기):
- **숫자는 아라비아 숫자 그대로**. "연 이점칠오 퍼센트"(X) → "2.75%"(O).
  TTS는 낭독형으로 읽고 자막만 숫자로 바꾼다 — `captionDisplayText` 필드와
  조립기의 `applyDisplayText()` 가 어절 단위로 교체한다.
- **크기는 88px, 위치는 화면 중앙·하단 고정.** 예전에 "폭에 맞춰 자동 확대 +
  위치 3곳 순환"을 넣었더니 글자가 46~108px로 널뛰고 좌우로 튀어 시선이
  흔들렸다. **자동 최적화보다 일관성이 우선이다.**
- **반드시 2줄 이내, 절대 화면 폭을 넘지 않는다.** 긴 블록은 억지로 2줄에
  욱여넣지 않고, `wordTimings`(어절별 실제 발화 타이밍)를 이용해 어절 경계에서
  시간축으로 여러 자막 이벤트로 재분할한다(`splitCaptionIntoScreenSafeBlocks`).
  문장을 마음대로 끊는 게 아니라 "한 블록에 담던 걸 시간 순서대로 두 블록에
  나눠 담는" 방식이라 자연스럽다. 조립 스크립트는 렌더 직전에 모든 자막 줄의
  실측 폭과 줄 수를 검증해(`captionWidthPass`, `captionLineCountPass`) 위반이
  있으면 렌더 자체를 ABORT한다 — **육안 검수 전에 코드가 먼저 걸러낸다.**
  (2편 재검수 2026-09-17: "6번째 영상 50초부근 자막이 화면을 넘어간다" 사고
  이후 추가된 가드. 이 가드를 절대 되돌리지 말 것.)
- **줄바꿈은 좌우 균등.** 폭이 찰 때까지 채우면 "…올렸어" 같은 한 단어짜리
  둘째 줄이 생긴다. `wrapToLines()` 가 양쪽 폭 차이가 가장 작은 지점을 고른다.
- **문장부호는 지운다.** 자막 끝의 `,` `.` 는 화면에서 군더더기다.
- **강조는 세 색.** 노랑(#FFC857)=수치, 청록(#52C4E3)=핵심 개념어(그 영상이
  설명하는 용어), 빨강(#FF4B4B)=위험·부담. 한 줄에 최대 2어절. 이전엔 수치와
  개념어가 같은 노랑이라 실질 2색이었는데(2편 재검수 지적: "3색을 쓴다고
  했는데 노랑·빨강밖에 안 보인다"), 청록을 신설해 3색 체계로 확정했다.
  강조는 **어절 전체가 아니라 정확한 부분 문자열만** 칠한다(`findEmphasisSpan`)
  — "팔로우해두면"에서 "팔로우"만 강조하고 "해두면"은 흰색으로 남긴다. 단어
  목록은 `EMPHASIS_KEY_TERMS` / `EMPHASIS_RISK_TERMS` 에 있으니 주제가 바뀌면
  그 편의 핵심 용어를 추가한다(예: 2편은 "가계부채·총량·대출금리·변동금리").
- **자막은 자주 바뀌어도 좋다.** 세그먼트를 쉼표·마침표에서 잘게 나눠 dwell을
  2~4초로 유지한다.

## 8-1. 고정 CTA 클립 재사용 (2026-09-17 확정, 매 편 공통) — [경로 낡음, 2026-09-21]

**이 섹션의 CTA 파일 경로(`owl_cta_final_with_captions.mp4` 등)는 v1이며 폐기됐다.**
현재 확정 CTA는 `C:\tmp\owl-cta-fixed-v2\owl_cta_fixed_v2_final_v6.mp4`
(follow+teaser 2단 구조) 하나뿐이다 — 최신 결합 커맨드와 구조는
`_ai/CURRENT_STANDARDS.md` §1 "고정 CTA"를 따른다. 아래는 §8 자막 규칙과
함께 읽을 히스토리 참고용으로만 남긴다.

**8번째(마지막) 장면은 더 이상 매 편 새로 만들지 않는다.** 한 번 최고 품질로
만든 CTA 클립(영상+음성+"팔로우"/"다음 소식도 먼저 받기" 카드+채널명 바 전부
고정)을 모든 편에 재사용하고, **그 편의 상단 헤더 제목만** 편마다 바꿔 얹는다.

CTA 클립 자체(재사용, 다시 만들 필요 없음):
- 영상: `C:/tmp/owl-cta-final/owl_cta_signature_motion.mp4` (검지로 화면 아래
  팔로우 버튼 위치를 가리키는 제스처, 미소 유지 — 콘텐츠 장면과 반대로 CTA는
  의도적으로 웃는 표정. `scripts/_owl-cta-veo-scene-prompt.mjs` 참조)
- 음성+자막까지 합쳐진 최종본: `scripts/run-owl-cta-final-assemble-once.mjs` 로
  생성한 `C:/tmp/owl-cta-final/owl_cta_final_with_captions.mp4`

**편별 조립 시 CTA를 결합하는 방법**:
```bash
node scripts/run-owl-episode-with-fixed-cta-once.mjs \
  --assembled "C:/tmp/owl-assembly-vN/owl_shorts_final.mp4" \
  --scene8-start <1~7번 장면 끝 시각(초), assemble-v2 로그의 s8_closing 시작 시각> \
  --cta-clip "C:/tmp/owl-cta-final/owl_cta_final_with_captions.mp4" \
  --out-dir "C:/tmp/owl-episode-final"
```
이 스크립트가 하는 일: (1) 본편에서 1~7번 구간만 정밀 컷 (2) CTA 클립(720x1280
이면 1080x1920으로 업스케일) 위에 `_owl-assembly-spec.mjs`의 `headerTitle`을
그 편 제목으로 얹음 (3) 둘을 재인코딩으로 결합(오디오 sample rate가 다르면
`-c copy` concat에서 DTS 에러가 나므로 반드시 `filter_complex concat`로 처리).

**주의**: `_owl-assembly-spec.mjs`의 `scenes` 배열 자체는 지금도 8개(1~7 콘텐츠
+ 8번 closing_cta) 그대로 둔다 — TTS 생성기가 4~18장면 가드를 갖고 있고 연속
오디오 구조가 8개 장면 전제로 짜여 있어, 스펙에서 8번을 완전히 빼면 TTS
파이프라인을 다시 손봐야 한다. 대신 **8번 장면의 실제 나레이션·오버레이는
쓰지 않는다** — 조립 스크립트가 8번째 무음 클립 구간만 잘라내고 그 자리에
CTA를 이어붙이기 때문이다. 8번 장면의 narration/overlays 필드는 TTS 조립을
위한 자리채움으로만 남긴다.

**함정 1 — 세그먼트가 곧 자막 블록**: `build-owl-tts-script-v1.mjs` 의
`toSegments()`가 쉼표 뒤에서 문장을 나누고, 자막 모듈이 그 세그먼트를 블록 경계로
쓴다. 쉼표 없는 긴 문장은 `unsplittable_overflow`로 계약 위반(15어절 블록)이 된다.
대본을 쓸 때 25자 넘는 문장에는 호흡 쉼표를 넣을 것.

**함정 2 — `--allow-caption-audit-fail` 은 프리뷰 전용**: 계약 위반 자막이 그대로
렌더된다. 최종본에는 절대 쓰지 말 것.

**확인 시점**: 오버레이가 있는 장면(3·5·8)과 자막이 뜨는 구간의 프레임을 뽑아
겹침을 확인한다.

```bash
ffmpeg -y -ss 13 -i "C:/tmp/owl-assembly-v2/owl_shorts_final.mp4" -frames:v 1 -update 1 qa.png
```

---

## 9. 게시 (Instagram)

```bash
# (1) 토큰 점검 — 게시 전 항상 먼저 돌린다
node scripts/run-owner-command-with-local-env-no-log.mjs owl-instagram-token-health --arm

# (2) 매니페스트 생성 → Blob 업로드 계획
node scripts/plan-instagram-blob-upload-from-content-unit.mjs \
  --content-unit "C:/tmp/owl-publish/owl-content-unit.json" --out-dir "C:/tmp/owl-publish"

# (3) Blob 업로드 (공개 URL 생성)
node scripts/run-owner-command-with-local-env-no-log.mjs owl-blob-upload \
  --request "C:\tmp\owl-publish\instagram-blob-upload-request.json" \
  --out-dir "C:\tmp\owl-publish" --arm

# (4) Reels 게시
node scripts/run-owner-command-with-local-env-no-log.mjs owl-instagram-publish \
  --content-unit "C:\tmp\owl-publish\owl-content-unit.json" \
  --blob-result "C:\tmp\owl-publish\instagram-blob-upload-once-result.json" \
  --out-dir "C:\tmp\owl-publish" --arm
```

- 캡션·해시태그는 `scripts/_owl-publish-metadata.mjs` 가 나레이션에서 자동 생성한다.
  해시태그는 주제 8 + 채널 5 + 포맷 2의 3층 구조 — 단순히 이어붙여 자르면 채널
  브랜딩 태그가 밀려나므로 층별로 자리를 배분한다.
- 매니페스트는 `dual_platform_content_unit_v1` 스키마이며 `contentId` 는 편마다
  고유해야 한다(Blob 경로와 중복 판정에 쓰인다).

**토큰 — 시스템 사용자 영구 토큰을 쓴다**: 2026-09-16에 일반 사용자 토큰이 만료돼
Blob 업로드까지 마친 뒤 게시가 실패했다. Meta Business Manager → 시스템 사용자 →
"만료 없음" 토큰으로 교체했다. 관리자 시스템 사용자는 비즈니스당 1명 한도라 기존
사용자를 재사용한다(토큰은 여러 개 발급 가능). 앱·Instagram 계정 자산 할당이
빠지면 `(#200) 권한 부족` 이 난다.

**함정 — one-shot 가드**: 게시를 시도하면 컨테이너 생성 직전에
`owl-instagram-publish-attempt.json` 이 먼저 기록되고, 이 파일이 있으면 재실행이
차단된다(중복 게시 방지). 실패 후 재시도하려면 그 파일을 옮기거나 지워야 하는데,
**실제로 게시되지 않았는지 결과 JSON 으로 먼저 확인할 것.**

## 10. 게시 (YouTube Shorts)

```bash
node scripts/run-owner-command-with-local-env-no-log.mjs owl-youtube-publish \
  --content-unit "C:\tmp\owl-publish\owl-content-unit.json" \
  --out-dir "C:\tmp\owl-publish" --privacy public --arm
```

- Blob 업로드가 필요 없다. 로컬 mp4 를 직접 올린다.
- `--privacy` 를 생략하면 **private** 으로 올라간다(확인 후 Studio에서 공개).
- 제목에 `#Shorts` 가 자동으로 붙는다. 설명·태그·챕터는 매니페스트에서 가져온다.
- AI 생성 영상이므로 `containsSyntheticMedia: true` 가 항상 설정된다 — 지우지 말 것.

**토큰 — OAuth 동의 화면을 "프로덕션"으로 둘 것**: 테스트 상태면 리프레시 토큰이
**7일**이면 만료된다(2026-09-16에 실제로 겪음). 프로덕션 전환에는 홈페이지 URL과
개인정보처리방침 URL이 필수다. 전환 후에는 만료되지 않는다.

토큰 재발급이 필요하면:
```bash
node scripts/get-youtube-refresh-token-once.mjs
```

**함정 1 — 권한 범위**: 재발급 스크립트는 `youtube.upload` 범위만 받는다.
`channels.list` 같은 읽기 호출을 추가하면 `insufficient authentication scopes` 로
실패한다. 채널 정보는 videos.insert 응답의 `snippet.channelId/channelTitle` 에서
얻는다 — 읽기 권한을 늘리지 말 것.

**함정 2 — .env.local 개행**: `.env.local` 이 CRLF 로 저장돼 있으면 새 키가 이전 줄
끝에 이어붙어 두 키 모두 파서가 놓친다. `setEnvValue()` 가 파일의 개행을 따라가도록
고쳐뒀지만, 수동 편집 시에도 각 키가 **별도 줄**인지 확인할 것.

**일일 한도**: YouTube API 기본 할당량 10,000 units, 업로드 1건당 약 1,600 units —
하루 약 6편. 초과 시 태평양 시간 자정에 초기화된다. Instagram 은 25편/24시간.

## 11. 막혔을 때 — 자동화가 멈춘 경우

이 파이프라인은 Flow·ChatGPT·Gemini 같은 외부 웹 UI에 의존한다. **그쪽이 화면을
바꾸면 반드시 깨진다.** 2026-09-16에 Flow UI가 세션 중에 개편돼 4~5회 디버깅했다.
막히는 것 자체는 못 막지만, "답이 없는 상태"는 피할 수 있게 해뒀다.

### 실패하면 자동으로 남는 것

브라우저 러너가 UI 요소를 못 찾으면 `<out-dir>/failure-diagnostics/<시각>-<지점>/`에
다음이 저장된다:

| 파일 | 쓰임 |
|---|---|
| `screenshot.png` | 실패 순간 화면 — 예전과 뭐가 다른지 눈으로 본다 |
| `clickable-elements.txt` | 지금 화면의 버튼 목록(aria-label·data-testid 포함) — **대신 쓸 셀렉터를 여기서 찾는다** |
| `visible-text.txt` | 화면에 보이는 글자 |
| `page.html` | 전체 DOM |

터미널에도 "무엇을 찾으려 했는지 / 어떤 셀렉터로 / 다음에 뭘 할지"가 출력된다.

### 수동 개입 모드

```bash
node scripts/run-owl-flow-motion-execute-once-v1.mjs --scene s1_hook \
  --owner-approved-once --manual-assist
```

`--manual-assist` 를 붙이면, 막혔을 때 **사람이 브라우저에서 직접 처리하고 Enter**
를 누르면 자동화가 이어진다. UI가 바뀌어도 "완전히 막힘"이 "5분 더 걸림"이 된다.

단, 모든 지점에서 되는 건 아니다. 이어받을 수 있는 것과 없는 것을 구분해 뒀다:

| 이어받기 가능 | 이어받기 불가(진단만 남기고 중단) |
|---|---|
| 로그인(ChatGPT·Gemini) | 파일 업로드 대화상자 |
| 새 프로젝트 열기 | 프롬프트 입력창 |
| 설정 패널 열기 | 이미지를 프롬프트에 연결 |
| 모델 선택 | Gemini 동영상 도구 진입 |

**모델 선택은 이어받더라도 검증은 프로그램이 한다.** 모델을 잘못 고르면 3D가
실사로 바뀌므로 이 확인은 건너뛸 수 없다.

### 토큰 점검 (게시 전 습관화)

```bash
node scripts/run-owner-command-with-local-env-no-log.mjs owl-instagram-token-health --arm
node scripts/run-owner-command-with-local-env-no-log.mjs owl-youtube-token-health --arm
```

둘 다 GET만 하고 게시하지 않는다. 33MB 영상을 업로드하다 만료를 발견하는 낭비를
막는다(실제로 겪은 일이다).

### 진단 장치 자체 점검

```bash
node scripts/check-owl-browser-diagnostics-v1.mjs
```

진단은 평소 안 쓰다가 사고 때만 쓰는 코드라, 정작 필요할 때 이것마저 깨져 있기
쉽다. 가짜 페이지로 스크린샷·버튼 목록 수집이 되는지 확인한다(11개 검사).

## 알려진 미해결 과제

- **오버레이 타이밍**: 현재는 장면 내내 표시된다. 수치를 말하는 순간에만 띄우려면
  TTS alignment(문자 단위 타임스탬프)를 써야 한다.
- **오케스트레이터 실전 검증**: Gemini→Flow 자동 전환은 스텁 테스트 17개만 통과했고
  실제 quota 상황에서 돌려본 적은 없다.
- **파일명 정리**: provider별로 다른 이름으로 떨어지는 경우가 있어 첫 편에서 수동
  정리가 필요했다. 오케스트레이터가 이제 canonical 이름으로 모으지만, 수동 실행
  시에는 여전히 주의.

## 검증 스크립트

```bash
node scripts/check-owl-motion-orchestrator-v1.mjs          # 폴백 분기 17개 시나리오
node scripts/check-owner-local-env-no-log-wrapper-static.mjs  # 시크릿 노출 방지 49개
```
