# Next Action

## 2026-06-26 현재 — package-preview-publishability-readiness-panel-v1 완료, checkpoint 대기

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 committed checkpoint:

- `c37426e fix(owner-decision): block non-publishable fact cards at gate` ← **현재 HEAD**
- branch: `codex/source-first-blueprint-clean`
- push: 미실행
- known local extra: `piq_diag_out.txt` untracked, 작업 무관, 제외 유지

최근 완료 (uncommitted):

- `package-preview-publishability-readiness-panel-v1`: ⑧ Publishability Readiness 패널 추가, 기존 섹션 ⑨~⑬ re-number, browser smoke PASS (default + base-rate)
- `owner-decision-publishability-gate-v1`: FactCard.isPublishable=false → gate 차단 보장 (committed at c37426e)

최근 완료 (committed):

- `money-shorts-os-auto-fact-card-candidate-v1`: checkpoint `d85b616`
  - mock ECOS `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard()` 경로
  - `/fact-cards/manual/package-preview?candidate=base-rate` preview
- `money-shorts-os-ecos-connector-scaffold-v1`: checkpoint `20ab76b`
  - ECOS request spec, mock transport, normalizer, scaffold candidate
- `money-shorts-os-ecos-live-connector-v1`: checkpoint `87caec6`
  - async live transport boundary, secret-safe ECOS live transport, read-only live check script
- `money-shorts-os-ecos-live-truth-alignment-v1`: checkpoint `43fe473`
  - Jan2025/Dec2024 historical smoke fixture aligned to ECOS live truth (`3.0% -> 3.0%`)
  - Jan2025 marked historical smoke fixture, not production default
- `money-shorts-os-ecos-latest-period-resolver-v1`: checkpoint `63d9b10`
  - latest-period window resolver without `Date.now()`
  - live latest found `202605` / previous `202604`, both `2.5연%`
  - blocked without verified source date; no Jan2025 fallback
- `money-shorts-os-ecos-source-date-resolver-v1`: checkpoint `4bc9f0a`
  - BOK official base-rate decision history resolver
  - latest ECOS value `2.5%` matched official latest BOK decision `2025-05-29 2.50%`
  - verifiedPublishedDate `2025-05-29`
  - source date is official BOK decision date, not derived from ECOS period `202605`
- `money-shorts-os-ecos-latest-live-draft-candidate-v1` + review-fix: checkpoint `525e635`
  - latest ECOS rows -> latest period -> BOK source-date -> normalized snapshot -> Fact Card draft candidate
  - `sourceProviderId=provider-ecos-live`, `isMock=false`, `isPublishable=false`
  - BOK source-date provenance를 rawPayload와 citation에 보존
  - candidate validation 실패 시 `draft_ready` 금지 (`blocked_candidate_validation_failed`)

### 최신 committed 5개 작업 (2026-06-26, ecos-base-rate-wording ~ owner-decision-gate-qa)

- `92f545b fix(source-facts): improve unchanged base-rate wording`
- `a69e497 feat(package-preview): show chart card props in package preview`
- `5368566 feat(package-preview): add css chart card visual previews`
- `41f4c25 fix(package-preview): stabilize chart card visual preview width`
- `101c22e feat(money-shorts): add live latest draft entrypoint to hub`

## 최근 완료 (2026-06-26 추가 — owner-decision-publishability-gate-v1)

`owner-decision-publishability-gate-v1`: uncommitted (Codex checkpoint 승인 대기)

- `lib/review-packet/types.ts`: `ReviewFactCardSummary.isPublishable: boolean` 추가
- `lib/review-packet/generator.ts`: `isPublishable: factCard.isPublishable` 전파
- `lib/owner-decision/types.ts`: `GateBlockerCode`에 `"fact_card_not_publishable"` 추가
- `lib/owner-decision/gate.ts`: reviewPacketId 검사 직후 publishability 체크 → decision 검사 이전에 차단
- `app/fact-cards/manual/package-preview/page.tsx`: `fact_card_not_publishable` blocker red note 표시, non-live mock note 갱신

## 다음 safe work unit

Codex 지시 대기. 현재 활성 task 없음.

아직 하지 않을 것:

- GPT/script/video/render/package 생성
- publishable=true 전환

금지 (계속 유지):

- OS clipboard write
- DB/Supabase read/write/migration
- ffmpeg/render/output 생성
- OpenAI/GPT/Gemini/Veo/ElevenLabs live call
- KOSIS/OpenDART/FRED live API 호출
- API key/env/secret 변경
- dependency/lockfile 변경
- `output/` 변경
- payment/deploy/upload/post/push (Owner 명시 승인 없이)
- 이전 영상 후보 개선
