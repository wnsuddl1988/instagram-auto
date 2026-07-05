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
- Latest safety/standard checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `c80b024 feat(golden-sample): harden paid image allow guards`
  - `85865ba feat(golden-sample): close browser runner guard gaps`
  - `9fe6f77 feat(golden-sample): standardize script impact provenance`
  - `bb1fb59 feat(golden-sample): resolve chatgpt runner passive window`
  - `3222cba feat(golden-sample): resolve pillow font vendoring policy`
  - `07a5f4e feat(golden-sample): reconcile integrated readiness decisions`

## Current Approved Slice

- Task ID: `golden-sample-v3-2-owner-decisions-safe-default-final-resolution-v1`
- Status: **approved by Owner as no-live policy resolution**.
- Owner basis:
  - Owner approved the recommended decision: `남은 pending 6개를 아래 safe default로 정책 확정한다. 단, 이는 no-live 정책 결정일 뿐 upload/render/mux/image/TTS/browser/API/env/dependency/DB/deploy 실행 승인이 아니다.`
  - Previously resolved decisions #1/#6/#8/#9 remain unchanged.
- Slice type: no-live Owner decision state final resolution + integrated readiness reconciliation.

## Purpose

The current owner decision state records 4 resolved policy decisions and 6 pending decisions. Owner has now approved resolving the remaining 6 decisions to the safe defaults from the decision packet. This slice updates the decision state and integrated readiness to represent **10 resolved policy decisions / 0 pending policy decisions**, while preserving that no live action is approved and actual Owner viewing/listening QA has not passed.

This slice must:

1. Resolve the remaining 6 policy decisions to the packet recommended defaults:
   - `legacy_line_scope = isolate_as_pre_v3_2_legacy_documented`
   - `upload_endpoint_disposition = keep_hard_blocked_until_upload_slice`
   - `blueprint_schema_unification = adopt_standard_six_field_names_map_v2`
   - `md5_locked_image_durability = define_durable_backup_location_policy`
   - `contract_duality_resolution = single_v3_2_standard_json_contract`
   - `owner_viewing_listening_qa = keep_manual_owner_qa_mandatory_non_automatable`
2. Preserve all prior resolved values:
   - `script_impact_gate_score_authority = codex_judge_with_mandatory_provenance`
   - `font_vendoring = vendor_noto_black_vf_remove_system_dependency`
   - `image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts`
   - `poll_25s_passive_window = accept_25s_passive_window_as_v3_2_behavior`
3. Keep readiness at `STANDARDIZED_NO_LIVE_READY`.
4. Keep all live/upload/render/image/TTS/browser/Owner QA/production flags false.
5. Make the distinction explicit:
   - `owner_viewing_listening_qa` policy is resolved as "manual mandatory, non-automatable".
   - Actual Owner direct viewing/listening result is still not passed and must not be represented as `ownerQaPassed=true`.
   - `upload_endpoint_disposition` policy keeps upload hard-blocked until a future upload slice; it does not activate upload.
   - `md5_locked_image_durability` policy defines backup-location policy only; it does not move/copy files.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_packet.v1.json`
2. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
3. `_ai/GOLDEN_SAMPLE_V3_2_OWNER_DECISION_PACKET.md`
4. `scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
5. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json`
6. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_sample_plan.t1_lifestyle_inflation.v1.json`
7. `scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
8. `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Targeted reference only if needed:

- `scripts/check-golden-sample-v3-2-owner-decision-packet-static.mjs`
- `scripts/check-golden-sample-v3-2-paid-image-allow-guard-static.mjs`
- `scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
- `scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
- `scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`

Do not read protected/excluded files unless unavoidable:

- `_ai/CODEX_REVIEW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- `output/`
- `C:\tmp`

## Scope

Allowed files:

1. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
   - Change status to a final no-live decision-state status, e.g. `ALL_POLICY_DECISIONS_RESOLVED_NO_LIVE`.
   - Move the remaining 6 keys from `pendingDecisions` into `resolvedDecisions`.
   - Set `resolvedCount=10`, `pendingCount=0`, `pendingKeys=[]`.
   - Keep `readinessVerdict.current = STANDARDIZED_NO_LIVE_READY`.
   - Keep all flags false, especially `ownerQaPassed=false`, `uploadReady=false`, `productionReady=false`.
   - Add/maintain `ownerApprovalSource` with the current Owner approval wording.
   - Add explicit non-live warnings for all newly resolved decisions.
   - Add a separate actual QA status if needed, e.g. `ownerViewingListeningActualStatus: PENDING_DIRECT_OWNER_REVIEW`, so policy resolution cannot be mistaken for QA pass.

2. `scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
   - Update expected state from resolved 4 + pending 6 to resolved 10 + pending 0.
   - Validate every resolved value equals packet `recommendedDefault`.
   - Validate all safeApprovalSnippet/nonApproval warnings remain no-live.
   - Validate `owner_viewing_listening_qa` resolved policy does not set `ownerQaPassed=true`.
   - Add mutants:
     - missing one newly resolved key,
     - wrong value for a newly resolved key,
     - pending key reintroduced,
     - ownerQaPassed true,
     - uploadReady/productionReady true,
     - backup policy used to move/copy files,
     - upload endpoint policy used to enable upload,
     - owner QA policy used as actual PASS.

3. `_ai/GOLDEN_SAMPLE_V3_2_OWNER_DECISION_PACKET.md`
   - Update the "Current Owner Decisions" section to show all 10 policy decisions resolved.
   - Make clear that actual Owner viewing/listening QA remains not passed until the Owner directly reviews the final artifact.
   - Preserve "live 승인 아님" wording.

4. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json`
   - Update `ownerDecisionState` / unresolved decision model to 10 resolved + 0 pending policy decisions.
   - Remove stale pending 6 blockers.
   - Preserve future gates / readiness flags false / `STANDARDIZED_NO_LIVE_READY`.
   - Preserve upload hard block and Owner QA actual-pass separation.

5. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_sample_plan.t1_lifestyle_inflation.v1.json`
   - Update decision acknowledgement to 10 resolved + 0 pending policy decisions.
   - Keep `ownerQaPassed=false`, upload/render/image/TTS/browser/live approvals false.

6. `scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
   - Update owner-decision validation helpers from resolved 4/pending 6 to resolved 10/pending 0.
   - Keep a separate actual Owner QA status check so policy resolution is not QA pass.
   - Keep imports restricted to `node:fs`, `node:path`, `node:url`.
   - Do not add network/env/secret/browser/render/mux/upload surfaces.

7. `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
   - Update expected resolved/pending key sets to 10/0.
   - Add/adjust mutants:
     - resolved key removed,
     - wrong resolved value,
     - pending key reintroduced,
     - owner QA actual status set to PASS,
     - upload hard block removed,
     - upload/render/image/TTS/browser/production flag true,
     - md5 durability policy used as file copy/move approval.

8. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

9. `_ai/HANDOFF_NOW.md`
   - Update status only if needed.

Do not modify upload implementation, renderers, media files, env, dependencies, DB/deploy, or protected/excluded files.

## Required Safety Semantics

- No upload endpoint activation.
- No live TTS/API call.
- No ChatGPT/Playwright/browser/Chrome/CDP execution.
- No image/video/audio generation or read.
- No frame/video render, Pillow/Python/ffmpeg/ffprobe, mux, upload.
- No file move/copy for md5 durability.
- No env/secret access.
- No dependency/lockfile/font file/DB/deploy change.
- Current readiness remains `STANDARDIZED_NO_LIVE_READY`.
- `owner_viewing_listening_qa` policy resolution does not mean actual Owner QA pass.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. JSON parse for every changed/new fixture
4. Owner decision state static guard:
   - `node scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
5. Integrated harness dry-run:
   - `node scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
6. Integrated static guard:
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
7. Regression sanity:
   - `node scripts/check-golden-sample-v3-2-owner-decision-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-paid-image-allow-guard-static.mjs`
   - `node scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
   - `node scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
   - `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Running live TTS, paid/free APIs, ChatGPT, Playwright, browser, Chrome, CDP, image/video/audio generation, render, mux, upload, Pillow/Python/ffmpeg/ffprobe, or external network.
- Reading `.env.local` or any actual env/secret value.
- Reading/analyzing audio/video/image files.
- Moving/copying md5-locked image files or touching `output/` / `C:\tmp`.
- Adding dependencies, changing lockfiles, adding font files, DB/schema/deploy config, or `pnpm-workspace.yaml`.
- Modifying protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `output/`
  - `C:\tmp`
- Commit/push.

## Definition Of Done

- Owner decision state records 10 resolved policy decisions and 0 pending policy decisions.
- Each resolved value matches packet `recommendedDefault`.
- Integrated readiness contract/plan/harness/static guard accept 10/0 decision state.
- Readiness remains `STANDARDIZED_NO_LIVE_READY`.
- Upload hard block remains active.
- Actual Owner viewing/listening QA remains not passed unless separately and explicitly recorded by Owner after direct review.
- All live/upload/render/image/TTS/browser/Owner QA/production flags remain false.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 177 after checkpoint `07a5f4e`.
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `output/`
  - `C:\tmp`

전체프로젝트 진행률 : 약 92%
