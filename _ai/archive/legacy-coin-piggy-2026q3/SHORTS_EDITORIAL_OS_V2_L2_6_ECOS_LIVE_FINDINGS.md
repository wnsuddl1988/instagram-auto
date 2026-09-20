# L2-6 — ECOS 라이브 오케스트레이터 검증 결과

Updated: 2026-09-16 KST
Status: `RESOLVED` — 발표일 이력 테이블 최신화 완료, 최신 데이터로 라이브 재검증 PASS
Scope: `L2-5`가 만든 `lib/source-facts/indicator-orchestrator.ts`(`fetchLatestIndicator`)를
실제 ECOS 라이브 transport(`ecos-live-transport.ts`)로 구동해 mock 검증 결과와 일치하는지 확인.
호출 횟수: 총 4회 (raw probe 1회 + orchestrator live 3회). 읽기 전용, 무료 API.

## 1. 오케스트레이터 라이브 검증 — PASS

`endPeriod=202606`으로 `fetchLatestIndicator("base_rate", ...)`를 실제 ECOS API로 실행.

| 검증 항목 | 결과 |
| --- | --- |
| `isMock === false` | PASS |
| `isPublishable === false` (승격은 downstream 책임) | PASS |
| `primarySourceProviderId === "provider-ecos-live"` | PASS |
| citations ≥ 1 | PASS (2건: ECOS 통계 + BOK 발표일 근거) |
| `publishedDate`가 ECOS 기간이 아니라 BOK 공식 결정일 | PASS (`2025-05-29`, ECOS 기간 `202606`과 다름) |

산출 FactCard 예시 (`indicatorName: 한국은행 기준금리`, `currentValue: 2.5%`, `dataPeriod: 2026년 6월`) —
`L2-5` mock 검증에서 확인한 구조와 필드 단위로 일치. **오케스트레이터 코드는 수정 불필요.**

## 2. 발견 — BOK 발표일 이력 테이블이 최신 결정을 반영하지 못함 (별도 조치 필요)

### 관측

`endPeriod=202609`(오늘 기준 최신)으로 시도하자 `source_date_unresolved`로 차단됨. 원인 확인을 위해
raw ECOS 값을 직접 조회(202507~202609):

| 기간 | 값 |
| --- | --- |
| 202507 ~ 202606 | 2.5% (12개월 동결) |
| **202607** | **2.75%** |
| **202608** | **3.0%** |

`lib/source-facts/ecos-source-date.ts`의 `BOK_BASE_RATE_DECISIONS`는 가장 최근 항목이
`{ decisionDate: "2025-05-29", value: 2.5 }`로, **2026년 7월·8월의 금리 변동(2.5%→2.75%→3.0%)이
테이블에 없다.**

### 이것은 버그가 아니라 설계대로 작동한 안전장치

오케스트레이터는 모르는 값(3.0%)에 발표일을 지어내지 않고 정확히 차단했다(`source_date_unresolved`).
`L2-4`/`L2-5`에서 검증한 "날짜를 발명하지 않는다" 원칙이 실제 라이브 상황에서도 그대로 작동함을
증명한 사례다. **차단된 것 자체가 시스템이 올바르게 동작했다는 증거.**

### 결론: 이건 제가 임의로 고칠 수 없는 사실확인 작업

`BOK_BASE_RATE_DECISIONS`에 새 항목을 추가하려면 **한국은행 공식 발표(금통위 의결) 날짜와 값을
실제로 확인해서 정확히 기입**해야 한다. 추측하거나 ECOS 기간에서 역산하면 커트라인/이 파이프라인
전체가 지키려는 원칙(발표일 날조 금지)을 정면으로 어기게 된다.

## 3. 현재 상태로 가능한 것과 불가능한 것

| | 상태 |
| --- | --- |
| `202606`까지의 기준금리(2.5%, 동결) | **콘텐츠 근거로 사용 가능** — publishedDate 검증됨 |
| `202607` 이후(2.75%→3.0%로 인상) | **차단 상태** — 발표일 이력 미반영으로 publishedDate 검증 불가 |

즉 지금 당장 "생활금융·부채" 주제를 시작해도 기준금리 자체는 쓸 수 있으나, **가장 최근의(그리고
콘텐츠 가치가 가장 높은) 금리 인상 이슈는 이력 테이블이 업데이트되기 전까지 근거로 쓸 수 없다.**

## 4. 조치 완료 (2026-09-16)

Owner가 한국은행 공식 페이지("한국은행 기준금리 추이" 표)를 직접 조회해 제공.
`lib/source-facts/ecos-source-date.ts`의 `BOK_BASE_RATE_DECISIONS`에 아래 2건 추가:

| decisionDate | value |
| --- | --- |
| 2026-08-27 | 3.00% |
| 2026-07-16 | 2.75% |

### 재검증 결과 — PASS

`endPeriod=202609`(오늘 기준)으로 재실행:

| 항목 | 결과 |
| --- | --- |
| `isMock === false` | PASS |
| `isPublishable === false` | PASS |
| `primarySourceProviderId === provider-ecos-live` | PASS |
| citations ≥ 1 | PASS (2건) |
| `publishedDate`가 ECOS 기간이 아닌 BOK 공식 결정일 | PASS |

산출 FactCard: `dataPeriod: 2026년 8월`, `currentValue: 3.00%`, `previousValue: 2.75%`,
`changeValue: +0.25%p`, `publishedDate: 2026-08-27`.
`interpretation`: "한국은행이 2026년 8월 기준금리를 2.75%에서 3.00%로 +0.25%p 조정했다."

→ **가장 콘텐츠 가치가 높은 최신 금리 인상 이슈가 이제 근거로 사용 가능하다.**

### 테스트 픽스처 동기화

`L2-5` mock 검증 스크립트(`check-editorial-v2-l2-indicator-orchestrator.mjs`)의 "정상 경로" 픽스처가
이전 최신 항목(`2025-05-29, 2.5%`)에 의존하고 있어 테이블 갱신과 함께 깨짐 — **버그가 아니라
`resolveEcosBaseRateSourceDate`가 "테이블의 가장 최근 항목"과만 대조하는 설계**이기 때문. 픽스처를
새 최신 항목(`202608=3.0`, `202607=2.75`)에 맞춰 갱신. 11/11 재통과 확인.

> **운영 참고**: 이 테이블은 금통위 회의마다 수동 갱신이 필요하며, 갱신 시 mock 테스트 픽스처도
> 함께 갱신해야 한다(그렇지 않으면 실제로는 정상인데 테스트만 실패하는 상황 발생). 장기 운영
> 관점에서 "금통위 회의 후 이력 테이블 갱신"을 운영 체크리스트에 넣는 것을 제안한다.
