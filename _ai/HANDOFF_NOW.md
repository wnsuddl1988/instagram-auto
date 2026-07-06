# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `AGENTS.md` + 이 파일.
- Golden Sample v3.2 lock/standard/gap 문서:
  - `_ai/GOLDEN_SAMPLE_V3_2_ACCEPTANCE_LOCK.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
  - `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
  - `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
  - `scripts/fixtures/golden_sample_v3_2_automation_implementation_gap_analysis.v1.json`
- Latest safety/standard/live checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
  - `98913d4 feat(golden-sample): add tts audio audit standard guard`
  - `3494d79 feat(golden-sample): add integrated production readiness guard`
  - `81d2c5d feat(golden-sample): resolve owner decisions safe defaults`
  - `e2014e1 feat(golden-sample): add future execution plan gate`
  - `b170b39 feat(golden-sample): add live action approval packet`
  - `ff1847f feat(golden-sample): record live image browser run`
  - `d1c3ae2 feat(golden-sample): prepare live tts audio approval packet`
  - `c02ed21 feat(golden-sample): record live tts audio run`
  - `adbcb4b feat(golden-sample): record live render mux run`

## Current Approved Slice

- Task ID: `golden-sample-v3-2-owner-qa-pass-upload-approval-packet-prep-v1`
- Status: **Owner directly watched/listened and accepted the latest mux candidate; upload execution is still not approved.**
- Exact Owner approval/pass statement:
  - `OWNER_QA_ACTUAL_PASS: t1_lifestyle_inflation — latest mux mp4 watched/listened directly by Owner, visual/caption/story/audio accepted, proceed to prepare upload approval packet only; no upload execution yet`
- Approved domain: **Owner QA actual pass evidence + upload approval packet preparation only**.
- This slice may record:
  - Owner QA actual pass for latest mux candidate.
  - The upload target candidate metadata and references.
  - A future-use upload approval packet/snippet.
- This slice must keep:
  - `uploadApprovedNow: false`
  - `uploadReady: false`
  - `productionReady: false`
  - upload hard block active
  - no upload execution

## Still Not Approved

- Upload execution is not approved.
- Upload endpoint unblocking is not approved.
- Upload queue, `/api/upload` POST, Instagram/YouTube upload clients, n8n upload workflow, DB status update to uploaded, or public publish action is not approved.
- Env/secret read is not approved, including `.env.local`, Instagram/YouTube tokens, Supabase keys, provider API keys, or upload credentials.
- Image generation/regeneration, TTS generation/regeneration, render/mux rerun, browser/CDP, external API/network, dependency/lockfile/font file, DB/deploy changes are not approved.

## Current State

- Existing 9-image set accepted and checkpointed: `ff1847f`.
- Existing ElevenLabs narration/alignment/timing accepted/reused and checkpointed: `c02ed21`.
- Local render/mux candidate created and checkpointed: `adbcb4b`.
- Latest mux candidate:
  - `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- Render/mux automatic audit result:
  - `PASS_CANDIDATE_PENDING_VISION_QA` before Owner review.
- Owner has now provided actual QA pass:
  - visual/caption/story/audio accepted by direct Owner watch/listen.
- Upload hard block remains active until a later explicit `APPROVE_UPLOAD` live slice.

## Purpose

Prepare the upload approval packet for `t1_lifestyle_inflation` without executing upload.

This slice must:

1. Record the exact `OWNER_QA_ACTUAL_PASS` statement as machine-readable evidence.
2. Link the pass to the latest mux candidate and render/mux run plan.
3. Create a no-live upload approval packet that Owner can use for a later explicit upload approval.
4. Preserve upload hard block active and `uploadReady:false` until actual `APPROVE_UPLOAD` is given.
5. Add a static guard that prevents Owner QA pass from being misread as upload approval.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_live_render_mux_run_plan.t1_lifestyle_inflation.v1.json`
2. `scripts/check-golden-sample-v3-2-live-render-mux-run-plan-static.mjs`
3. `scripts/fixtures/golden_sample_v3_2_upload_hard_block_policy.v1.json`
4. `scripts/check-golden-sample-upload-hard-block-static.mjs`
5. `scripts/fixtures/golden_sample_v3_2_live_action_approval_packet.v1.json`
6. `_ai/GOLDEN_SAMPLE_V3_2_LIVE_ACTION_APPROVAL_PACKET.md`
7. `scripts/fixtures/golden_sample_v3_2_future_execution_plan_gate.v1.json`
8. `scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
9. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json`
10. `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
11. The approved output directory metadata/JSON audit only if needed:
    - `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\post_render_artifact_audit_tts_mux.v3_2.json`
    - Do not analyze media/audio/image binaries.

Do not read protected/excluded files unless unavoidable:

- `_ai/CODEX_REVIEW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- unrelated `output/` subtrees
- unrelated `C:\tmp` subtrees

## Scope

Allowed repo files:

1. `scripts/fixtures/golden_sample_v3_2_owner_qa_actual_pass.t1_lifestyle_inflation.v1.json` (new)
   - Must record the exact Owner statement.
   - Must reference latest mux candidate path and checkpoint `adbcb4b`.
   - Must set actual QA pass fields true only for Owner viewing/listening acceptance.
   - Must explicitly set/confirm:
     - `uploadApprovedNow: false`
     - `uploadExecutionApprovedNow: false`
     - `uploadReady: false`
     - `productionReady: false`
     - `uploadHardBlockActive: true`
   - Must state this pass is a prerequisite for later upload approval, not upload approval itself.

2. `scripts/fixtures/golden_sample_v3_2_upload_approval_packet.t1_lifestyle_inflation.v1.json` (new)
   - Future-use-only upload approval packet.
   - Must reference:
     - owner QA actual pass fixture,
     - latest render/mux run plan,
     - upload hard block policy,
     - future execution plan gate,
     - integrated readiness contract,
     - live action approval packet.
   - Must provide a copy-ready future upload approval snippet, but mark it not approved now.
   - Must require a later exact Owner approval such as:
     - `APPROVE_UPLOAD: t1_lifestyle_inflation — upload target=<latest mux mp4>, upload cap=1, platforms=<Instagram|YouTube|both>, no regeneration, no render/mux/TTS/image/browser, allow upload endpoint/credentials only for selected platforms, stop on upload hard-block mismatch/credential missing/platform error/cap exceeded/unexpected response`
   - Suggested snippet may be refined, but it must be future-use-only and must not execute upload.

3. `_ai/GOLDEN_SAMPLE_V3_2_UPLOAD_APPROVAL_PACKET.md` (new)
   - Human-readable Owner packet.
   - Must begin with clear "NOT UPLOAD APPROVAL / 준비 문서" wording.
   - Must show:
     - latest mux mp4 path,
     - Owner QA actual pass statement,
     - upload remains blocked now,
     - future copy-ready upload approval snippet.

4. `scripts/check-golden-sample-v3-2-upload-approval-packet-static.mjs` (new)
   - Dependency-free static guard.
   - Import allowlist: `node:fs`, `node:path`, `node:url` only.
   - Validate:
     - Owner QA pass exact text,
     - latest mux candidate reference,
     - render/mux run plan and audit references,
     - upload packet is future-use-only,
     - uploadApprovedNow/uploadReady/productionReady false,
     - upload hard block active,
     - no env/secret/platform credentials are approved now,
     - future upload snippet requires separate `APPROVE_UPLOAD`,
     - upload cap is not effective now,
     - upload target is latest mux path,
     - markdown matches fixture.
   - Include fail-closed mutants for:
     - owner QA text drift,
     - uploadApprovedNow true,
     - uploadReady true,
     - uploadHardBlockActive false,
     - approval snippet treated as effective now,
     - platform credentials allowed now,
     - missing latest mux reference,
     - missing separate APPROVE_UPLOAD requirement,
     - removing no-regeneration/no-render/no-TTS boundaries.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Avoid modifying existing integrated readiness/future gate/live action approval packet unless strictly required for the new upload packet guard. Prefer new owner-QA-pass + upload-packet artifacts that reference earlier pending-state contracts as historical prerequisites. If an existing contract must be reconciled, keep `STANDARDIZED_NO_LIVE_READY`, `uploadReady:false`, `productionReady:false`, and upload hard block active, and explain why.

Allowed output reads:

- Read-only existence/metadata/JSON audit under:
  - `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\`
- Do not modify or stage `C:\tmp`.
- Do not read/analyze video/audio/image binaries unless Codex/Owner explicitly asks; Owner has already watched/listened.

## Required Execution Order

1. `git status -sb`.
2. Create owner QA actual pass fixture.
3. Create upload approval packet fixture + markdown.
4. Create static guard.
5. Run checks:
   - `node --check scripts/check-golden-sample-v3-2-upload-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-upload-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-upload-hard-block-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-render-mux-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-action-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
6. JSON parse every changed/new fixture.
7. Append `_ai/CLAUDE_REPORT.md`.
8. Stop. No commit/push.

## Required Safety Semantics

- Owner QA actual pass is real and may be recorded as such.
- Owner QA actual pass is **not** upload approval.
- Upload approval packet is **future-use-only**.
- Upload hard block remains active.
- `uploadReady:false` remains true until a later upload execution/readiness slice explicitly changes it.
- No upload endpoint, platform API, env/secret, DB, dependency, render/mux/TTS/image/browser execution.
- No media regeneration.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. JSON parse for every changed/new fixture
4. New upload approval packet guard:
   - `node scripts/check-golden-sample-v3-2-upload-approval-packet-static.mjs`
5. Regression:
   - `node scripts/check-golden-sample-upload-hard-block-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-render-mux-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-action-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Upload execution, `/api/upload` POST, upload queue, Instagram/YouTube upload clients, n8n upload.
- Env/secret read or `.env.local` read.
- External API/network.
- Image generation/regeneration, TTS generation/regeneration, render/mux rerun, browser/CDP.
- Audio/video/image binary analysis.
- Dependency/lockfile/font file/DB/deploy changes.
- Modifying protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/` subtrees
  - unrelated `C:\tmp` subtrees
- Commit/push.

## Definition Of Done

- Owner QA actual pass fixture exists and records exact Owner statement.
- Upload approval packet fixture + markdown exist and are clearly future-use-only.
- Static guard exists and fails closed for upload approval confusion.
- Upload hard block remains active.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` records concise evidence.
- No upload/API/env/secret/render/mux/TTS/image/browser/dependency/DB/deploy occurred.
- No commit/push.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 184 after checkpoint `adbcb4b`.
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/` subtrees
  - unrelated `C:\tmp` subtrees

전체프로젝트 진행률 : 약 92%
