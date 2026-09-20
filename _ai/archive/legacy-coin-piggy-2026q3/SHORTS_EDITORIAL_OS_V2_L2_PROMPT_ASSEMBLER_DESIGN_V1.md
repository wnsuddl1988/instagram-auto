# Shorts Editorial OS V2 — L2 프롬프트 조립기 설계 (V1)

Updated: 2026-09-15 KST (rev.1)
Status: `DRAFT_AWAITING_OWNER_APPROVAL`
Depends on: `_ai/SHORTS_EDITORIAL_OS_V2_TOPIC_SCRIPT_CUTLINE_V1.md` (`OWNER_APPROVED` rev.1)
Scope: 실시간 수집 데이터를 LLM 프롬프트로 조립하는 계층의 **설계**. 본 문서 승인 전 구현 착수 금지.

### rev.1 반영 사항 (Owner 지시)

1. **네이버 뉴스 커넥터를 ECOS보다 먼저 구현한다.** ECOS 월간 통계만으로는 벤치마킹 채널 수준의 시의성에 도달할 수 없다는 판단.
2. **`HC-05` 신선도를 뉴스/통계로 분리**했다(커트라인 §3.2). 본 설계의 어댑터·검증 로직이 이를 따른다.
3. **운영 전제: 릴스 100~1,000편 장기 운영.** 지표를 소수로 고정하지 않고 **경제·금융 전반으로 확장 가능한 구조**로 설계한다. 단, 출처는 신뢰 등급 `T1`/`T2`로 제한한다(커트라인 §6.1).
4. **채널 주제 범위 확정 (Owner 지시).** 거시경제 / 생활금융 / 보험 혜택·비교 / 정부정책·예산지원 / 산업전망. **개별 종목은 제외한다.**

## 0. 설계 전제 — 기존 자산 조사 결과

구현 전 `lib/editorial-v2`, `lib/source-facts`를 조사한 결과, **L2에 필요한 대부분이 이미 존재**한다. 신규 구축 범위를 최소화한다.

### 0.1 그대로 재사용 (신규 구현 금지)

| 자산 | 위치 | 재사용 이유 |
| --- | --- | --- |
| `PromptPackage` 계약 + 데이터 주입 패턴 | `lib/editorial-v2/script-prompt.ts` | `buildDetailedScriptPrompt`가 이미 evidencePack·selectedAngle을 JSON 직렬화해 프롬프트에 주입. L2가 하려는 일과 동일 |
| `UNTRUSTED_SESSION_INPUT_START/END` 마커 | 동일 파일 | 주입 데이터를 "지시가 아닌 데이터"로 격리하는 프롬프트 인젝션 방어. 외부 뉴스·API 값을 넣는 L2에 필수 |
| `EvidencePackDraft` 전체 | `lib/editorial-v2/evidence-pack.ts` | 출처·발행일·`freshness`(fresh/stale/unknown) 자동 분류, source/claim/number 3단 참조 무결성, `normalizedHash` 검증까지 완비 |
| 주제 후보 생성·평가 | `lib/editorial-v2/topic-candidates.ts`, `topic-evaluation.ts` | claim×angle 조합 생성(LLM 불필요), 8지표 100점, `blockingIssues` 게이트 |
| ECOS 라이브 호출 + 키 유출 방어 | `lib/source-facts/ecos-live-transport.ts` | `fetch` 구현체 존재. 키를 URL 경로에 넣으므로 에러 메시지에 URL 미포함 방어 완료 |
| ECOS 정규화 | `lib/source-facts/ecos-normalizer.ts` | `publishedDate` 없으면 스냅샷 생성 거부 — 발행일 날조 방지 |
| 최신 기간 탐색 | `lib/source-facts/ecos-latest-period.ts` | 하드코딩 제거에 사용 |

### 0.2 확인된 공백 (신규 구현 대상)

1. **`lib/source-facts` ↔ `lib/editorial-v2`가 완전히 분리된 두 섬.** 서로 import 하지 않는다. ECOS 실측값이 evidence pack으로 들어가는 경로가 **0개**. → **L2의 핵심 미구현 지점.**
2. **ECOS 요청 기간 하드코딩.** `ECOS_BASE_RATE_REQUEST_JAN2025` — 2025년 1월 고정. "실시간"의 약한 고리.
3. **다중 지표 동시 수집 계층 부재.** 기준금리 단일 지표만 처리 가능.
4. **라이브 수치 해석용 프롬프트 빌더 부재.** `research-prompt.ts`는 "웹에서 조사해 와라"용이지 "이 실측치를 해석하라"용이 아니다.

### 0.3 기존 점수 체계와 커트라인 문서의 관계

`topic-evaluation.ts`에는 이미 8지표 100점 체계가 있고, 설계자가 `scoreMeaning: "heuristic_pre_score_not_quality_gate"`로 **"품질 게이트가 아님"을 명시**해 두었다.

**결정: 두 체계를 병존시킨다.**

- 기존 8지표 100점 = **사전 순위화(pre-score)**. 후보를 정렬하는 용도. 변경하지 않는다.
- 커트라인 문서의 HARD CUT 10 / SCORE 20점 = **합격 판정(quality gate)**. L3가 집행한다.

기존 `blockingIssues`(`source_ref_zero`, `fresh_source_coverage_zero`, `unsafe_financial_language`)는 커트라인 `HC-04`, `HC-05`, `HC-06`/`HC-07`과 의미가 겹치므로, **L3 구현 시 기존 판정 결과를 입력으로 받아 재사용**하고 중복 정규식을 새로 쓰지 않는다.

## 1. L2의 책임 범위

```
[L1] 수집        ECOS(구현됨) · FRED(미구현) · 네이버(미구현)
                      │ RawDataSnapshot / FactCard
                      ▼
      ┌──────────── L2 ────────────┐
      │ ① 지표 오케스트레이션        │  여러 지표를 한 번에 수집·정렬
      │ ② Evidence 어댑터           │  FactCard → EvidencePackDraft  ★핵심
      │ ③ 프롬프트 조립             │  실측치 + 커트라인 규칙 → PromptPackage
      └────────────┬───────────────┘
                   │ 프롬프트 텍스트
                   ▼
            Owner가 복사 → LLM 실행 → 결과 JSON 회수
                   │
                   ▼
[L3] 커트라인 검사 (별도 설계)
```

**L2는 LLM을 호출하지 않는다.** 프롬프트 문자열 생성까지가 책임이다. 호출은 Owner가 수동으로 한다(비용·품질 통제 지점).

## 2. 신규 모듈 설계

### 2.1 `lib/editorial-v2/live-evidence-adapter.ts` — **구현 완료 (2026-09-15)**

> **구현 중 발견 — 설계 대비 변경 사항**
>
> 1. **`buildEvidencePackDraft`는 `EvidencePackDraft`가 아니라 `ApprovedTrendBriefSessionSnapshot`을 받는다.** 어댑터는 pack을 직접 조립하지 않고 이 스냅샷을 만들어 기존 빌더에 넘긴다. ID 생성·coverage·warnings가 import 경로와 동일하게 유지된다.
> 2. **기존 freshness는 단일 창(`24h`/`7d`/`30d`)만 지원한다.** 커트라인 §3.2의 근거별 창(뉴스 7일 / 통계 400일)과 맞지 않아, 통계가 전부 `stale`이 되고 `claim_without_fresh_source`로 차단되는 문제가 있었다. → **기존 함수를 수정하지 않고**, pack 생성 후 `reclassifyFreshness`로 재판정하고 `coverage.freshSourceCount`를 재계산한다.
> 3. **`FactCard`에는 `publishedAt`이 없다** (`publishedDate`, `YYYY-MM-DD`만). `toIsoInstant`로 UTC 자정 ISO로 변환한다.
> 4. **`SourceProviderType` 유니온에 `naver_news`가 없다.** 뉴스는 `FactCard`를 거치지 않고 `TrendBriefImportSource`로 직접 변환하므로 유니온 확장이 불필요했다.
> 5. **`contracts.ts`에 `EvidenceClaim`/`EvidencePackPayload`라는 별도 계열이 존재한다** (아티팩트 레이어용). `EvidencePackDraft` 계열과 호환되지 않으므로 혼동 주의. 어댑터의 타깃은 `EvidencePackDraft`다.
> 6. **뉴스만으로는 pack이 만들어지지 않는다** (`no_signals`). signal은 통계(FactCard)에서 생성되고 뉴스는 보강 근거로 붙는 구조이기 때문. 설계 §3의 "뉴스=왜 지금 / 통계=숫자" 분담과 일치한다.


`lib/source-facts`의 산출물을 `lib/editorial-v2`가 이해하는 형태로 변환한다. **두 섬을 잇는 유일한 다리.**

```ts
export type LiveEvidenceAdapterInput = {
  factCards: FactCard[];          // lib/source-facts
  researchCutoffDate: string;     // YYYY-MM-DD
  freshnessWindowDays: number;    // 커트라인 HC-05 기본 7
};

export type LiveEvidenceAdapterResult =
  | { ok: true; pack: EvidencePackDraft; skipped: SkippedFactCard[] }
  | { ok: false; reason: AdapterRejectReason; detail: string };

export function buildEvidencePackFromFactCards(
  input: LiveEvidenceAdapterInput,
): LiveEvidenceAdapterResult;
```

**변환 규칙 (하드):**

| 조건 | 처리 |
| --- | --- |
| `factCard.isMock === true` | **제외.** 프로덕션 evidence pack에 mock 혼입 금지 |
| `factCard.isPublishable === false` | 제외 |
| `citations[]` 비어 있음 | 제외 (커트라인 `HC-04`) |
| `publishedDate` 없음/빈 문자열 | 제외 (날조 방지 — normalizer와 동일 원칙) |
| `publishedDate`가 cutoff에서 window 초과 | 포함하되 `freshness: "stale"` 표기 (L3가 `HC-05` 판정) |
| 전부 제외되어 pack이 비었음 | `ok: false`, `reason: "no_publishable_fact_cards"` |

**`blockedClaims` 처리:** `FactCard.blockedClaims`는 evidence pack에 **주장으로 싣지 않는다.** 대신 프롬프트의 금지 지시문에 "다음 주장은 하지 말 것" 목록으로 전달한다(§2.3).

**mock 표시 보존:** 개발 중 fixture로 돌릴 때는 `allowMock: true` 옵션을 명시적으로 넘겨야 하며, 이 경우 생성된 pack에 `containsMockData: true`를 찍는다. L3와 렌더 단계는 이 플래그가 true면 **게시 경로를 차단**한다.

### 2.1b `lib/source-facts/naver-news-connector.ts` ★rev.1 최우선

시의성의 실질 공급원. **ECOS보다 먼저 구현한다.**

```ts
export type NaverNewsQuery = {
  keyword: string;
  display: number;        // 1~100, 기본 30
  sort: "date" | "sim";   // 시의성 목적이므로 "date" 고정
};

export type NaverNewsItem = {
  title: string;          // HTML 태그·엔티티 제거 후
  description: string;    // 요약 스니펫. 본문 전문 아님
  link: string;           // 네이버 뉴스 링크
  originallink: string;   // 원 매체 링크
  pubDate: string;        // RFC822 → ISO 변환 저장
  publisherTier: "T1" | "T2" | "T3";   // §2.1c 레지스트리로 판정
};
```

**API 제약 (확인됨):**

| 항목 | 값 | 출처 |
| --- | --- | --- |
| 일 호출 한도 | 25,000회 (전 검색 카테고리 합산) | 2차 출처 |
| 1회 최대 건수 | 100건 | 2차 출처 |
| `start` 상한 | 1,000 (`start + display - 1 ≤ 1000`) | 2차 출처 |
| 본문 전문 | **제공 안 됨** | 확인됨 |
| 인증 헤더 | `X-Naver-Client-Id`, `X-Naver-Client-Secret` | 네이버 규격 |

> 위 수치는 네이버 공식 문서(`developers.naver.com`)가 본 환경에서 **fetch 차단**되어 2차 출처로 확인했다. 구현 전 Owner가 공식 문서로 재확인해야 한다. `accessLevel: INDEX_ONLY`.

**설계 결정 (중요):**

1. **본문 전문을 크롤링하지 않는다.** API가 주는 제목·요약·링크·발행일만 쓴다. 기사 본문 스크래핑은 저작권·약관 위반 소지가 있고, 대체 경로를 만들지 않는다.
2. **따라서 뉴스 근거는 기본 `accessLevel: INDEX_ONLY`** → 커트라인 §6에 따라 **뉴스에서 본 수치를 그대로 영상에 쓸 수 없다.** 수치는 `T1` 통계 API에서 가져오거나 Owner가 원문 확인 후 승격한다.
3. **뉴스의 역할은 "무엇이 지금 이슈인가"**이고, **통계의 역할은 "그 숫자가 얼마인가"**다. 둘을 합쳐야 한 편이 된다.
4. `sort: "date"` 고정. 시의성이 목적이므로 관련도 정렬은 쓰지 않는다.
5. 동일 사건의 중복 기사는 **원문 링크(`originallink`) 정규화**로 제거한다(쿼리스트링·트레일링 슬래시·대소문자 무시).
6. **`T3` 매체는 수집하되 evidence pack에 넣지 않는다.** 주제 발굴 힌트로만 쓰고, 근거는 `T1`/`T2`에서 다시 찾는다(커트라인 §6.1).

**환경변수:** `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`. 기존 ECOS와 동일하게 값은 로그·에러·프롬프트에 절대 포함하지 않는다.

**키워드 전략:** 고정 키워드 목록을 코드에 박지 않고 §2.1c 레지스트리의 `newsKeywords`에서 읽는다. 장기 운영 중 주제 확장 시 설정만 고치면 되게 한다.

### 2.1c `config/economic-source-registry.json` ★rev.1 신설

Owner 지시("경제·금융 관련 주제면 넓게 확장, 단 신뢰할 수 있는 자료로")를 **코드 수정 없이 확장 가능한 형태**로 구현한다.

```json
{
  "version": "1.0.0",
  "publishers": {
    "T1": [
      { "name": "한국은행",   "domains": ["bok.or.kr"],  "api": "ecos" },
      { "name": "통계청",     "domains": ["kostat.go.kr"], "api": "kosis" },
      { "name": "금융위원회", "domains": ["fsc.go.kr"],   "api": null },
      { "name": "금융감독원", "domains": ["fss.or.kr"],   "api": null },
      { "name": "기획재정부", "domains": ["moef.go.kr", "mofe.go.kr"], "api": null },
      { "name": "한국거래소", "domains": ["krx.co.kr"],   "api": null },
      { "name": "전자공시",   "domains": ["dart.fss.or.kr"], "api": "dart" }
    ],
    "T2": [
      { "name": "연합뉴스", "domains": ["yna.co.kr"] },
      { "name": "한국경제", "domains": ["hankyung.com"] },
      { "name": "매일경제", "domains": ["mk.co.kr"] }
    ]
  },
  "topicDomains": [
    {
      "id": "macro_rate",
      "label": "거시경제·금리",
      "enabled": true,
      "newsKeywords": ["기준금리", "한국은행 금통위", "환율", "소비자물가"],
      "sources": ["ecos", "fred", "naver_news"]
    },
    {
      "id": "living_finance",
      "label": "생활금융·부채",
      "enabled": true,
      "newsKeywords": ["대출금리", "리볼빙", "카드론", "가계부채", "전세대출"],
      "sources": ["ecos", "naver_news"]
    },
    {
      "id": "insurance",
      "label": "보험 혜택·비교",
      "enabled": false,
      "blockedReason": "finlife 인증키 미발급 (§2.1e)",
      "newsKeywords": ["실손보험", "보험료 인상", "자동차보험", "4세대 실손"],
      "sources": ["finlife", "naver_news"]
    },
    {
      "id": "gov_benefit",
      "label": "정부정책·예산지원",
      "enabled": false,
      "blockedReason": "활용신청 승인됨. 커넥터 미구현 — living_finance 검증 후 착수",
      "newsKeywords": ["정부지원금", "청년 지원", "복지 혜택", "예산안", "세제 개편"],
      "sources": ["gov_benefit_api", "naver_news"]
    },
    {
      "id": "industry_outlook",
      "label": "산업전망",
      "enabled": false,
      "blockedReason": "활용신청 승인됨(관세청·KOSIS). 커넥터 미구현 — 후순위",
      "newsKeywords": ["수출 실적", "무역수지", "반도체 업황", "고용 동향"],
      "sources": ["customs", "kosis", "naver_news"]
    }
  ]
}
```

**설계 의도:**

- `publishers`에 없는 매체는 자동으로 `T3` 판정 → 근거로 쓰이지 않는다. **화이트리스트 방식**이라 신뢰도가 기본값으로 보장된다.
- `topicDomains`를 추가하면 **코드 변경 없이 새 주제 영역이 열린다.** 100~1,000편 운영에 필요한 확장성.
- 위 JSON은 **구조 예시**다. 실제 등재 매체·지표 목록은 Owner 확정 사항이며, `T1` 기관의 API 가용 여부는 구현 시 개별 확인한다.
- `sources`의 각 ID는 §2.1d 커넥터 레지스트리로 해석된다. **각 API의 엔드포인트·파라미터는 실제 호출로 확인한 뒤 등재**한다(추측 금지).

### 2.1d 주제 영역별 데이터 출처 매핑 ★rev.1 신설

Owner 확정 주제 범위(거시·생활금융·보험·정부정책·산업전망)에 대응하는 출처를 조사한 결과다.

`.env.local` 키 이름 확인 완료 (2026-09-15, 값 미열람 — 이름만 조회).

| 주제 영역 | 필요한 데이터 | 출처 | 키 | 상태 |
| --- | --- | --- | --- | --- |
| 거시경제·금리 | 기준금리, 물가, 환율 | ECOS | `ECOS_API_KEY` ✅ | 커넥터 구현됨 |
| 거시경제(해외) | 미국 금리, 유가 | FRED | `FRED_API_KEY` ✅ | 미구현 |
| 생활금융·부채 | 가계신용, 대출금리 | ECOS | `ECOS_API_KEY` ✅ | 커넥터 구현됨 |
| **정부정책·예산지원** | 지원금·복지서비스 목록 | `행정안전부_대한민국 공공서비스(혜택) 정보` | `DATA_GO_KR_SERVICE_KEY` ✅ | **활용신청 승인됨** (2026-09-15) |
| 산업전망 | 수출입 실적 | `관세청_품목별 수출입실적(GW)` | `CUSTOMS_API_KEY` ✅ | **활용신청 승인됨** (2026-06-17) |
| 산업전망 | 고용·산업 통계 | `국가데이터처_KOSIS 통계자료 조회 서비스` | `DATA_GO_KR_SERVICE_KEY` ✅ | **활용신청 승인됨** (2026-09-15) |
| ~~보험 비교~~ | 상품별 보험료·조건 | 금감원 금융상품 통합비교공시(`finlife.fss.or.kr`) | ❌ 미보유 | **`BLOCKED_PENDING_KEY`** (§2.1e) |
| 전 영역 | "왜 지금인가" | 네이버 뉴스 | `NAVER_CLIENT_ID/SECRET` ✅ | §2.1b |

**핵심: `DATA_GO_KR_SERVICE_KEY` 보유 확인.** 공공데이터포털은 **단일 서비스키로 활용신청한 모든 API를 호출**하는 구조이므로, 보조금24·KOSIS 등은 **키 발급 없이 포털에서 활용신청만** 하면 된다. 정부지원금·산업전망 주제의 진입 장벽이 사라졌다.

### 2.1e 보험 주제 보류 (`BLOCKED_PENDING_KEY`)

- **차단 사유**: 금감원 `finlife.fss.or.kr` 인증키 발급이 **이메일 인증 문제로 진행 불가** (Owner 보고, 2026-09-15). 해결 시 Owner가 알려주기로 함.
- **영향 범위**: `insurance` 주제 영역 1개만. 다른 4개 영역은 영향 없음.
- **조치**:
  - 레지스트리의 `insurance` 항목은 **`"enabled": false`로 등재**해 둔다. 삭제하지 않는다 — 키가 열리면 플래그만 바꾸면 되도록.
  - 커넥터 구현도 착수하지 않는다. 응답 구조를 모르는 상태에서 만들면 재작업이 된다.
  - 보험 소재를 굳이 다루려면 **뉴스 근거만으로** 가능하나, 수치 인용이 불가(`INDEX_ONLY`)해 `S-01` 0점이 된다. 권장하지 않는다.
- **해제 조건**: 인증키 확보 → 실제 호출로 응답 구조 확인 → 커넥터 구현 → `enabled: true`.

> API 존재·범위는 **검색 결과 기반(`INDEX_ONLY`)**이다. 일부 기관 사이트가 본 환경에서 fetch 차단되어 공식 문서를 직접 확인하지 못했다. 각 커넥터 구현 시 **실제 호출로 응답 구조를 확인한 뒤** 어댑터를 작성한다(네이버와 동일 원칙).

**보유했으나 이번 범위에서 쓰지 않는 키:**

- `KIS_APP_KEY` / `KIS_APP_SECRET` / `KIS_BASE_URL` / `KIS_SERVER_MODE` — 개별 종목 시세용. Owner가 종목을 다루지 않기로 확정했으므로 **이번 설계에서 제외**한다. 주문·잔고 엔드포인트가 같은 키에 붙어 있으므로, 향후 필요해지면 **시세 조회 엔드포인트만 화이트리스트로 여는 별도 설계**가 선행되어야 한다.
- `DART_API_KEY` / `IROS_OPENDART_API_KEY` / `IROS_API_TOKEN` — 기업 공시·등기용. 개별 기업 이슈를 다루지 않으므로 제외. 단 **산업 전망에서 업종 단위 집계**로 쓸 여지는 남긴다.
- `CUSTOMS_API_KEY2` — `CUSTOMS_API_KEY`의 보조 키로 추정. 용도 확인 후 등재한다(추측으로 쓰지 않는다).

### 2.2 `lib/source-facts/indicator-orchestrator.ts` — **구현 완료 (2026-09-16), 범위 조정됨**

> **Owner 결정: 범위를 기준금리 1개로 좁힘.** 구현 전 조사에서 기존 ECOS "latest period" 파이프라인이
> `resolveEcosBaseRateSourceDate`(한국은행 금통위 결정 이력을 코드에 직접 옮겨 값 대조로 발표일을 검증)에
> 기준금리 전용으로 묶여 있음을 발견했다. 다른 지표(가계신용·물가 등)는 발표 일정·검증 방법이 다르며,
> 이를 일반화하려면 지표마다 발표일 검증 방법을 **사실 확인 후 새로 설계**해야 한다 — 추측으로 만들 수 없는 영역.
> Owner 승인: "기준금리로 먼저 실전 연결 → 그 패턴으로 지표를 하나씩 사실 확인하며 추가."
>
> 구현 내용: `fetchLatestIndicator`(단일 지표) + `collectIndicators`(다중 지표, 동시성 3, 부분 실패 허용).
> 현재 `IndicatorId`는 `"base_rate"` 하나. 새 지표 추가는 **switch 분기 확장이 아니라 새 리졸버 추가**로 설계했다
> (`WINDOW_REQUEST_BUILDERS` 맵에 새 항목 = 그 지표의 발표일 검증 경로가 이미 존재한다는 뜻).
>
> **중요 경계 확인**: `isPublishable`은 오케스트레이터 출력에서 항상 `false`(draft)로 유지되며,
> **`live-evidence-adapter`가 이를 실제로 거부함을 검증으로 확인했다** (`no_publishable_sources`).
> 승격은 명시적 downstream 결정이어야 하며, 두 모듈이 조용히 맞물려 draft가 새는 경로가 없다.

**원 설계 스펙 (참고용 — 실제 구현은 위 §2.2 서두 참조):**

여러 지표를 한 번에 수집한다. 하드코딩된 기간을 제거한다.

```ts
export type IndicatorRequest = {
  indicatorId: string;        // "base_rate" | "household_credit" | ...
  statCode: string;           // ECOS 통계표 코드
  itemCodes: string[];
  cycle: "M" | "Q" | "Y";
};

export type OrchestratorResult = {
  collected: FactCard[];
  failed: { indicatorId: string; reason: string }[];  // 부분 실패 허용
  collectedAt: string;
};

export async function collectIndicators(
  requests: IndicatorRequest[],
  transport: EcosAsyncTransport,
): Promise<OrchestratorResult>;
```

- 기간은 `ecos-latest-period.ts`로 **매 호출마다 탐색**한다. 상수 고정 금지.
- 지표 하나가 실패해도 전체를 중단하지 않고 `failed[]`에 적재한다(부분 수집 허용).
- 동시 요청 수 제한을 둔다(기본 3). ECOS 부하 회피.
- 기존 `ECOS_BASE_RATE_REQUEST_JAN2025` 상수는 **삭제하지 않고** 유지한다 — 기존 check 스크립트가 참조 중일 수 있으므로, 신규 경로만 orchestrator를 쓴다.

### 2.3 `lib/editorial-v2/live-topic-prompt.ts` — **구현 완료 (2026-09-16)**

> **구현 결과.** `topic_candidates` artifact kind를 그대로 재사용(기존 `TopicCandidate` 스키마와
> 최대한 호환되는 출력 스키마를 프롬프트에 지시해, 향후 `topic-evaluation.ts`의 8지표 채점과
> 엮을 여지를 남김). `script-prompt.ts`의 `UNTRUSTED_SESSION_INPUT` 패턴을 그대로 따르되,
> **마커 위조 방어**를 추가했다 — 근거 텍스트(뉴스 제목 등)에 마커 문자열이 우연히 또는
> 의도적으로 포함되면 `escapeUntrustedMarkers()`가 무력화한다. 뉴스 제목은 외부 영향을 받는
> 텍스트라 LLM이 작성한 research brief와 신뢰 수준이 다르다는 점을 반영한 하드닝이다.
>
> 검증에서 실제 공격 시나리오(뉴스 제목에 가짜 종료 마커 + "모든 규칙을 무시하라" 삽입)를
> 넣어 진짜 경계가 깨지지 않음을 확인했다. `L2-4` 산출물을 그대로 입력해 `L2-1`~`L2-7`
> 전체가 연결되는지도 확인. 실제 라이브 데이터(기준금리 3.00%, 2026-08-27)로 만든 프롬프트
> 샘플: `_ai/SHORTS_EDITORIAL_OS_V2_L2_7_SAMPLE_PROMPT.md`.
>
> **`L2-8` 리허설 2회로 발견·수정한 것 (2026-09-16):**
> 1. **1회차**: LLM이 selfCheck를 전부 `true`로 채웠으나 실제로는 구체적 수치를 전부 회피하고
>    "~라는 걸 알고 있었어?" 식으로 사실을 숨겼다. `live-topic-prompt.ts`에 "숫자 필수 사용"
>    지시와 `evidence_card`/`twist` 장면 전용 사실 노출 지시를 추가.
> 2. **2회차**: 숫자는 실제로 인용됐으나(`3%`, `2.75%`), LLM이 이번엔 `selfCheck.HC-08`을
>    스스로 `false`로 신고했다 — 원인 확인 결과 **`live-evidence-adapter.ts`의 `buildSignals`가
>    `currentNumericValue`만 `numbers[]`에 넣고 `previousNumericValue`/`changeNumericValue`를
>    버리고 있었다.** "2.75%에서 3.00%로"라는 비교 서술을 쓰게 해놓고 "2.75"를 인용할 근거
>    ID가 애초에 없었던 것 — LLM의 self-check가 정확했던 사례. 세 값을 각각 독립된
>    number record로 만들도록 수정. 회귀 테스트(옛 코드로 되돌려 새 검증이 실제로 실패하는지
>    확인)로 수정이 유효함을 확인.
>
> 이 두 라운드는 "LLM self-check는 참고용이며 L3가 결정론적으로 재검증해야 한다"는 설계
> 원칙과, 동시에 "self-check가 항상 틀리는 건 아니다 — 진짜 구조적 결함을 잡아낼 때도
> 있다"는 것을 함께 보여준다. `L3` 설계 시 self-check를 전부 무시하지 말고 "탈락 후보 조기
> 발견용 신호"로는 활용할 가치가 있다.

**원 설계 스펙 (참고용):**

실측 데이터 + 커트라인 규칙을 합쳐 LLM 프롬프트를 조립한다. `script-prompt.ts`의 패턴을 그대로 따른다.

```ts
export type LiveTopicPromptInput = {
  evidencePack: EvidencePackDraft;
  cutline: CutlineConfig;        // §2.4
  blockedClaims: string[];       // FactCard에서 수집
  candidateCount: number;        // 기본 10
  audience: string;
  targetDurationSeconds: number;
};

export function buildLiveTopicPrompt(
  input: LiveTopicPromptInput,
): PromptPackage;
```

**프롬프트 구성 순서:**

1. 역할·목표
2. **커트라인 하드 컷 10개를 명시적 제약으로 기술** — LLM이 애초에 탈락할 후보를 만들지 않게 한다
3. 허용 훅 유형 5종 (커트라인 §4.1)
4. 금칙어 목록 (커트라인 §3.1)
5. `UNTRUSTED_SESSION_INPUT_START` … evidence pack JSON … `UNTRUSTED_SESSION_INPUT_END`
6. 금지 주장 목록 (`blockedClaims`)
7. 출력 JSON 스키마 + 예시
8. 자기검증 지시 — "제출 전 각 후보가 하드 컷 10개를 통과하는지 스스로 확인하고, 통과 여부를 `selfCheck` 필드에 기록하라"

**8번이 중요하다.** LLM 자기검증은 신뢰할 수 없지만, L3가 탈락시킬 후보를 줄여 **Owner의 재시도 횟수를 낮춘다**(비용 절감). L3 판정을 대체하지 않는다.

### 2.4 `config/editorial-cutline.json`

커트라인 문서 §7 요구사항("금칙어는 코드 상수가 아니라 설정 파일로 분리")을 이행한다.

```json
{
  "version": "1.0.0",
  "hardCut": {
    "hookMaxWords": 15,
    "hookMaxChars": 40,
    "evidenceFreshnessDays": 7,
    "requireTemporalToken": true,
    "requireProperNoun": true
  },
  "score": { "passThreshold": 14, "maxScore": 20 },
  "bannedPhrases": {
    "guarantee": ["무조건", "확실히", "반드시 오른다", "100%", "보장", "절대", "필승", "대박"],
    "profitImplication": ["떡상", "존버하면", "지금 사면", "얼마 번다", "수익 인증"],
    "fearMongering": ["망한다", "폭망", "거지 된다"]
  },
  "conditionalPhrases": {
    "역대급": "통계 근거가 evidence pack에 있을 때만 허용"
  },
  "temporalTokens": ["오늘", "어제", "이번 주", "이달", "지난달", "방금"],
  "allowedHookTypes": ["real_reason", "info_gap", "named_mistake", "myth_bust", "direct_callout"],
  "disclaimerText": "※본 영상은 투자 참고용이며, 투자 책임은 본인에게 있습니다"
}
```

- 파일이 없거나 파싱 실패 시 **기본값으로 조용히 넘어가지 않고 에러**를 낸다. 커트라인이 조용히 비활성화되는 사고 방지.
- `version` 불일치 시 경고를 남긴다.

## 3. 데이터 흐름 (구체)

```
1a. searchNaverNews(topicDomain.newsKeywords, sort=date)
        → NaverNewsItem[]  (T3 분리, 중복 제거)
        → evidenceKind: "news",  accessLevel: INDEX_ONLY

1b. collectIndicators(topicDomain.indicators)
        → FactCard[] (일부 실패 허용)
        → evidenceKind: "statistic",  isLatestRelease 확인

        ※ 1a와 1b는 병렬 실행. 한쪽 실패해도 다른 쪽으로 진행

2. buildEvidencePackFromFactCards({ newsItems, factCards, cutoff })
        → EvidencePackDraft  (mock/미게시/출처없음/T3 제외)
        → 근거 종류별 freshness 판정 (커트라인 §3.2)
        → validateEvidencePackDraft()  ※기존 함수 재사용

3. buildLiveTopicPrompt({ evidencePack, cutline, ... })
        → PromptPackage { packageId, instructions, expectedSchemaVersion }

4. [Owner] 프롬프트 복사 → LLM → 응답 JSON 회수 → 파일로 저장

5. [L3] 커트라인 검사 → { passed, violations[] }   ※별도 설계
```

**뉴스와 통계의 역할 분담 (설계 핵심):**

| | 뉴스 (`news`) | 통계 (`statistic`) |
| --- | --- | --- |
| 답하는 질문 | **왜 지금인가** | **숫자가 얼마인가** |
| 신선도 창 | 7일 | 최신 발표분 |
| 수치 인용 | **불가** (INDEX_ONLY) | 가능 (T1) |
| 없으면 | `S-05` 1점 상한 | 수치 없는 후보가 되어 `S-01` 0점 |

둘 다 있을 때 커트라인 통과 확률이 가장 높다. 이것이 네이버를 먼저 만드는 이유다.

## 4. 안전 설계

### 4.1 프롬프트 인젝션

L2는 **외부에서 온 텍스트(뉴스 제목, API 응답 문자열)를 프롬프트에 넣는다.** 이는 신뢰 경계를 넘는 행위다.

- 모든 주입 데이터는 `UNTRUSTED_SESSION_INPUT_START/END`로 감싼다 (기존 패턴 준수).
- 마커 문자열 자체가 데이터에 포함되면 **이스케이프하거나 해당 FactCard를 제외**한다. (마커 위조 방지)
- evidence pack은 JSON 직렬화해 넣는다. 원문 텍스트를 그대로 이어붙이지 않는다.

### 4.2 Secret

- ECOS 키는 `ECOS_API_KEY` / `BOK_ECOS_API_KEY` 환경변수로만 접근한다 (기존 `ECOS_API_KEY_ENV_NAMES`).
- 키 값을 로그·에러·프롬프트·evidence pack에 **절대 포함하지 않는다**. 기존 live-transport의 URL 미포함 방어를 유지한다.
- 본 설계 단계에서 `.env.local`을 읽지 않았다. 구현 시에도 값은 런타임 `process.env`로만 접근한다.

### 4.3 Mock 오염

- `containsMockData: true`인 pack은 L3·렌더·게시 경로에서 차단한다.
- fixture 테스트와 라이브 경로가 같은 함수를 쓰되, mock 허용은 **명시적 옵트인**(`allowMock: true`)으로만 가능하다.

### 4.4 실패 시 동작

| 상황 | 동작 |
| --- | --- |
| ECOS 키 없음 | `BLOCKED` 보고. fixture로 자동 대체하지 **않는다** |
| 일부 지표 수집 실패 | 나머지로 진행, `failed[]` 보고 |
| 모든 지표 실패 | `ok: false`, 프롬프트 생성 안 함 |
| evidence pack 검증 실패 | 프롬프트 생성 안 함, dangling ref 내역 보고 |

가짜 성공을 만들지 않는다. 기존 `_ecos-live-check.mjs`가 이미 이 원칙을 따르고 있다.

## 5. 구현 순서 (제안)

rev.1에서 네이버를 앞으로 당겼다.

| 단계 | 내용 | 검증 | 네트워크 |
| --- | --- | --- | --- |
| `L2-1` | `config/editorial-cutline.json` + `economic-source-registry.json` + 로더 | 파싱·누락 필드 에러, 티어 판정 | 불필요 |
| `L2-2` | `naver-news-connector.ts` (mock transport) | 중복 제거, T3 분리, RFC822→ISO 변환 | 불필요 |
| `L2-3` | **네이버 라이브 1회 연결 확인** | 실제 키로 `sort=date` 호출 성공, 응답 필드 검증 | **필요** |
| `L2-4` | `live-evidence-adapter.ts` | 뉴스+통계 혼합 pack 생성, 근거별 freshness, mock 제외 | 불필요 |
| `L2-5` | `indicator-orchestrator.ts` (mock transport) | 다중 지표·부분 실패 | 불필요 |
| `L2-6` | **ECOS 라이브 연결 + 통계표 코드 확인** | 최신 기간 탐색, 레지스트리 지표 실재 확인 | **필요** |
| `L2-7` | `live-topic-prompt.ts` | 프롬프트 스냅샷, 마커 위조 방어 | 불필요 |
| `L2-8` | 통합 리허설 — 실제 뉴스+통계로 프롬프트 1건 생성 | Owner가 프롬프트 육안 확인 | **필요** |

- 네트워크 필요 단계(`L2-3`, `L2-6`, `L2-8`)는 **각각 Owner 승인 후 실행**한다. 둘 다 무료·읽기 전용 API다.
- `L2-3`을 앞에 둔 이유: 네이버 API 스펙이 2차 출처로만 확인된 상태라, **실제 응답 필드를 먼저 보고** 어댑터를 만들어야 헛수고가 없다.
- 각 단계마다 `scripts/check-*.mjs` 패턴의 검증 스크립트를 함께 만든다(기존 관례 준수).
- `L2-8` 통과 = L2 완료. 이후 L3 설계로 넘어간다.

## 6. 범위 밖 (이번에 하지 않는 것)

- **FRED 커넥터** — 한국 시청자 대상 채널에서 미국 지표의 우선순위가 낮다. 네이버+ECOS 경로가 끝까지 동작한 뒤 같은 패턴으로 추가한다.
- **KOSIS·DART 커넥터** — 레지스트리에 자리만 만들어 두고 구현은 뒤로 미룬다. 동시에 여러 커넥터를 만들면 어느 것도 검증되지 않는다.
- **기사 본문 크롤링** — 저작권·약관 리스크. API가 주는 범위만 쓴다. 대체 경로를 만들지 않는다.
- **L3 검사기** — 별도 설계 문서로 분리.
- **LLM 자동 호출** — Owner 수동 중계 유지(비용·품질 통제).
- **기존 500개 topic bank 삭제** — 당분간 병존. 라이브 경로가 실전 검증될 때까지 제거하지 않는다.
- **`ECOS_BASE_RATE_REQUEST_JAN2025` 상수 제거** — 기존 스크립트 참조 가능성. 신규 경로만 orchestrator 사용.

## 7. 장기 운영 고려 (100~1,000편)

Owner 전제가 장기 운영이므로, 1~2편만 만들 때는 문제가 안 되지만 **누적되면 터지는 것들**을 미리 둔다.

| 항목 | 조치 |
| --- | --- |
| 주제 중복 | 기존 `lib/topicHistory.ts` 확인 후 연동. 같은 소재를 반복하지 않도록 발행 이력과 대조 |
| 근거 URL 수명 | 뉴스 링크는 시간이 지나면 죽는다. evidence pack에 `publishedAt`·`sourceName`을 함께 보관해 링크가 죽어도 출처 추적이 가능하게 한다 |
| API 쿼터 | 네이버 25,000회/일은 충분하나, 재시도 루프로 소진되지 않도록 **호출 횟수 상한**을 설정에 둔다 |
| 레지스트리 증가 | `topicDomains` 추가만으로 주제 확장 가능하게 설계(§2.1c). 코드 수정 불필요 |
| 커트라인 교정 | 커트라인 §8에 명시된 대로 실제 성과로 교정해야 한다. 발행 편수·통과율·성과를 기록할 자리를 L3 설계에서 정의한다 |

## 7.1 주제 범위 확정에 따른 커트라인 영향 ★rev.1

개별 종목을 제외하면서 커트라인의 일부 항목이 더 쉬워지거나 어려워진다.

| 커트라인 항목 | 영향 | 조치 |
| --- | --- | --- |
| `HC-07` (종목 매수·매도 권유) | **리스크 대폭 감소.** 종목을 안 다루므로 위반 가능성이 낮아짐 | 규칙은 유지. 안전장치로 남긴다 |
| `HC-02` (고유명사 필요) | **판정 기준 변경 필요.** 기업명 대신 **제도·상품·기관명**이 고유명사가 된다 (예: "4세대 실손", "청년도약계좌", "금융위") | 레지스트리에 제도·상품명 사전을 추가해 판정 |
| `S-03` (자기관련성) | **상승.** 보험·정부지원금은 "나도 해당되나?"가 강하게 걸림 | — |
| `S-05` (시의성) | **하락 압력.** 종목처럼 매일 움직이는 소재가 없음 | 정책 발표·보험료 개정·지원금 공고 등 **이벤트성 뉴스**로 보완. 네이버 커넥터가 더 중요해짐 |
| `HC-06` (수익 보장 표현) | 금칙어 목록 보완 필요. 보험·지원금 영역의 과장 표현 추가 | `"무조건 받는다"`, `"전 국민"`, `"자동으로 지급"` 등 추가 검토 |

**`HC-02` 고유명사 사전 (레지스트리에 추가할 항목):**

```
제도·상품명: 청년도약계좌, 실손보험, 4세대 실손, 국민연금, 기초연금,
            근로장려금, 자녀장려금, 주택청약종합저축, 전세보증금반환보증 …
기관명:     한국은행, 금융위원회, 금융감독원, 국민건강보험공단, 국민연금공단 …
```

> 이 사전은 고정 목록이 아니라 **레지스트리에서 관리**한다. 새 제도가 생기면 설정만 추가한다.

### 7.2 이 주제 범위에서 특히 주의할 것

- **정부지원금·보험은 개인별 자격 요건이 다르다.** "누구나 받을 수 있다"는 식의 단정은 사실 오류가 되기 쉽다. 대본에 **자격 조건 단서**를 반드시 포함하도록 프롬프트에 지시한다.
- **제도는 자주 바뀐다.** 지원금 공고는 예산 소진 시 조기 마감되고, 보험 상품은 개정된다. `evidenceKind: "policy"`의 180일 창(커트라인 §3.2)을 적용하되, **`eventDate`(시행일·마감일)를 반드시 수집**한다.
- **금감원 금융상품 데이터를 쓸 때 상품 추천이 되지 않도록 한다.** "A은행 금리가 가장 높다"는 사실 전달이지만, "A은행으로 갈아타라"는 권유다. `HC-07`의 취지를 예적금·보험 상품에도 확장 적용한다.

## 8. 미해결 질문 (Owner 확인)

**해소됨 (2026-09-15):**

- ~~`.env.local` 키 이름 목록~~ → 확인 완료. §2.1d 표에 반영.
- ~~공공데이터포털 키 발급~~ → `DATA_GO_KR_SERVICE_KEY` 보유 확인.
- ~~보조금24·KOSIS 활용신청~~ → **3건 모두 승인 확인** (Owner 마이페이지 스크린샷, 2026-09-15):
  - `행정안전부_대한민국 공공서비스(혜택) 정보` — 승인
  - `국가데이터처_KOSIS 통계자료 조회 서비스` — 승인 (만료예정 2028-09-15)
  - `관세청_품목별 수출입실적(GW)` — 승인 (2026-06-17 신청, 만료예정 2028-06-17)
- ~~`CUSTOMS_API_KEY` 용도~~ → **품목별 수출입실적(GW)** 확인.

> KOSIS 제공기관이 `국가데이터처`로 표기된다(통계청 개편 추정). 레지스트리에는 포털 표기 그대로 등재한다.

**남은 질문:**

1. **금감원 `finlife` 인증키.** 이메일 인증 문제로 발급 보류 중(§2.1e). Owner가 해결 시 통지 예정.
2. **`T2` 매체 목록 확정.** §2.1c 예시에 연합뉴스·한국경제·매일경제만 넣었다. 추가·제외할 매체가 있는지. — 화이트리스트라 여기 없으면 근거로 안 쓰인다.
3. **`CUSTOMS_API_KEY2`의 용도.** 두 번째 관세청 키가 어떤 서비스용인지 미확인. 산업전망 착수 시점에 확인한다. 모르면 등재하지 않는다.

### 8.1 첫 구현 주제 선정 (권장)

5개 영역을 동시에 열면 무엇이 문제인지 판별할 수 없다. **1개로 파이프라인 전체를 관통시킨 뒤 확장**한다.

| 후보 | 장점 | 단점 |
| --- | --- | --- |
| **`생활금융·부채` (권장)** | ECOS 커넥터가 **이미 구현됨** → 새 API 없이 즉시 착수. 리볼빙·대출금리 등 자기관련성 충분 | 시의성을 뉴스에 크게 의존 |
| `정부정책·예산지원` | 자기관련성 최상("나도 받나?") | 보조금24 **활용신청 대기** 필요. 응답 구조 미확인 |
| `거시경제·금리` | ECOS 그대로 사용 | 시의성 최약(금리는 자주 안 바뀜). `S-05` 불리 |

**권장: `생활금융·부채`로 시작.** 여기서 뉴스+통계 혼합 흐름이 검증되면, 다른 영역은 **출처만 교체**하면 되는 구조다.

## 9. Owner 승인 필요 사항

1. §2 신규 모듈 구성 (네이버 커넥터 + 레지스트리 신설 포함)
2. §0.3 점수 체계 병존 방침(기존 8지표=순위화 / 커트라인=합격판정)
3. §2.1b 설계 결정 — **기사 본문을 크롤링하지 않고, 뉴스 수치를 직접 인용하지 않는** 방침
4. §5 구현 순서 및 네트워크 호출 3개 지점(`L2-3`, `L2-6`, `L2-8`) 승인
5. §8 미해결 질문 3개
