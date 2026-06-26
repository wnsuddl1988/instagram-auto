# Next Action

## 2026-06-26 현재 — owner publishability local approval + overlay + TS fix committed

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 committed checkpoint:

- `6d5425d fix(package-preview): use riskReview.packageId instead of non-existent riskReviewId` ← **현재 HEAD**
- `abe3d36 feat(package-preview): add ledger-approved overlay with current fact card revalidation` (이전)
- branch: `codex/source-first-blueprint-clean` (ahead 54)
- push: 미실행
- known local extra: `piq_diag_out.txt` untracked, 작업 무관, 제외 유지

최근 완료 (committed):

- `6d5425d`: package-preview riskReview.packageId TS fix
  - `app/fact-cards/manual/package-preview/page.tsx` line 1136: `riskReviewId` → `riskReview.packageId`
  - RiskReviewResult 실제 타입 계약 사용, fake field 없음
  - TS check 통과, ESLint 0 warnings
- `abe3d36`: ledger-approved overlay + 4-guard revalidation
  - current server-side Fact Card 재검증 (isMock, factCardId, audit fields, currentEligibility)
  - 3-way inactive reason 구분 (no_record / mock_blocked / ledger_stale_or_ineligible)
  - memory-only clone 생성 (original gateResult/clipboardPayload 불변)
- `91f08a1`: owner publishability local approval ledger
  - `.gitignore` → `/.money-shorts-local/` 추가
  - `lib/owner-decision/local-approval-ledger.ts` (신규) — server-only fs 기반 ledger, atomic write
  - `lib/owner-decision/index.ts` — local-approval-ledger export 추가
  - `app/fact-cards/manual/package-preview/actions.ts` (신규) — Server Action recordApproval/getLedgerRecord
  - `app/fact-cards/manual/package-preview/LedgerStatusPanel.tsx` (신규) — Client Component
  - `app/fact-cards/manual/package-preview/page.tsx` — import 추가, 섹션 ⑧ LedgerStatusPanel 연결

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
