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
  - `3494d79 feat(golden-sample): add integrated readiness standard guard`
  - `37fda6d feat(golden-sample): add owner decision packet guard`
  - `9607eab feat(golden-sample): record owner decision state guard`
  - `c80b024 feat(golden-sample): harden paid image allow guards`
  - `85865ba feat(golden-sample): close browser runner guard gaps`
  - `9fe6f77 feat(golden-sample): standardize script impact provenance`

## Current Approved Slice

- Task ID: `golden-sample-v3-2-chatgpt-runner-25s-passive-window-resolution-v1`
- Status: **approved by Owner as no-live continuation**.
- Owner basis:
  - Owner approved continuing required no-live implementation sequentially: `그래 진행해 다 구현되고 나면 또 얘기해보자`.
  - Decision state fixture has resolved:
    - `poll_25s_passive_window = accept_25s_passive_window_as_v3_2_behavior`
- Slice type: no-live ChatGPT/Playwright runner timing interpretation standardization + harness/static guard update.

## Purpose

The ChatGPT+Playwright image runner contract already records the v3.2 operational timing profile including a 25s passive window, but it still labels the 25s passive-window interpretation as Owner decision #9 pending. This slice consumes the resolved Owner decision and makes the 25s passive window the explicit v3.2 standard behavior.

This slice must:

1. Keep all ChatGPT/Playwright/browser/CDP/image/API paths no-live and fail-closed.
2. Update the ChatGPT runner standard so decision #9 is resolved as `accept_25s_passive_window_as_v3_2_behavior`.
3. Preserve the measured profile values already standardized for v3.2:
   - passive wait: `25000ms`
   - active poll: `1800ms`
   - stable confirmations: `3`
   - max generation wait: `150000ms`
   - max total wait: `180000ms`
4. Make the contract/sample plan/harness/static guard fail closed if future edits remove the resolved decision, revert to pending wording, or imply immediate 1-2s polling is the v3.2 standard.
5. Preserve the distinction: timing interpretation is **not** ChatGPT/Playwright/browser/CDP execution approval and not image generation approval.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
2. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_packet.v1.json`
3. `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_sample_plan.t1_lifestyle_inflation.v1.json`
5. `scripts/run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs`
6. `scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`

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

1. `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json`
   - Update `passiveWindowInterpretation` or equivalent section from pending/open wording to resolved Owner decision #9 wording.
   - Add explicit fields if useful:
     - `resolvedDecisionRef`
     - `resolvedValue: "accept_25s_passive_window_as_v3_2_behavior"`
     - `passiveWindowIsStandardV32Behavior: true`
     - `notLiveApproval: true`
   - Keep timing numbers unchanged.
   - Keep no-live/read-only flags unchanged.

2. `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_sample_plan.t1_lifestyle_inflation.v1.json`
   - Add or update timing interpretation evidence so the sample plan references the resolved decision #9.
   - Preserve `executionMode: dry_run_validation_only`, `costCapUsd: 0`, hard cap, Slice 1 evidence references, and no-live policy.
   - Do not add generation approval.

3. `scripts/run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs`
   - Add pure validation helper(s) for passive-window decision resolution if not already present.
   - The validator must fail closed when:
     - decision #9 is absent,
     - resolved value differs from `accept_25s_passive_window_as_v3_2_behavior`,
     - passive wait differs from `25000ms`,
     - active poll differs from `1800ms`,
     - pending/open/TBD wording remains in resolved timing section,
     - the plan claims ChatGPT/Playwright/browser/CDP/image generation approval.
   - Keep imports restricted to `node:fs`, `node:path`, `node:url`.
   - Do not add network/env/secret/browser/CDP/image/API surfaces.

4. `scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
   - Update contract checks from pending #9 wording to resolved `accept_25s_passive_window_as_v3_2_behavior`.
   - Add static and harness-import mutants for:
     - deleting the resolved decision ref,
     - changing resolved value,
     - changing passive wait from 25000ms,
     - changing active poll from 1800ms,
     - reintroducing pending/open/TBD wording,
     - implying immediate-poll-only standard,
     - setting any live/image/browser approval flag true.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Update status only if needed.

Do not modify Slice 5 integrated readiness contract in this slice. Treat it as historical baseline; the resolved decision state fixture is the current source for decision #9.

## Required Safety Semantics

- No ChatGPT/Playwright/browser/Chrome/CDP execution.
- No image generation.
- No paid/free API call.
- No audio/video/image file read.
- No render/mux/upload.
- No env/secret access.
- No dependency/lockfile/DB/deploy change.
- Timing interpretation PASS is not live approval and not image generation readiness.
- Current readiness remains `STANDARDIZED_NO_LIVE_READY`.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. JSON parse for every changed/new fixture
4. Harness dry-run:
   - `node scripts/run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs`
5. Updated ChatGPT runner static guard:
   - `node scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
6. Regression sanity:
   - `node scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Running ChatGPT, Playwright, browser, Chrome, CDP, OpenAI, Gemini, Veo, BFL, image generation, live TTS, render, mux, upload, or external API.
- Reading `.env.local` or any actual env/secret value.
- Reading/analyzing audio/video/image files.
- Adding dependencies, changing lockfiles, DB/schema/deploy config, or `pnpm-workspace.yaml`.
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

- ChatGPT runner contract records decision #9 as resolved: `accept_25s_passive_window_as_v3_2_behavior`.
- Sample plan references the resolved passive-window decision and remains no-live.
- Harness validates passive-window resolution fail-closed.
- Static guard proves the behavior and fails on key mutants.
- Existing runner timing, hard cap, no-live policy, and Slice 1 evidence references remain intact.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 174 after checkpoint `9fe6f77`.
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
