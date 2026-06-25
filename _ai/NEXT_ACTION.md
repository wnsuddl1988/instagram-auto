# Next Action

## 2026-06-25 현재 — ECOS Connector Scaffold 완료, checkpoint 대기

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 돈관리 쇼츠 생성기가 아니다.
- 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 콘텐츠 비중은 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 checkpoint:

- `d85b616 feat(source-facts): add auto fact card candidate preview` ← **현재 HEAD**
- (이전: `9978d61 test(money-shorts): record mvp1 rc smoke pass`)
- branch: `codex/source-first-blueprint-clean`
- push: 미실행

최근 완료:

- `money-shorts-os-auto-fact-card-candidate-v1` + review-fix: checkpoint `d85b616`
  - mock ECOS `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard()` 경로
  - `/fact-cards/manual/package-preview?candidate=base-rate` preview
- `money-shorts-os-ecos-connector-scaffold-v1`: **완료, 미커밋**
  - `ecos-connector.ts`: EcosTransport interface + mock transport factory + runEcosConnector()
  - `ecos-fixtures.ts`: 2-period mock rows (Jan2025 3.00% / Dec2024 3.25%)
  - `ecos-normalizer.ts`: normalizeEcosBaseRateRows() + scaffold end-to-end candidate
  - scaffold path: request spec → mock transport → RawDataSnapshot → parser → Fact Card candidate

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

- `ecos-connector-scaffold-v1` 누적 diff를 Codex review 후 safe local checkpoint commit.

그 다음 (live connector — Owner 명시 승인 후):

- `EcosLiveTransport` 구현 (fetch() + ECOS API key 사용) — process.env 사용이므로 Owner 명시 승인 필요
- ECOS live API call 첫 연결 검증 (소량 실제 데이터, paid API key 필요)
- 아직 GPT, 영상, ElevenLabs, ffmpeg/render로 가지 않는다.

금지 (계속 유지):

- OS clipboard write
- API route 호출 또는 변경
- DB/Supabase read/write/migration
- ffmpeg/render/output 생성
- OpenAI/GPT/Gemini/Veo/ElevenLabs live call
- ECOS/KOSIS/OpenDART/FRED live API 호출
- API key/env/secret 변경
- dependency/lockfile 변경
- `output/` 변경
- payment/deploy/upload/post/push (Owner 명시 승인 없이)
- 이전 영상 후보 개선
