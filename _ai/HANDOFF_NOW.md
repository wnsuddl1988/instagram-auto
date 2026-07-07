# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `owner-youtube-letterbox-source-plan-bridge-no-live-v1`
- Latest checkpoint: `7711e59 feat(operator): enrich content unit publish metadata`
- Owner request: continue remaining work so the project can actually be used to generate and publish videos.
- Purpose: connect the existing YouTube Shorts letterbox variant planner to the Owner daily workflow so a future content unit can get a deterministic YouTube letterbox source path/plan without manual guessing. This slice is no-live/no-execute for ffmpeg and external services.

## Why This Is Next

- The Owner can now:
  - run local dry-run;
  - build a `dual_platform_content_unit_v1` manifest;
  - get `metadataReady:true` when local metadata is sufficient.
- Remaining readiness blockers for a future/new content unit are:
  - `youtubeSourceReady:false` until the YouTube letterbox mp4 exists;
  - `blobLivenessEvidenceReady:false` until Blob upload/liveness evidence exists.
- The next safest step is to wire a deterministic YouTube letterbox planning bridge:
  - read a content unit manifest;
  - use `instagramSourcePath` as the input;
  - plan a deterministic `youtubeSourcePath` under an Owner-provided repo-outside output directory;
  - reuse or align with `scripts/create-youtube-shorts-letterbox-variant.mjs` dry-run profile;
  - write a plan/summary JSON only, with no ffmpeg execution and no media generation.

## Approved Scope

Claude Code may implement a no-live YouTube letterbox source planning bridge.

Allowed edits:
- `scripts/run-owner-daily-automation-entrypoint.mjs`
- `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- `docs/owner-daily-automation-runbook.md`
- New script if useful:
  - `scripts/plan-youtube-letterbox-source-from-content-unit.mjs`
- New static guard if useful:
  - `scripts/check-youtube-letterbox-source-plan-bridge-static.mjs`
- New fixture if useful:
  - `scripts/fixtures/youtube_letterbox_source_plan_from_content_unit.sample.v1.json`
- Append concise evidence to `_ai/CLAUDE_REPORT.md`

Prefer a small new planner script over modifying the actual renderer. Do not run ffmpeg or make the renderer executable in this slice.

## Required Behavior

1. Add a planner that accepts:
   - `--content-unit <dual_platform_content_unit_v1 manifest>`
   - `--out-dir <outside-repo path>`
   - optional `--version-suffix <suffix>` or similar only if needed for deterministic output naming.

2. Planner output:
   - no media file created;
   - no ffmpeg run;
   - no API/network/env access;
   - writes a plan JSON under out-dir, for example:
     - `youtube-letterbox-source-plan.json`
   - includes:
     - `instagramSourcePath`
     - `plannedYoutubeSourcePath`
     - `inputExists` boolean only
     - `outputDirOutsideRepo` boolean
     - `renderProfile` summary: 1080x1920 canvas, black background, centered content, current scale/pad profile
     - `recommendedNextCommand` using existing planner/renderer in dry-run or future-approved run form
     - `willExecuteFfmpeg:false`
     - side-effect counters all 0

3. Owner entrypoint:
   - Add a mode such as `--plan-youtube-letterbox`.
   - It should call the planner with `spawnSync(process.execPath, [...], { shell:false })` or import a pure function if simpler.
   - It must not invoke ffmpeg or `--run`.
   - It should print the planned YouTube source path and the next safe command.
   - It should not mutate the content unit manifest in this slice.

4. Runbook:
   - Update the practical daily sequence:
     1. `--dry-run`
     2. `--build-content-unit`
     3. `--plan-youtube-letterbox`
     4. future Owner-approved local media generation uses that plan
     5. rebuild/attach content unit with `--youtube-source <planned mp4>`
     6. Blob upload/liveness
     7. preflight/publish gates

5. Guard behavior:
   - prove no `process.env` / `.env` / secret access;
   - prove no fetch/axios/googleapis/@vercel/blob;
   - prove no ffmpeg/ffprobe execution and no `--run` invocation;
   - prove output dir must be outside repo;
   - prove planner writes only plan JSON under out-dir;
   - prove owner entrypoint mode exists and is no-live;
   - prove generated plan uses the content unit `instagramSourcePath` and deterministic YouTube letterbox output path.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not call Instagram API, YouTube API/OAuth/upload, Vercel Blob upload/list/delete/copy/head, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service.
- Do not run ffmpeg/ffprobe.
- Do not create new media or run render/mux/TTS/image/browser.
- Do not modify the actual renderer to make `--run` executable unless explicitly required for no-live planning; if touched, keep `--run` fail-closed.
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
2. Syntax for changed/new JS/MJS files.
3. JSON parse for changed/new fixtures.
4. New guard if added:
   - `node scripts/check-youtube-letterbox-source-plan-bridge-static.mjs`
5. Targeted regressions:
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
   - `node scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
   - `node scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg or create media.

## Definition Of Done

- Owner has a command to plan the YouTube letterbox source path from a content unit manifest.
- The plan is deterministic and no-live.
- The runbook tells the Owner where this fits in the actual daily flow.
- Guards prove no env/secret/API/upload/deploy/media-generation side effects.
- No commit/push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- planner command(s)
- generated plan contract summary
- sample/owner entrypoint smoke result
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
