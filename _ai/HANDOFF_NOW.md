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
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
  - `98913d4 feat(golden-sample): add tts audio audit standard guard`
  - `3494d79 feat(golden-sample): add integrated production readiness guard`
  - `37fda6d feat(golden-sample): add owner decision packet`
  - `9607eab feat(golden-sample): record owner decisions now state`
  - `c80b024 feat(golden-sample): harden paid image allow guards`
  - `85865ba feat(golden-sample): close browser runner guard gaps`
  - `9fe6f77 feat(golden-sample): standardize script impact provenance`
  - `bb1fb59 feat(golden-sample): resolve chatgpt runner passive window`
  - `3222cba feat(golden-sample): resolve pillow font vendoring policy`
  - `07a5f4e feat(golden-sample): reconcile integrated readiness decisions`
  - `81d2c5d feat(golden-sample): resolve owner decisions safe defaults`
  - `e2014e1 feat(golden-sample): add future execution plan gate`

## Current Approved Slice

- Task ID: `golden-sample-v3-2-live-action-approval-packet-standardization-v1`
- Status: **approved as no-live planning/approval-packet standardization only** under the Owner's instruction to proceed with necessary sequential parts.
- Slice type: no-live future live/action approval packet + static guard.
- This slice must not approve, run, or prepare actual execution side effects. It only creates a machine-readable and human-readable packet for a future explicit Owner live/action decision.

## Current State

- Owner policy decisions are fully resolved: 10 resolved / 0 pending.
- Decision state status: `ALL_POLICY_DECISIONS_RESOLVED_NO_LIVE`.
- Future execution plan gate exists: `scripts/fixtures/golden_sample_v3_2_future_execution_plan_gate.v1.json`.
- Integrated readiness remains `STANDARDIZED_NO_LIVE_READY`.
- `ownerViewingListeningActualStatus` remains `PENDING_DIRECT_OWNER_REVIEW`.
- `ownerQaPassed`, `uploadReady`, `productionReady`, render/image/TTS/browser/live flags remain false.
- Upload hard block remains active.

## Purpose

The future execution plan gate requires any future live/action slice to have explicit Owner approval, call/cost caps, stop conditions, provider allow guards, artifact audit, and Owner QA separation. This slice creates a **no-live approval packet** that makes those future approvals copy-ready and machine-checkable, without granting any approval now.

The packet must prevent ambiguity between:

- policy decisions already resolved,
- no-live readiness/plan gates passing,
- a future explicit live/action approval,
- actual Owner direct viewing/listening QA,
- upload approval.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_future_execution_plan_gate.v1.json`
2. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json`
3. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_sample_plan.t1_lifestyle_inflation.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
5. `scripts/fixtures/golden_sample_v3_2_paid_image_allow_guard_policy.v1.json`
6. `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json`
7. `scripts/fixtures/golden_sample_v3_2_pillow_renderer_contract.v1.json`
8. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`
9. `scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
10. `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

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

1. `scripts/fixtures/golden_sample_v3_2_live_action_approval_packet.v1.json` (new)
   - Machine-readable no-live approval packet.
   - Must include:
     - `status: LIVE_ACTION_APPROVAL_PACKET_DRAFT_NO_LIVE`
     - `isApprovalRequestOnly: true`
     - `approvalGrantedNow: false`
     - all current approval/readiness flags false.
     - references to future execution plan gate, integrated readiness, decision state, provider allow policy, and slice contracts.
     - decision state 10 resolved / 0 pending.
     - actual Owner QA pending and upload hard block active.
     - domain approval request templates for:
       - image/browser generation,
       - TTS/audio,
       - Pillow/render,
       - mux/audit,
       - Owner direct QA,
       - upload.
     - each domain must have:
       - current status blocked/not approved,
       - required explicit Owner approval wording,
       - suggested cap fields marked `effectiveNow: false`,
       - required stop conditions,
       - required artifact audit plan,
       - required provider allow guard refs where applicable,
       - no upload implication except the upload domain, which remains hard-blocked.
     - upload approval template must require actual Owner QA pass first and keep upload hard block active until a separate upload slice.
   - Must not contain real secrets, env values, executable commands, or active budgets.

2. `_ai/GOLDEN_SAMPLE_V3_2_LIVE_ACTION_APPROVAL_PACKET.md` (new)
   - Human-readable Owner packet.
   - Must start with clear wording: this is not live approval.
   - Must explain exactly what remains blocked.
   - Must provide copy-ready Owner approval snippets for future use, but each snippet must be clearly labeled "future use only / not approved now".
   - Must separate:
     - image/browser live approval,
     - TTS/audio live approval,
     - render/mux approval,
     - Owner direct viewing/listening QA result,
     - upload approval.
   - Must state that upload approval is last and requires Owner QA actual pass.

3. `scripts/check-golden-sample-v3-2-live-action-approval-packet-static.mjs` (new)
   - Dependency-free static guard.
   - Import allowlist: `node:fs`, `node:path`, `node:url` only.
   - Validate fixture and markdown fail-closed semantics:
     - approval packet status is draft/no-live.
     - no approval granted now.
     - all flags false.
     - decision state 10/0, Owner QA actual pending, upload hard block active.
     - packet references future execution plan gate and required source contracts.
     - domain templates exist and all current statuses are blocked/not approved.
     - suggested caps are marked inactive/effectiveNow=false.
     - stop conditions and artifact audit required.
     - provider allow guard refs exist for image/browser and TTS/audio where applicable.
     - markdown snippets are labeled future-only and do not claim approval now.
     - upload snippet requires Owner QA actual pass and separate upload approval.
     - guard source and fixture/markdown have no forbidden live/env/write execution patterns.
   - Include mutants for:
     - approvalGrantedNow true,
     - any readiness/approval flag true,
     - Owner QA actual status PASS,
     - ownerQaPassed true,
     - upload hard block inactive,
     - active/effective caps now,
     - missing stop conditions,
     - missing provider allow guard,
     - upload snippet not requiring Owner QA pass,
     - markdown claiming live approval now.

4. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

5. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Do not modify production code, upload implementation, runners, renderers, media files, env, dependencies, DB/deploy, protected/excluded files, or generated artifacts.

## Required Safety Semantics

- This slice is a no-live approval-packet draft only.
- No approval is granted now.
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
4. New approval packet guard:
   - `node scripts/check-golden-sample-v3-2-live-action-approval-packet-static.mjs`
5. Regression sanity:
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
   - `node scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
   - `node scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
   - `node scripts/check-golden-sample-v3-2-paid-image-allow-guard-static.mjs`

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

- New no-live live/action approval packet fixture exists.
- New human-readable Owner approval packet exists.
- New static guard validates fail-closed approval-packet semantics and mutants.
- Packet references the future execution plan gate and source contracts.
- Readiness remains `STANDARDIZED_NO_LIVE_READY`.
- Upload hard block remains active.
- Actual Owner viewing/listening QA remains pending.
- All live/upload/render/image/TTS/browser/Owner QA/production flags remain false.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 179 after checkpoint `e2014e1`.
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
