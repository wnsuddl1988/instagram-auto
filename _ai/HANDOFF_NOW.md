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
  - `b170b39 feat(golden-sample): add live action approval packet`

## Current Approved Slice

- Task ID: `golden-sample-v3-2-live-image-browser-chatgpt-run-v1`
- Status: **Owner explicitly approved one live image/browser slice**.
- Exact Owner approval:
  - `APPROVE_LIVE_IMAGE_BROWSER: t1_lifestyle_inflation — provider=ALLOW_CHATGPT_IMAGE, call cap=12, cost cap=$0, stop on provider error/cap exceeded/artifact audit fail`
- Approved domain: **image/browser generation only** via ChatGPT browser path.
- Approved provider flag: `ALLOW_CHATGPT_IMAGE`.
- Approved call/submission cap: `12`.
- Approved cost cap: `$0`.
- Approved stop conditions:
  - provider error or refusal,
  - cap exceeded,
  - artifact audit fail,
  - login/captcha/quota/STOP_DETECTED,
  - unexpected browser/CDP or ChatGPT UI failure.

## Still Not Approved

- Upload is not approved.
- TTS/audio is not approved.
- Pillow/frame render is not approved.
- mux/video render is not approved.
- OpenAI Image API, BFL/FLUX2, Imagen, Gemini/Veo, Midjourney, ElevenLabs, paid/free API routes are not approved.
- `.env.local`, env/secret read, dependency/lockfile/font file, DB/deploy changes are not approved.
- Owner direct viewing/listening QA has not passed.

## Current State

- Owner policy decisions are fully resolved: 10 resolved / 0 pending.
- Future execution plan gate exists: `scripts/fixtures/golden_sample_v3_2_future_execution_plan_gate.v1.json`.
- Live/action approval packet exists: `_ai/GOLDEN_SAMPLE_V3_2_LIVE_ACTION_APPROVAL_PACKET.md` and `scripts/fixtures/golden_sample_v3_2_live_action_approval_packet.v1.json`.
- Integrated readiness remains `STANDARDIZED_NO_LIVE_READY`.
- `ownerViewingListeningActualStatus` remains `PENDING_DIRECT_OWNER_REVIEW`.
- `ownerQaPassed`, `uploadReady`, `productionReady`, render/TTS/mux/upload flags remain false.
- Upload hard block remains active.

## Purpose

Execute the first approved live/action slice: ChatGPT browser image generation for `t1_lifestyle_inflation` only, using the established v3.2 ChatGPT+Playwright runner standard and the existing hardened ChatGPT runner lineage.

This slice must:

1. Record the exact Owner approval as a machine-readable live image/browser run plan.
2. Preflight the live run against the future execution plan gate and approval packet.
3. Run the ChatGPT/Playwright image generation path only if all guards pass.
4. Enforce call cap 12, cost cap $0, provider `ALLOW_CHATGPT_IMAGE`, and stop conditions.
5. Produce or update only the approved image output directory and evidence summaries.
6. Report outcomes without upload/render/mux/TTS or unrelated side effects.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_live_action_approval_packet.v1.json`
2. `_ai/GOLDEN_SAMPLE_V3_2_LIVE_ACTION_APPROVAL_PACKET.md`
3. `scripts/fixtures/golden_sample_v3_2_future_execution_plan_gate.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json`
5. `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_sample_plan.t1_lifestyle_inflation.v1.json`
6. `scripts/run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs`
7. `scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
8. `scripts/run-chatgpt-playwright-fresh-image-set-v3.mjs`
9. `scripts/_chatgpt-image-core.mjs`
10. `scripts/fixtures/chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v3.json`
11. `scripts/fixtures/golden_sample_v3_2_paid_image_allow_guard_policy.v1.json`
12. `scripts/check-golden-sample-v3-2-live-action-approval-packet-static.mjs`
13. `scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`

Do not read protected/excluded files unless unavoidable:

- `_ai/CODEX_REVIEW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- unrelated `output/` subtrees
- `C:\tmp`

## Scope

Allowed repo files:

1. `scripts/fixtures/golden_sample_v3_2_live_image_browser_run_plan.t1_lifestyle_inflation.v1.json` (new)
   - Must record the exact Owner approval text.
   - Must set:
     - `provider: "ALLOW_CHATGPT_IMAGE"`
     - `topicId: "t1_lifestyle_inflation"`
     - `callCapMax: 12`
     - `costCapUsdMax: 0`
     - `approvedDomain: "image_browser_generation"`
     - `uploadApprovedNow: false`
     - `ttsApprovedNow: false`
     - `renderApprovedNow: false`
     - `muxApprovedNow: false`
     - `envSecretAccessApprovedNow: false`
   - Must reference future execution plan gate, live action approval packet, ChatGPT runner contract, sample plan, prompts fixture, paid image allow policy.
   - Must include stop conditions and artifact audit requirements.
   - Must record approved output directory.

2. `scripts/check-golden-sample-v3-2-live-image-browser-run-plan-static.mjs` (new)
   - Dependency-free static/preflight guard.
   - Import allowlist: `node:fs`, `node:path`, `node:url` only.
   - Validate exact Owner approval, provider, caps, stop conditions, output dir, source refs, and false flags for all non-image domains.
   - Validate that no OpenAI/BFL/Gemini/Veo/TTS/render/mux/upload/env/dependency path is approved.
   - Validate that existing live runner is hardened with `ALLOW_CHATGPT_IMAGE` before side effects and that no new runner clone is introduced.
   - Validate that standard no-live runner module exists and the live run plan references it as the contract/pure-helper standard.
   - Include fail-closed mutants for wrong provider, cap > 12, cost > 0, upload flag true, missing stop conditions, missing approval text, missing provider guard, wrong output dir.

3. `scripts/run-chatgpt-playwright-fresh-image-set-v3.mjs`
   - Prefer no modification.
   - If the existing runner violates a must-have live approval invariant, make the smallest targeted patch only.
   - Do not create a fourth ChatGPT runner clone.
   - If patched, keep hard cap 12 and `ALLOW_CHATGPT_IMAGE=1` fail-closed guard before side effects.
   - If patched, import or reuse standard pure helper surfaces from `scripts/run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs` where practical without broad refactor.

4. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

5. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Allowed generated/output path:

- `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/`
  - Images, summary JSON, latency report, and diagnostic screenshots/JSON from the approved runner only.
  - Do not stage output files.
  - Do not delete existing output files.
  - Do not rename existing output files unless the runner already does so for an explicitly selected rejected image; do not force regeneration by manual rename without reporting first.

Allowed external side effect:

- ChatGPT browser/CDP execution only through existing hardened scripts:
  - `scripts/run-chatgpt-playwright-fresh-image-set-v3.mjs`
  - `scripts/_chatgpt-image-core.mjs`
- Existing Chrome profile path used by the core module may be used for ChatGPT session state.
- Do not enter credentials. If login is required, captcha appears, quota/rate limit appears, or manual intervention is needed, stop and report.

## Required Execution Order

1. `git status -sb`.
2. Create/validate the live image/browser run plan fixture and static guard.
3. Run static/preflight checks:
   - `node --check scripts/check-golden-sample-v3-2-live-image-browser-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-image-browser-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-action-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
4. `node --check` any changed/new `.mjs`, including the live runner if patched.
5. JSON parse changed/new fixture(s).
6. If and only if all checks pass, run the approved live command with transient provider flag:
   - PowerShell pattern: `$env:ALLOW_CHATGPT_IMAGE='1'; node scripts\run-chatgpt-playwright-fresh-image-set-v3.mjs`
   - Do not set any other provider flag.
   - Do not read `.env.local`.
7. After live run, inspect only the runner summary/latency JSON in the approved output directory.
8. Append `_ai/CLAUDE_REPORT.md` with:
   - exact command,
   - submitted count vs cap 12,
   - saved image count,
   - TIMEOUT_BLOCKED/fail count,
   - output directory,
   - summary/latency report paths,
   - any stop condition hit,
   - confirmation of no upload/render/mux/TTS/API/env/dependency/DB/deploy.

## Required Safety Semantics

- Only `ALLOW_CHATGPT_IMAGE` provider is approved.
- `PAID_API_ENABLED`, `ALLOW_OPENAI_IMAGE`, `ALLOW_BFL_FLUX2`, `ALLOW_IMAGEN`, `ALLOW_GEMINI_VEO`, TTS flags are not approved.
- Call/submission cap is 12. Never exceed it.
- Cost cap is $0. Do not use paid APIs.
- Upload is not approved and upload hard block remains active.
- TTS/audio is not approved.
- Render/mux is not approved.
- Owner QA actual pass is not approved.
- `.env.local` and secrets are not approved.
- Dependencies/lockfiles/DB/deploy/font files are not approved.
- If login/captcha/quota/manual step is required, stop and report; do not work around it.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. JSON parse for every changed/new fixture
4. New live run plan guard:
   - `node scripts/check-golden-sample-v3-2-live-image-browser-run-plan-static.mjs`
5. Regression/preflight:
   - `node scripts/check-golden-sample-v3-2-live-action-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
   - `node scripts/check-golden-sample-v3-2-paid-image-allow-guard-static.mjs`
6. Live command, only after checks pass:
   - `$env:ALLOW_CHATGPT_IMAGE='1'; node scripts\run-chatgpt-playwright-fresh-image-set-v3.mjs`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Any provider except ChatGPT browser path with `ALLOW_CHATGPT_IMAGE`.
- OpenAI Image API, BFL/FLUX2, Imagen, Gemini/Veo, Midjourney, ElevenLabs, TTS APIs.
- Upload or upload queue or `/api/upload` POST.
- Render/mux/Pillow/Python/ffmpeg/ffprobe/video/audio generation.
- Reading `.env.local` or actual secrets.
- Adding dependencies, changing lockfiles, font files, DB/schema/deploy config, or `pnpm-workspace.yaml`.
- Creating a new ChatGPT/Playwright runner clone.
- Modifying protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/` subtrees
  - `C:\tmp`
- Commit/push.

## Definition Of Done

- Live image/browser run plan fixture exists and matches Owner approval exactly.
- Static/preflight guard exists and fails closed for approval drift.
- Required preflight checks pass.
- Approved live ChatGPT browser command is run once, unless a preflight stop condition blocks it.
- Submission count never exceeds 12.
- Cost remains $0 with no paid API.
- Output evidence is in `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/`.
- `_ai/CLAUDE_REPORT.md` records concise evidence and any stop condition.
- No upload/render/mux/TTS/API/env/dependency/DB/deploy occurred.
- No commit/push.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 180 after checkpoint `b170b39`.
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/` subtrees
  - `C:\tmp`

전체프로젝트 진행률 : 약 92%
