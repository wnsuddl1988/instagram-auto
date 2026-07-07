# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `youtube-letterbox-render-execution-wiring-no-execute-v1`
- Latest checkpoint: `e502eaf feat(operator): plan youtube letterbox source paths`
- Owner request: continue remaining work so the project can actually be used to generate and publish videos.
- Purpose: connect the YouTube letterbox source plan to a future render execution path, but keep actual ffmpeg/media generation disabled in this slice.

## Why This Is Next

- The Owner can now:
  - run local dry-run;
  - build a content unit manifest;
  - enrich metadata enough for metadata gate;
  - plan the deterministic YouTube letterbox output path.
- The next readiness blocker is turning `youtube-letterbox-source-plan.json` into a verified render request.
- Actual mp4 creation must still be a separate approval because it runs ffmpeg and writes a media file.
- This slice should make the future media-generation step predictable:
  - read a plan JSON;
  - validate input/output paths and render profile;
  - produce the exact command/request that will be executed later;
  - keep `--run` fail-closed/no-execute for now.

## Approved Scope

Claude Code may implement no-execute render wiring from a YouTube letterbox plan.

Allowed edits:
- `scripts/run-owner-daily-automation-entrypoint.mjs`
- `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- `docs/owner-daily-automation-runbook.md`
- New script if useful:
  - `scripts/prepare-youtube-letterbox-render-from-plan.mjs`
- New static guard if useful:
  - `scripts/check-youtube-letterbox-render-execution-wiring-static.mjs`
- New fixture if useful:
  - `scripts/fixtures/youtube_letterbox_render_request_from_plan.sample.v1.json`
- Append concise evidence to `_ai/CLAUDE_REPORT.md`

Avoid changing `scripts/create-youtube-shorts-letterbox-variant.mjs` unless absolutely necessary. If touched, `--run` must remain fail-closed.

## Required Behavior

1. Add a render-request preparer that accepts:
   - `--plan <youtube-letterbox-source-plan.json>`
   - `--out-dir <outside-repo path>` for request/summary JSON
   - optional `--dry-run` default
   - optional `--run` must fail closed in this slice with a clear status such as `YOUTUBE_LETTERBOX_RENDER_RUN_DISABLED_THIS_SLICE`.

2. The preparer should:
   - read only the plan JSON;
   - validate `schemaVersion === "youtube_letterbox_source_plan_v1"`;
   - validate `willExecuteFfmpeg === false` in the source plan;
   - validate `plannedYoutubeSourcePath` is outside the repo and ends with `.mp4`;
   - report `inputExists` as a boolean based on the plan and/or `fs.existsSync` only;
   - build an exact future command using `scripts/create-youtube-shorts-letterbox-variant.mjs --input <instagramSourcePath> --output <plannedYoutubeSourcePath> --dry-run`;
   - write request JSON under out-dir only;
   - not write the mp4;
   - not run ffmpeg/ffprobe;
   - keep side-effect counters all 0.

3. Owner entrypoint:
   - Add a mode such as `--prepare-youtube-letterbox-render`.
   - It should accept `--plan <path>` and `--out-dir <path>`.
   - It should refuse `--run` in this slice.
   - It should print the request path and the future approved command.
   - It should not mutate the plan or content unit manifest.

4. Runbook:
   - Update the daily flow:
     - after `--plan-youtube-letterbox`, run `--prepare-youtube-letterbox-render --plan <plan> --out-dir <repo 밖>`;
     - actual media generation remains a later approval;
     - after the mp4 exists, rebuild the content unit with `--youtube-source <plannedYoutubeSourcePath>`.

5. Guard behavior:
   - prove no `process.env` / `.env` / secret access;
   - prove no fetch/axios/googleapis/@vercel/blob;
   - prove no ffmpeg/ffprobe execution and no child_process in the new preparer if possible;
   - prove `--run` fails closed;
   - prove output dir must be outside repo;
   - prove only request JSON is written under out-dir;
   - prove owner entrypoint mode exists and is no-live;
   - prove source plan file is not mutated.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not call Instagram API, YouTube API/OAuth/upload, Vercel Blob upload/list/delete/copy/head, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service.
- Do not run ffmpeg/ffprobe.
- Do not create new media or run render/mux/TTS/image/browser.
- Do not modify the existing renderer to enable `--run`.
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
   - `node scripts/check-youtube-letterbox-render-execution-wiring-static.mjs`
5. Targeted regressions:
   - `node scripts/check-youtube-letterbox-source-plan-bridge-static.mjs`
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
   - `node scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg or create media.

## Definition Of Done

- Owner has a command to prepare a YouTube letterbox render request from the plan JSON.
- The request is deterministic and no-execute.
- `--run` is explicitly disabled/fail-closed in this slice.
- The runbook tells the Owner where this fits in the actual daily flow.
- Guards prove no env/secret/API/upload/deploy/media-generation side effects.
- No commit/push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- render request command(s)
- generated request contract summary
- sample/owner entrypoint smoke result
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
