# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `AGENTS.md` + 이 파일.
- Codex = BRAIN AI, Claude Code = ACTION AI.
- Claude Code는 이 파일의 승인 범위 안에서만 실행하고, 완료 후 Codex 인수인계 형식으로 멈춘다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-live-instagram-upload-with-buildgongjakso-public-url-v1`
- Status: **Owner approved Instagram upload and clarified Codex/Claude must derive a valid public mp4 URL under `buildgongjakso.com` instead of asking Owner again.**
- Exact Owner approvals:
  - `APPROVE_UPLOAD: t1_lifestyle_inflation — upload target=C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4, upload cap=1, platforms=Instagram, no regeneration, no render/mux/TTS/image/browser, allow upload endpoint/credentials only for Instagram, stop on upload hard-block mismatch/credential missing/platform error/cap exceeded/unexpected response/final pre-upload audit fail`
  - `APPROVE_UPLOAD_PUBLIC_URL: t1_lifestyle_inflation — public video_url=<https://www.buildgongjakso.com/>, use this URL only for Instagram upload cap=1 under the previous APPROVE_UPLOAD scope, no hosting/upload generation, no regeneration, no render/mux/TTS/image/browser`
  - Owner clarification after Codex found `/` is HTML, not mp4: `그 도메인에 게시가능한걸 너가 자등으로 url 설정하는게 네 임무야 자꾸 물어보지말고`
- Approved interpretation:
  - Do **not** ask Owner for another public URL.
  - Use `https://www.buildgongjakso.com/` as the approved domain/root, but derive a direct HTTPS mp4 URL under that domain that passes final pre-upload audit.
  - If the current repo/domain can expose static files through `public/`, prefer a deterministic static path:
    - repo file candidate: `public/golden-sample/v3-2/t1_lifestyle_inflation/golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
    - public URL candidate: `https://www.buildgongjakso.com/golden-sample/v3-2/t1_lifestyle_inflation/golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
  - The mp4 may be copied from the approved local mux output into the approved repo static-public path **only if** doing so is the minimal way to materialize the approved public URL for Instagram. This is not image/TTS/render/mux regeneration.
  - No deploy/push is approved. If the public URL is not live after local file placement, record `BLOCKED_PUBLIC_URL_NOT_DEPLOYED` and stop before Instagram upload.

## Current State

- Branch: `codex/source-first-blueprint-clean`, latest checkpoint `056ee51 feat(golden-sample): prepare upload approval packet`, ahead 185, not pushed.
- Existing 9 images accepted and checkpointed: `ff1847f`.
- Existing ElevenLabs narration/alignment/timing accepted/reused and checkpointed: `c02ed21`.
- Local render/mux candidate created and checkpointed: `adbcb4b`.
- Owner actual QA pass + upload approval packet checkpointed: `056ee51`.
- Approved local upload target:
  - `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- Owner direct QA actual pass exists:
  - `scripts/fixtures/golden_sample_v3_2_owner_qa_actual_pass.t1_lifestyle_inflation.v1.json`
- Upload approval packet exists:
  - `scripts/fixtures/golden_sample_v3_2_upload_approval_packet.t1_lifestyle_inflation.v1.json`

## Purpose

Prepare and, only if every gate passes, execute **one Instagram upload** for `t1_lifestyle_inflation` using the approved mux mp4 and a valid direct mp4 URL under `buildgongjakso.com`.

This slice must:

1. Create a machine-readable live upload run plan capturing the exact Owner approvals and Codex clarification.
2. Materialize or derive a direct public mp4 URL under `https://www.buildgongjakso.com/` without asking Owner again.
3. Run final pre-upload audit before any Instagram API action.
4. Use Instagram-only credential/env access if and only if all non-secret gates pass.
5. Execute at most one Instagram upload attempt if public URL + credentials + final audit pass.
6. If any gate fails, stop without upload and record a blocked result.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_upload_approval_packet.t1_lifestyle_inflation.v1.json`
2. `scripts/fixtures/golden_sample_v3_2_owner_qa_actual_pass.t1_lifestyle_inflation.v1.json`
3. `scripts/fixtures/golden_sample_v3_2_live_render_mux_run_plan.t1_lifestyle_inflation.v1.json`
4. `scripts/check-golden-sample-v3-2-upload-approval-packet-static.mjs`
5. `scripts/check-golden-sample-upload-hard-block-static.mjs`
6. `lib/instagram.ts`
7. `app/api/upload/route.ts`
8. `lib/upload-hard-block.ts`
9. Existing upload scripts only as reference, especially:
   - `scripts/run-premium-editorial-live-upload-first-run-v1.mjs`

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

1. `scripts/fixtures/golden_sample_v3_2_live_instagram_upload_run_plan.t1_lifestyle_inflation.v1.json` (new)
   - Must record exact Owner approvals.
   - Must set platform exactly `Instagram`.
   - Must set upload cap exactly 1.
   - Must set no regeneration/no render/mux/TTS/image/browser.
   - Must record public URL derivation policy under `buildgongjakso.com`.
   - Must record final pre-upload audit requirements.

2. `scripts/run-golden-sample-v3-2-instagram-upload-once.mjs` (new, preferred) or a minimal patch to an existing upload runner only if safer
   - Instagram-only.
   - Cap exactly 1.
   - Must not import/use YouTube clients or read YouTube credentials.
   - Must not call render/mux/TTS/image/browser.
   - Must not read `.env.local` broadly. If env loading is necessary, parse only allowlisted Instagram keys.
   - Allowed credential/env keys only:
     - `INSTAGRAM_ACCESS_TOKEN`
     - `INSTAGRAM_BUSINESS_ACCOUNT_ID` or `INSTAGRAM_USER_ID` only if existing `lib/instagram.ts` requires it; use the exact existing project naming after inspection.
   - Must never log secret values.
   - Must validate public URL via HEAD/fetch metadata before upload:
     - HTTPS URL under `www.buildgongjakso.com` or `buildgongjakso.com`
     - HTTP 2xx
     - `Content-Type` starts with `video/` or is otherwise platform-acceptable for mp4
     - not `text/html`
     - accessible without auth
   - Must stop with a clear blocked result before Instagram API if URL is not a direct mp4.
   - Must write a result/audit JSON under a controlled path without secrets.

3. `scripts/check-golden-sample-v3-2-live-instagram-upload-run-static.mjs` (new)
   - Dependency-free static guard.
   - Import allowlist: `node:fs`, `node:path`, `node:url`, and other `node:` builtins only if justified.
   - Validate run plan, runner source, public URL policy, cap=1, Instagram-only credential allowlist, no YouTube/env broad read, no regeneration/render/mux/TTS/image/browser, no secret logging, no upload if pre-upload audit fails.
   - Include fail-closed mutants for:
     - platform drift to YouTube/both,
     - cap > 1,
     - public URL not under buildgongjakso.com,
     - URL content-type HTML accepted,
     - broad `.env.local` parsing,
     - YouTube credential read,
     - secret logging,
     - render/mux/TTS/image/browser invocation,
     - upload attempt before final pre-upload audit,
     - public URL gate disabled,
     - upload hard-block mismatch ignored.

4. Optional static asset path under `public/golden-sample/v3-2/t1_lifestyle_inflation/`
   - Only the approved mux mp4 may be copied here if required to materialize the direct public URL.
   - Do not modify or regenerate the mp4.
   - Do not stage generated output from `C:\tmp`.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence, including whether upload executed or blocked and why.

6. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Avoid modifying:

- Existing upload route/hard-block policy unless absolutely required and explicitly justified.
- DB/Supabase generation status code.
- YouTube upload code.
- Existing render/mux/TTS/image/browser runners.

## Required Execution Order

1. `git status -sb`.
2. Inspect existing Instagram upload client/env names and the existing upload route hard block.
3. Create upload run plan fixture.
4. Create Instagram-only runner and static guard.
5. If materializing the public URL requires static placement, copy the approved local mux mp4 to the deterministic `public/golden-sample/...` path. Do not alter media content.
6. Run static/syntax checks before any env/credential/network/upload action.
7. Final pre-upload audit:
   - local target exists and matches approved path,
   - public URL candidate is direct mp4 and not HTML,
   - Owner QA actual pass fixture present,
   - upload cap ledger 0/1 before attempt,
   - no regeneration/render/mux/TTS/image/browser.
8. Only after all gates pass, read Instagram credentials allowlist-only and attempt one Instagram upload.
9. Record result JSON with no secrets.
10. Append `_ai/CLAUDE_REPORT.md`.
11. Stop. No commit/push.

## Required Checks

Minimum before any live upload attempt:

1. `git status -sb`
2. `node --check scripts/check-golden-sample-v3-2-live-instagram-upload-run-static.mjs`
3. `node --check scripts/run-golden-sample-v3-2-instagram-upload-once.mjs`
4. JSON parse for every changed/new fixture
5. `node scripts/check-golden-sample-v3-2-live-instagram-upload-run-static.mjs`
6. Regression:
   - `node scripts/check-golden-sample-v3-2-upload-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-upload-hard-block-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-render-mux-run-plan-static.mjs`

Do not run full build unless syntax/import issues require it.

## Forbidden

- Asking Owner for another public URL for this domain; derive and test it.
- Upload to any platform except Instagram.
- More than one upload attempt.
- Any YouTube credential read/client/import.
- Broad `.env.local` secret loading.
- Secret logging or writing tokens/account IDs to reports unless masked and non-sensitive.
- Image generation/regeneration, TTS generation/regeneration, render/mux rerun, browser/CDP.
- DB status update, Supabase upload/hosting, deploy, Vercel deploy, git push.
- Dependency/lockfile/font changes.
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

## Stop Conditions

Stop before Instagram API if any of these occur:

- public URL is not a direct mp4/video response,
- public URL still serves `text/html`,
- static placement was made but URL is not deployed/live,
- Instagram credential missing,
- upload hard-block/readiness mismatch cannot be reconciled safely,
- final pre-upload audit fail,
- cap would exceed 1,
- unexpected route/client behavior,
- any need for deploy/hosting/Supabase/upload generation not already approved.

If stopped, record a blocked result and do not attempt upload.

## Definition Of Done

- Run plan fixture exists and captures exact upload approval + public URL derivation.
- Static guard exists and passes.
- Instagram-only runner exists or existing runner is safely narrowed.
- Direct mp4 URL under `buildgongjakso.com` is tested.
- If URL and credentials pass, at most one Instagram upload attempt is executed and result recorded.
- If URL/credentials/gates fail, no upload occurs and blocked result is recorded.
- `_ai/CLAUDE_REPORT.md` records concise evidence.
- No unapproved regeneration/render/mux/TTS/image/browser/YouTube/DB/deploy/dependency/push occurred.
- No commit/push.

전체프로젝트 진행률 : 약 92%
