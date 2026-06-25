# Next Action

## 2026-06-26 현재 — ECOS live check LIVE_OK, mock/live truth alignment 완료, checkpoint 대기

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 돈관리 쇼츠 생성기가 아니다.
- 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 콘텐츠 비중은 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 checkpoint:

- `87caec6 feat(source-facts): add ecos live transport with async connector boundary` ← **현재 HEAD**
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
- `money-shorts-os-ecos-live-truth-alignment-v1`: **완료, 미커밋**
  - `ecos-fixtures.ts`: `ECOS_BASE_RATE_ROW_DEC2024.DATA_VALUE` `"3.25"` → `"3.00"`
  - `candidates.ts`: mock snapshot previousValue/changeValue/Text live truth에 정렬
  - 다음 단계: `/fact-cards/manual/package-preview`에 live 또는 aligned candidate 연결 검토

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

- `ecos-live-connector-v1` 누적 diff를 Codex review 후 safe local checkpoint commit.

그 다음 (Owner가 ECOS API key를 env에 주입한 뒤):

- `node scripts/_ecos-live-check.mjs` 1회 실행 → `RESULT: LIVE_OK` 확인 (소량 실제 데이터)
- live snapshot → `ecosBaseRateParser` → Fact Card candidate 정합성 확인
- 정상 시 `/fact-cards/manual/package-preview`에 live candidate 연결 검토 (별도 slice)
- 아직 GPT, 영상, ElevenLabs, ffmpeg/render로 가지 않는다.

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
