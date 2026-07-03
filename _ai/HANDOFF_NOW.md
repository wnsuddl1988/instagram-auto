# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`.
- 같은 우선순위 addendum: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`.
- Golden Sample v3.2 lock/standard/gap 문서:
  - `_ai/GOLDEN_SAMPLE_V3_2_ACCEPTANCE_LOCK.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
  - `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
  - `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
  - `scripts/fixtures/golden_sample_v3_2_automation_implementation_gap_analysis.v1.json`
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-upload-hard-block-safety-guard-v1`
- Status: approved by Owner after gap analysis checkpoint.
- Slice status: **COMPLETED 2026-07-03** — `POST /api/upload` fail-closed hard block 적용 (`lib/upload-hard-block.ts` + guard 선행 403, static check 28항목 ALL PASS, tsc 무오류, 읽기 전용 adversarial 리뷰 2종 SAFE). 실제 업로드/외부 API 호출 0. uploadReady=false / automationExpansionReady=false 유지.
- Owner decision:
  - `Slice 0 — upload hard block safety guard`를 먼저 진행한다.
- Purpose:
  - Upload implementation is **not** approved.
  - The goal is to make forbidden upload state structurally enforced in code.
  - Current `uploadReady=false` / `automationExpansionReady=false` must become fail-closed behavior at upload entrypoints.

## Accepted Golden Sample Basis

- Latest checkpoint: `c226a98 docs(golden-sample): add v3.2 automation gap analysis`.
- Golden Sample candidate status: `ACCEPTED_AS_GOLDEN_SAMPLE_FINAL_CANDIDATE`.
- Readiness flags remain:
  - `uploadReady=false`
  - `automationExpansionReady=false`
- Gap analysis finding:
  - `app/api/upload/route.ts` currently has no auth/gate and can call `uploadInstagramReel()` from one POST if credentials exist.
  - `automationExpansionReady` is not enforced in code.
  - Therefore upload must be hard-blocked before any further implementation.

## Goal

Add a minimal fail-closed safety guard so live upload entrypoints cannot proceed unless a future Owner-approved upload-readiness contract explicitly enables it.

This slice must **block** upload; it must not make upload easier.

## Scope

Allowed implementation files:

1. `app/api/upload/route.ts`
   - Add hard-block guard before any Instagram/YouTube/upload side effect.

2. Optional new pure helper:
   - `lib/upload-hard-block.ts` or similar.
   - Must be deterministic, side-effect free, no env reads, no network, no credentials.

3. Optional static check script:
   - `scripts/check-golden-sample-upload-hard-block-static.mjs`
   - Must not call the route over HTTP.
   - Must not call Instagram/YouTube APIs.
   - Should inspect source/helper behavior and assert fail-closed defaults.

4. Optional fixture:
   - `scripts/fixtures/golden_sample_v3_2_upload_hard_block_policy.v1.json`
   - Machine-readable policy: uploadReady=false, automationExpansionReady=false, uploadBlocked=true.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise evidence.

6. `_ai/HANDOFF_NOW.md`
   - Minimal completed status update only if needed.

Do not touch other implementation files unless the route import requires a tiny helper barrel/export.

## Required Behavior

### Fail-closed server behavior

- `POST /api/upload` must return a non-2xx response before any live upload call when:
  - no server-side upload approval contract exists, or
  - `uploadReady !== true`, or
  - explicit Owner live-upload approval is absent, or
  - automation/upload expansion is not approved.

- Current expected behavior for this project state:
  - always blocked.
  - recommended HTTP status: `403`.
  - response JSON should be explicit and machine-readable, e.g.
    - `success: false`
    - `error: "UPLOAD_BLOCKED_BY_GOLDEN_SAMPLE_GUARD"`
    - `uploadReady: false`
    - `automationExpansionReady: false`
    - `blockerCodes: [...]`

### Do not trust client body

- The guard must not allow upload merely because the request body contains:
  - `uploadReady: true`
  - `automationExpansionReady: true`
  - `ownerApproved: true`
  - any similar client-provided flag.

- Client body may be used only for diagnostics/log context, not authorization.

### No live side effects

- In blocked state, the code must not call:
  - `uploadInstagramReel`
  - any YouTube upload helper
  - `updateGenerationStatus(..., "uploaded", ...)`

### Preserve future extension point

- Leave a clear TODO/typed contract for a future server-side upload readiness fixture/ledger, but keep it disabled now.
- Do not implement real approval loading from env/DB in this slice.
- Do not add auth/dependency/DB schema in this slice.

## Suggested Design

Preferred:

- Add a pure helper:
  - `evaluateGoldenSampleUploadHardBlock(input?: unknown): UploadHardBlockResult`
  - returns `allowed: false` by default.
  - includes blocker codes such as:
    - `upload_not_owner_approved`
    - `upload_ready_false`
    - `automation_expansion_not_approved`
    - `server_side_upload_contract_missing`
  - has no external dependencies.

- In `app/api/upload/route.ts`:
  - parse body as today.
  - immediately evaluate guard.
  - if `allowed !== true`, return `NextResponse.json(..., { status: 403 })`.
  - only after guard passes may upload code be reachable.

Because no live upload is approved, the helper should not have any currently reachable allowed path unless a future server-side contract is added in a separately approved slice.

## Required Checks

Minimum:

- `git status -sb`
- `node --check` for any new/changed `.mjs` check script.
- JSON parse for any new fixture.
- Targeted static check proving:
  - route imports/calls guard before `uploadInstagramReel`.
  - blocked result contains `UPLOAD_BLOCKED_BY_GOLDEN_SAMPLE_GUARD`.
  - no new file contains `uploadReady:true`, `automationExpansionReady:true`, `implementationApproved:true`, or secret/API key values.

If feasible without live network/upload:

- Run the pure helper through a small local assertion script.

Do **not** make a live HTTP POST to `/api/upload` if there is any chance it can call external upload APIs. Prefer pure helper/static source checks.

Do not run full `pnpm build` unless a TypeScript/import issue requires it. If run, it must not trigger upload/API calls.

## Forbidden

- Real upload.
- Any Instagram/YouTube API call.
- Calling `/api/upload` in a way that could upload.
- Upload queue creation.
- Upload readiness true.
- automationExpansionReady true.
- implementationApproved true.
- Image generation.
- ChatGPT/Playwright generation.
- OpenAI API calls.
- FLUX2/BFL calls.
- Gemini calls.
- Midjourney calls.
- ElevenLabs live TTS calls.
- Render/mux regeneration.
- Env/secret/dependency/DB/deploy changes.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days visual-only render diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Commit/push.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 163 before this slice.
- Latest checkpoint: `c226a98 docs(golden-sample): add v3.2 automation gap analysis`.
- Excluded/rejected/admin files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

