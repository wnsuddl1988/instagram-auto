# Next Action

## 2026-06-26 현재 — source-date resolver 승인, Claude 실행 대기

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 돈관리 쇼츠 생성기가 아니다.
- 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 콘텐츠 비중은 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 checkpoint:

- `63d9b10 feat(source-facts): add ecos latest-period resolver with source-date gate` ← **현재 HEAD**
- (이전: `d85b616 feat(source-facts): add auto fact card candidate preview`)
- branch: `codex/source-first-blueprint-clean`
- push: 미실행

최근 완료:

- `money-shorts-os-auto-fact-card-candidate-v1` + review-fix: checkpoint `d85b616`
  - mock ECOS `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard()` 경로
  - `/fact-cards/manual/package-preview?candidate=base-rate` preview
- `money-shorts-os-ecos-connector-scaffold-v1`: checkpoint `20ab76b`
  - `ecos-connector.ts`: EcosTransport interface + mock transport factory + runEcosConnector()
  - `ecos-fixtures.ts`: 2-period mock rows (Jan2025 3.00% / Dec2024 3.00% — live truth aligned)
  - `ecos-normalizer.ts`: normalizeEcosBaseRateRows() + scaffold end-to-end candidate
- `money-shorts-os-ecos-connector-scaffold-v1` + review-fix: checkpoint `20ab76b`
  - scaffold path: request spec → mock transport → RawDataSnapshot → parser → Fact Card candidate
  - publishedDate `2025-01-16`, human-facing ECOS source URL, `execute()` transport boundary
- `money-shorts-os-ecos-live-connector-v1`: **구현 완료, 미커밋**
  - `EcosAsyncTransport` interface + `runEcosConnectorAsync()` (기존 동기 경로 무손상)
  - `ecos-live-transport.ts`: `createEcosLiveTransport()` (fetch + process.env key, secret-safe)
  - `ECOS_BASE_RATE_REQUEST_2P` (2기간 request for normalizer)
  - `scripts/_ecos-live-check.mjs` (read-only live check)
  - live 검증: env key 부재로 **BLOCKED** (가짜 성공 없음) — env 주입 시 즉시 검증 가능
- `money-shorts-os-ecos-live-connector-v1-review-fix`: **완료, 커밋됨 (87caec6)**
  - P1 Fix: `orderEcosRowsCurrentFirst()` helper 추가 (`ecos-connector.ts`)
  - `executeAsync` 성공 경로에서 current-first 정렬 적용 → primary library path 안전
- `money-shorts-os-ecos-live-check-v1`: **LIVE_OK 확인**
  - `node --env-file=.env.local scripts/_ecos-live-check.mjs` 성공
  - Jan2025 3.0%, Dec2024 3.0%, change 0.0%p
- `money-shorts-os-ecos-live-truth-alignment-v1`: **완료, 커밋됨 (43fe473)**
  - `ecos-fixtures.ts`: `ECOS_BASE_RATE_ROW_DEC2024.DATA_VALUE` `"3.25"` → `"3.00"`
  - `candidates.ts`: mock snapshot previousValue/changeValue/Text live truth에 정렬
  - Jan2025는 historical smoke fixture이며 production 최신 데이터 default가 아님을 명시
- Owner 승인: `latest available period` 선택/검증 slice 진행
- `money-shorts-os-ecos-latest-period-resolver-v1`: **완료, 커밋됨 (63d9b10)**
  - `ecos-latest-period.ts`: `buildEcosLatestWindowRequest()` (Date.now 없음) + `resolveLatestEcosBaseRatePeriod()` + `decideEcosLatestPeriodReadiness()` (3-state)
  - `scripts/_ecos-latest-period-check.mjs`: read-only live check (end period 202606)
  - live: latest `202605` 2.5%, previous `202604` 2.5% → `blocked_pending_source_date` (publishedDate 미검증, 발명 금지)
  - Jan2025 smoke fallback 없음, publishable 금지
- Owner 승인: source-date 검증 경로 설계/구현 진행
- `money-shorts-os-ecos-source-date-resolver-v1`: **완료, 미커밋**
  - `ecos-source-date.ts`: `BOK_BASE_RATE_DECISIONS` (공식 BOK 전사 이력) + `resolveEcosBaseRateSourceDate()` (값 매칭 검증, 4-code unresolved, 날짜 발명 금지)
  - `scripts/_ecos-source-date-check.mjs`: read-only live check
  - live: latest `202605` 2.5% 값이 공식 최신 결정 `2025-05-29` 2.5%와 일치 → verifiedPublishedDate `2025-05-29`, `draft_ready`, `publishable=false`
  - 핵심: latest period(2026-05)에서 날짜 유도 금지 — 발표일은 그 값이 마지막 변경된 공식 BOK 결정일(2025-05-29)
  - 공식 source: BOK 통화정책방향 결정회의 페이지
- 현재 untracked: `piq_diag_out.txt` (작업 무관, 건드리지 말고 계속 제외)

Source of truth:

- `_ai/HANDOFF_NOW.md`
- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## 다음 safe work unit

먼저:

- `money-shorts-os-ecos-source-date-resolver-v1` 누적 diff를 Codex review 후 safe local checkpoint commit.
  - source-date resolver는 완료: latest 값 ↔ 공식 BOK 최신 결정 값 매칭으로 `verifiedPublishedDate=2025-05-29` 검증, `draft_ready` 도달, 날짜 발명 없음.

그 다음 (live latest draft 연결):

- 검증된 source-date를 latest-period resolver와 묶는 end-to-end helper 검토:
  - `latest ECOS rows → resolveEcosBaseRateSourceDate() → decideEcosLatestPeriodReadiness(rows, fetchedAt, verifiedDate)` 단일 경로.
  - `normalizeEcosBaseRateRows()`의 `sourceProviderId: "provider-ecos-mock"` → live provider id 분리 검토 (draft snapshot이 mock으로 표기되지 않도록).
- draft_ready 안정화 후 `/fact-cards/manual/package-preview`에 live/latest candidate 연결 검토.
- 아직 GPT, 영상, ElevenLabs, ffmpeg/render로 가지 않는다.
- publishable=true는 아직 설정하지 않는다 (downstream Owner 결정).

금지 (계속 유지):

- OS clipboard write
- API route 호출 또는 변경
- DB/Supabase read/write/migration
- ffmpeg/render/output 생성
- OpenAI/GPT/Gemini/Veo/ElevenLabs live call
- KOSIS/OpenDART/FRED live API 호출
- ECOS live API 호출은 이번 승인된 connector slice의 소량 검증 범위에서만 허용
- API key/env/secret 변경
- dependency/lockfile 변경
- `output/` 변경
- payment/deploy/upload/post/push (Owner 명시 승인 없이)
- 이전 영상 후보 개선
