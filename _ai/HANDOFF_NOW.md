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

## Current Approved Slice

- Task ID: `golden-sample-v3-2-integrated-readiness-resolved-decision-reconciliation-v1`
- Status: **approved by Owner as no-live continuation**.
- Owner basis:
  - Owner approved continuing required no-live implementation sequentially: `그래 진행해 다 구현되고 나면 또 얘기해보자`.
  - Decision state fixture has resolved 4 policy decisions:
    - `script_impact_gate_score_authority = codex_judge_with_mandatory_provenance`
    - `font_vendoring = vendor_noto_black_vf_remove_system_dependency`
    - `image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts`
    - `poll_25s_passive_window = accept_25s_passive_window_as_v3_2_behavior`
  - The remaining 6 decisions stay `PENDING`.
- Slice type: no-live integrated readiness reconciliation + harness/static guard update.

## Purpose

Slice 5 integrated readiness was created before the Owner decision resolution packet and still models #1/#6/#9 as pending blockers. Since the individual standards now consume resolved decisions #1, #6, #8, and #9, integrated readiness must be updated to reference the current decision state fixture: exactly 4 resolved policy decisions and exactly 6 pending decisions.

This slice must:

1. Keep readiness at `STANDARDIZED_NO_LIVE_READY`.
2. Reconcile integrated contract/sample plan/harness/static guard with `golden_sample_v3_2_owner_decision_resolution_state.v1.json`.
3. Stop treating resolved #1/#6/#8/#9 as pending blockers inside integrated readiness.
4. Keep the remaining 6 decisions pending:
   - `legacy_line_scope`
   - `upload_endpoint_disposition`
   - `blueprint_schema_unification`
   - `md5_locked_image_durability`
   - `contract_duality_resolution`
   - `owner_viewing_listening_qa`
5. Preserve the distinction: resolved policy decisions are **not** live TTS/render/mux/image/upload/Owner QA/production approval.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
2. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_packet.v1.json`
3. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_sample_plan.t1_lifestyle_inflation.v1.json`
5. `scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
6. `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Targeted reference only if needed for checkpoint/path validation:

- `scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
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

1. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json`
   - Add/replace current decision-state section so it references `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`.
   - Record exact resolved 4 and pending 6 key sets.
   - Remove or clearly supersede stale wording that says #1/#6/#8/#9 are still unresolved blockers.
   - Keep `readinessVerdict.current = STANDARDIZED_NO_LIVE_READY`.
   - Keep all readiness flags false.
   - If checkpoint references are maintained, update latest relevant no-live standard checkpoints:
     - script impact provenance: `9fe6f77`
     - ChatGPT passive window: `bb1fb59`
     - Pillow font policy: `3222cba`
     - paid/browser image allow guard: `c80b024` / `85865ba`

2. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_sample_plan.t1_lifestyle_inflation.v1.json`
   - Replace stale `unresolvedOwnerDecisionsAcknowledged` style entries for #1/#6/#9 with current decision-state acknowledgement.
   - Include exact resolved 4 + pending 6, or reference the contract section that contains them.
   - Preserve uploadReady/automationExpansionReady/live flags false and Owner QA pending.
   - Do not mark production/live/upload/render/image/TTS ready.

3. `scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
   - Add pure helper(s) to validate owner decision resolution state:
     - exact resolved keys set,
     - exact pending keys set,
     - resolved values match the state fixture,
     - pending decisions remain PENDING,
     - resolved decisions do not imply live/render/mux/upload/Owner QA approval.
   - Update contract and plan validators to use current decision-state semantics instead of requiring #1/#6/#9 as unresolved.
   - Keep imports restricted to `node:fs`, `node:path`, `node:url`.
   - Do not add network/env/secret/browser/render/mux/upload surfaces.

4. `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
   - Update static checks from stale unresolved #1/#6/#9 expectations to current resolved 4 + pending 6 expectations.
   - Add mutants for:
     - resolved key removed,
     - extra resolved key added,
     - resolved value changed,
     - pending key removed,
     - pending decision marked RESOLVED/PASS,
     - Owner QA marked PASS,
     - any readiness/live/upload/render/image/TTS flag true,
     - resolved #1/#6/#8/#9 reintroduced as pending blocker,
     - policy resolution used as production/live readiness.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Update status only if needed.

Do not modify the owner decision state fixture in this slice unless an actual contradiction is found. It is the source of truth.

## Required Safety Semantics

- No live TTS/API call.
- No ChatGPT/Playwright/browser/Chrome/CDP execution.
- No image/video/audio generation or read.
- No frame/video render, Pillow/Python/ffmpeg/ffprobe, mux, upload.
- No env/secret access.
- No dependency/lockfile/font file/DB/deploy change.
- Current readiness remains `STANDARDIZED_NO_LIVE_READY`.
- Resolved policy decisions do not equal Owner viewing/listening QA pass.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. JSON parse for every changed/new fixture
4. Integrated harness dry-run:
   - `node scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
5. Updated integrated static guard:
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
6. Regression sanity:
   - `node scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
   - `node scripts/check-golden-sample-v3-2-paid-image-allow-guard-static.mjs`
   - `node scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
   - `node scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
   - `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Running live TTS, paid/free APIs, ChatGPT, Playwright, browser, Chrome, CDP, image/video/audio generation, render, mux, upload, Pillow/Python/ffmpeg/ffprobe, or external network.
- Reading `.env.local` or any actual env/secret value.
- Reading/analyzing audio/video/image files.
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

- Integrated readiness contract and plan reference current owner decision state.
- Resolved decision set is exactly #1/#6/#8/#9 with expected values.
- Pending decision set is exactly the remaining 6 keys, including `owner_viewing_listening_qa`.
- Integrated harness validates this fail-closed.
- Integrated static guard proves the behavior and fails on key mutants.
- Readiness remains `STANDARDIZED_NO_LIVE_READY`; all live/upload/render/image/TTS/Owner QA flags remain false.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 176 after checkpoint `3222cba`.
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
