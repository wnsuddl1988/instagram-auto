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
- Latest safety/standard checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
  - `98913d4 feat(golden-sample): add tts audio audit standard guard`
  - `3494d79 feat(golden-sample): add integrated readiness standard guard`
  - `37fda6d feat(golden-sample): add owner decision packet guard`
  - `9607eab feat(golden-sample): record owner decision state guard`
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-chatgpt-playwright-image-allow-guard-review-fix-v1`
- Status: **approved by Owner 2026-07-04 KST as no-live continuation**.
- Owner basis:
  - Owner approved continuing required no-live implementation sequentially: `그래 진행해 다 구현되고 나면 또 얘기해보자`.
  - Decision state fixture has resolved:
    - `image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts`
- Slice type: no-live ChatGPT/Playwright image allow-guard review-fix + static guard update only.

### Review-Fix Addendum

Prior work in this slice hardened `lib/paidApiGuard.ts`, OpenAI image scripts, and BFL/FLUX2 image scripts. Codex review accepted that direction but found remaining non-archive ChatGPT/Playwright image runner gaps that still need the same fail-closed treatment before checkpoint.

Known remaining gap files:

- `scripts/run-premium-editorial-scene-1-6-fullset-image-generation-v2-first-run.mjs`
- `scripts/_upload002-s5-kf-generate.mjs`
- `scripts/_chatgpt-image-preflight.mjs`
- `scripts/_chatgpt-image-anchor-generate.mjs`

Required fix for this review-fix:

- Each listed file must require `ALLOW_CHATGPT_IMAGE=1` before any browser/Chrome/CDP action, message/image submission, image collection, network recovery/fetch, output write, or other visible side effect.
- Prefer checking before top-level output directory creation or file writes. Pure argument parsing and constant setup may remain before the guard.
- `--preflight-only` still launches browser/CDP, so it must be guarded.
- A genuinely non-browser dry-run path may stay lightweight only if it performs no browser/CDP/network/image/output side effects before exit; otherwise guard it too.
- Update `scripts/fixtures/golden_sample_v3_2_paid_image_allow_guard_policy.v1.json` so these files are no longer listed as unresolved known gaps once hardened.
- Strengthen `scripts/check-golden-sample-v3-2-paid-image-allow-guard-static.mjs` so non-archive ChatGPT/Playwright image runners with `chromium`, `ensureChrome`, or `connectOverCDP` must either be policy-hardened with `ALLOW_CHATGPT_IMAGE` or explicitly classified as non-executable/non-image with evidence. Do not allow silent `knownGaps` pass-through for these four files after this task.

## Purpose

Make paid/external image generation paths fail closed unless both a master paid-API switch and an explicit provider/action allow flag are present.

Current known risk:

- `lib/paidApiGuard.ts` currently documents and implements: `PAID_API_ENABLED=true + 세부 플래그 없음 → 전부 허용`.
- This conflicts with the resolved decision `image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts`.
- Some standalone image scripts read `OPENAI_API_KEY` or `BFL_API_KEY` and can proceed without a dedicated allow flag.

This slice must harden the guard semantics and active paid image script entrypoints **without running any paid/image/API/browser path**.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
2. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_packet.v1.json`
3. `lib/paidApiGuard.ts`
4. Active image generation / paid image provider entrypoints, targeted by search:
   - `lib/imagen.ts`
   - `app/api/render-v2/route.ts`
   - `app/api/generate-v2/route.ts`
   - `scripts/run-openai-full-selected-image-candidates-v1.mjs`
   - `scripts/run-golden-sample-image-source-test-v1.mjs`
   - `scripts/run-flux2-selected-image-set-completion-v1.mjs`
   - other non-archive scripts under `scripts/` that directly use `OPENAI_API_KEY`, `BFL_API_KEY`, `GEMINI_API_KEY`, FLUX/BFL endpoints, OpenAI image endpoint, or Imagen for image generation.

Do not read protected/excluded files:

- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- `output/`
- `C:\tmp`

## Scope

Allowed files:

1. `lib/paidApiGuard.ts`
   - Change semantics to strict per-provider allow:
     - `PAID_API_ENABLED=true` alone is not enough.
     - Provider/action-specific `ALLOW_* = true` is required.
   - Update comments/docs to remove the old permissive rule.
   - Add paid image providers if needed, for example `openai-image` and `bfl-flux2`, with clear env names.
   - Preserve existing TTS/generate callers by requiring their explicit flags as already documented.

2. Active paid image scripts/helpers that need explicit allow guards.
   - Add fail-closed allow guard checks before any `.env.local` secret read, API key read, network endpoint construction, browser/CDP launch, output directory write, or fetch.
   - For script-level guards, require provider-specific flags such as:
     - OpenAI image: `PAID_API_ENABLED=true` + `ALLOW_OPENAI_IMAGE=true`
     - BFL/FLUX2: `PAID_API_ENABLED=true` + `ALLOW_BFL_FLUX2=true`
     - ChatGPT/Playwright image: existing `ALLOW_CHATGPT_IMAGE=1` is acceptable, but ensure it is checked before browser/CDP/network.
     - Imagen: `PAID_API_ENABLED=true` + `ALLOW_IMAGEN=true`
   - Do not execute these scripts.
   - Do not modify archived scripts unless the static inventory proves they are active entrypoints; prefer excluding `scripts/archive/**` from enforcement and documenting that exclusion.

3. New static guard:
   - Recommended: `scripts/check-golden-sample-v3-2-paid-image-allow-guard-static.mjs`
   - Must verify strict `paidApiGuard` semantics with mocked/in-memory env only.
   - Must verify old behavior is gone: `PAID_API_ENABLED=true` + missing provider flag must be blocked.
   - Must scan active paid image scripts for explicit allow gate before secret/API/fetch/output side effects.
   - Must verify decision state includes `image_script_allow_guard` resolved to `add_allow_guard_to_all_paid_image_scripts`.
   - Must fail on mutants:
     - master-only allow,
     - provider flag missing,
     - provider flag false,
     - script reads `OPENAI_API_KEY`/`BFL_API_KEY` before allow guard,
     - script writes output before allow guard,
     - ChatGPT image script launches browser/CDP before `ALLOW_CHATGPT_IMAGE`.

4. Optional fixture if useful:
   - Recommended if needed: `scripts/fixtures/golden_sample_v3_2_paid_image_allow_guard_policy.v1.json`
   - Can list active paid image providers/scripts, required env flags, and exclusions.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Update status only if needed.

Do not modify upload, DB, deploy, dependency, lockfile, env files, or output assets.

## Required Safety Semantics

- No paid or external call is made.
- No real env/secret value is read or printed during validation.
- Static/unit checks may set temporary in-process dummy `process.env` values and restore them.
- `.env.local` must not be read by tests.
- Any script that can generate paid/external images must abort before secret read and before side effects unless the exact allow flags are present.
- `PAID_API_ENABLED=true` is a master switch only, never sufficient alone.
- `image_script_allow_guard` decision does not approve image generation.
- Current readiness remains `STANDARDIZED_NO_LIVE_READY`.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. TypeScript syntax/type sanity for changed `.ts` if practical:
   - Prefer focused guard script checks.
   - Run full `pnpm typecheck` only if the TypeScript change cannot be reasonably validated otherwise.
4. Run new static guard:
   - `node scripts/check-golden-sample-v3-2-paid-image-allow-guard-static.mjs`
5. Regression sanity:
   - `node scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Do not run full build unless a syntax/import issue requires it.
Do not run any image/TTS/render/upload script.

## Forbidden

- Live TTS or paid/free TTS API call.
- Env/secret reads or writes during validation.
- Reading `.env.local` during validation.
- Audio/video/image file read for analysis.
- ffmpeg/ffprobe/silencedetect execution.
- render/mux regeneration.
- Audio/video/image generation.
- ChatGPT/Playwright execution.
- Browser/Chrome/CDP launch.
- OpenAI API.
- FLUX2/BFL API.
- Gemini/Midjourney.
- ElevenLabs live TTS.
- upload or upload queue.
- live HTTP POST to `/api/upload`.
- dependency/lockfile changes.
- DB/schema/deploy changes.
- Adding font files.
- Running or modifying protected/excluded files:
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `output/`
  - `C:\tmp`
- Commit/push.

## Definition Of Done

- `PAID_API_ENABLED=true` alone no longer allows any paid provider.
- Image providers have explicit allow flags and are blocked unless both master and provider/action flag are true.
- Active paid image scripts abort before secret/API/network/browser/output side effects unless their explicit allow guard passes.
- Static guard proves the behavior and fails on key mutants.
- Decision state remains unchanged except as read-only reference.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.
- Final handoff reports changed files, checks/results, deviations/risks, checkpoint recommendation, and progress.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 171 after checkpoint `9607eab`.
- Latest checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
  - `98913d4 feat(golden-sample): add tts audio audit standard guard`
  - `3494d79 feat(golden-sample): add integrated readiness standard guard`
  - `37fda6d feat(golden-sample): add owner decision packet guard`
  - `9607eab feat(golden-sample): record owner decision state guard`
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
