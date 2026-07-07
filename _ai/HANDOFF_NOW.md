# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `owner-entrypoint-golden-ready-shortcuts-no-live-v1`
- Owner approval basis: no-live operator usability continuation after checkpoint `4bd2c57 feat(media): add golden sample content unit readiness`
- Purpose: make the owner-usable CLI flow expose the ready golden sample content unit without requiring the Owner to remember the long fixture path. Add no-live package/entrypoint/runbook/guard support for checking the ready content unit and confirming duplicate-safe block.

## Approved Scope

Approved:

- Add package scripts only (no dependency/lockfile changes) for the ready golden sample fixture.
- Update owner entrypoint status/help to mention the ready fixture and shortest commands.
- Update owner entrypoint guard to verify the ready-fixture commands.
- Update owner runbook with a short "existing golden sample readiness" section.
- Append concise evidence to `_ai/CLAUDE_REPORT.md`.

Not approved:

- Instagram publish/arm beyond existing duplicate-guard safe-block check.
- YouTube API/OAuth/upload.
- Blob upload/delete/overwrite/copy/mutation or public HEAD.
- Env/secret read/write/print, including `.env`, `.env.*`, `.env.local`.
- Deploy, dependency/lockfile changes, DB/Supabase, browser automation.
- New media generation, ffmpeg, ffprobe, TTS/image/render/mux.
- Commit/push.

## Existing Ready Fixture

Use the committed ready fixture:

- `scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json`

It already points to:

- Instagram source:
  - `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- YouTube source:
  - `C:\tmp\money-shorts-os\youtube-letterbox-local-render-execution-once-v1\golden_sample_t1_lifestyle_inflation_youtube_letterbox_v3_2_once.mp4`
- Blob liveness evidence:
  - public URL HEAD 200 / `video/mp4` / `20294549`

The fixture preflight is already known to pass:

- `preflightOk:true`
- `sourceFilesReady:true`
- metadata gate ok
- Blob evidence ok
- duplicate guard uses `v3_2`
- side effects 0

## Required Implementation

### 1. package.json scripts

Add scripts only:

- `owner:ready-preflight`
  - runs owner entrypoint `--preflight --content-unit scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json`
- `owner:ready-duplicate-guard-check`
  - runs owner entrypoint `--duplicate-guard-check --content-unit scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json`

Do not change dependencies/devDependencies or `pnpm-lock.yaml`.

### 2. Owner entrypoint

Update `scripts/run-owner-daily-automation-entrypoint.mjs`:

- Add a constant for the ready fixture path if useful.
- `--status` output should include:
  - ready fixture path
  - command for ready preflight
  - command for ready duplicate guard check
  - clear note that this content is already published and duplicate-safe; these commands do not repost.
- Help/usage text may mention the two package scripts or the ready fixture path.
- Do not change live behavior.
- Do not add env/secret access.

### 3. Owner entrypoint guard

Update `scripts/check-owner-daily-automation-entrypoint-static.mjs`:

- Assert package scripts exist and use the exact ready fixture path.
- Assert status output includes the ready fixture/commands.
- Smoke:
  - `node scripts/run-owner-daily-automation-entrypoint.mjs --preflight --content-unit scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json`
    - should exit 0
    - should indicate `preflightOk:true`
    - should not contain secret value shapes
  - `node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check --content-unit scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json`
    - should exit 0
    - should be the expected safe duplicate block
    - should not treat block as publish success
    - should not contain secret value shapes
- Keep existing checks intact.

### 4. Runbook

Update `docs/owner-daily-automation-runbook.md`:

- Add a compact section near the top:
  - existing golden sample readiness commands:
    - `pnpm owner:ready-preflight`
    - `pnpm owner:ready-duplicate-guard-check`
  - explain they are no-live verification / duplicate-safe block, not repost.
- Do not add secret instructions.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not print, hash, copy, log, stage, or commit token values.
- Do not call public HEAD.
- Do not call Instagram API, YouTube API/OAuth/upload, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or paid/external live services.
- Do not call Blob SDK, upload/delete/overwrite/copy/mutation.
- Do not run ffmpeg or ffprobe.
- Do not create new media, TTS, images, browser renders, or muxed source files.
- Do not delete/overwrite existing media or result JSON.
- Do not add/change dependencies, lockfiles, pnpm config, fonts, deploy config, or DB schema.
- Do not commit or push.
- Do not touch protected/excluded dirty files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `scripts/get-youtube-refresh-token-once.mjs`
  - `shadow-list.txt`

## Required Checks

1. `git status -sb`
2. Syntax check for changed JS/MJS files.
3. `package.json` JSON parse.
4. `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
5. Targeted regressions:
   - `node scripts/check-dual-platform-content-unit-final-readiness-static.mjs`
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg/ffprobe/deploy/API.

## Definition Of Done

All must be true:

1. `pnpm owner:ready-preflight` or equivalent package script exists and verifies the ready fixture without live publish.
2. `pnpm owner:ready-duplicate-guard-check` or equivalent package script exists and verifies safe duplicate block without treating it as publish success.
3. Owner status/runbook clearly show the short commands.
4. No env/secret access, Blob mutation, Instagram publish, YouTube upload, deploy, dependency/lockfile change, media generation, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- added package scripts
- owner status/runbook summary
- ready preflight smoke result
- ready duplicate-guard smoke result
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
