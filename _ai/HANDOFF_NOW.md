# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `instagram-blob-upload-from-request-executor-no-execute-v1`
- Latest checkpoint: `94f413b feat(operator): plan instagram blob uploads from content units`
- Purpose: add a reusable no-execute executor/preflight layer that consumes `instagram-blob-upload-request.json` and proves the exact Vercel Blob `put()` contract without performing any Blob upload, env/secret read, liveness check, Instagram publish, or external call.

## Why This Is Next

- The Owner workflow can now build:
  - local content unit manifest;
  - YouTube letterbox render result attachment;
  - Instagram Blob upload request JSON with deterministic pathname and put option plan.
- The next real blocker is turning that request into an approved, one-shot Blob upload step.
- Before allowing the actual external mutation, the project needs a reusable guarded executor entrypoint that:
  - validates the request JSON fail-closed;
  - confirms the mp4 source still matches size + SHA-256;
  - checks the request put options match the approved contract;
  - refuses `--run`/live upload in this slice;
  - can later be opened by a separate Owner approval without redesign.

## Approved Scope

Claude Code may implement a no-execute Instagram Blob upload request executor/preflight.

Allowed edits:

- New script:
  - `scripts/prepare-instagram-blob-upload-from-request.mjs`
- New static guard:
  - `scripts/check-instagram-blob-upload-from-request-executor-static.mjs`
- Optional fixture:
  - `scripts/fixtures/instagram_blob_upload_from_request_executor.sample.v1.json`
- Owner entrypoint integration:
  - `scripts/run-owner-daily-automation-entrypoint.mjs`
  - `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- Runbook update:
  - `docs/owner-daily-automation-runbook.md`
- Append concise evidence:
  - `_ai/CLAUDE_REPORT.md`

Avoid changing `lib/instagram-blob-media.ts` unless a focused contract mismatch is discovered and documented. Do not modify `package.json` or `pnpm-lock.yaml`.

## Required Behavior

1. Add a no-execute command, preferably:
   - `node scripts/prepare-instagram-blob-upload-from-request.mjs --request <instagram-blob-upload-request.json> --out-dir <repo 밖> [--dry-run | --run]`

2. Owner entrypoint should expose a matching mode:
   - `node scripts/run-owner-daily-automation-entrypoint.mjs --prepare-instagram-blob-upload --request <instagram-blob-upload-request.json> --out-dir <repo 밖> [--dry-run | --run]`

3. Request validation must fail closed if:
   - JSON parse fails;
   - schema/version field is missing or wrong;
   - `requiresApprovalToken !== "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST"`;
   - `uploadPerformed !== false` or `willUpload !== false`;
   - `platform !== "instagram"`;
   - `variant !== "instagram_reels_full_frame_1080x1920"`;
   - `contentType !== "video/mp4"`;
   - `sourcePath` missing, not `.mp4`, or does not exist;
   - current source size differs from `sourceSizeBytes`;
   - current source SHA-256 or `sha256_12` differs from request;
   - pathname is not exactly:
     `instagram/reels/{contentId}/instagram_reels_full_frame_1080x1920/{version}/{sha256_12}.mp4`;
   - put option plan differs from:
     `access:"public"`, `addRandomSuffix:false`, `allowOverwrite:false`, `multipart:true`, `contentType:"video/mp4"`.

4. Executor output:
   - write a no-execute readiness/result JSON under `--out-dir`, e.g. `instagram-blob-upload-preflight.json`;
   - include `readyForFutureApprovedUpload:true` only when all validation passes;
   - include `runStatus:"INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_THIS_SLICE"`;
   - include `executed:false`, `blobUploadPerformed:false`, `willUpload:false`;
   - include side-effect counters all 0 for Blob put/list/head/delete/copy, env/secret, API, deploy, media generation;
   - include exact future approval token requirement and a future command template.

5. `--run` behavior in this slice:
   - must abort before request validation or output write if possible;
   - exit nonzero;
   - print a clear disabled status;
   - perform no Blob SDK import/call and no env/secret access.

6. Source/request safety:
   - `--out-dir` must be outside repo root;
   - do not write into `.money-shorts-local`;
   - do not mutate the request JSON or source mp4;
   - no `.env*` access;
   - no `process.env` access in new executor.

7. Static guard should prove:
   - no `@vercel/blob` import;
   - no `put/list/head/del/copy` actual calls in executable code;
   - no `fetch`, `axios`, Graph/YouTube/OpenAI/ElevenLabs/Supabase/browser calls;
   - no `process.env`, `.env`, secret-looking literals;
   - `--run` is disabled before side effects;
   - request validation covers token, pathname, source size/hash, put options, side-effect counters;
   - owner entrypoint mode exists and forwards safely;
   - docs mention this as no-execute preparation before actual approved upload.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not call/import `@vercel/blob`.
- Do not perform Blob `put`, `list`, `head`, `del`, `copy`, public URL HEAD/liveness, or any network call.
- Do not call Instagram API, YouTube API/OAuth/upload, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service.
- Do not run ffmpeg or ffprobe.
- Do not create new media, TTS, images, browser renders, or muxed source files.
- Do not delete/overwrite existing media, request JSON, or result JSON.
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
2. Syntax check for changed/new JS/MJS files.
3. JSON parse for changed/new fixtures.
4. New guard:
   - `node scripts/check-instagram-blob-upload-from-request-executor-static.mjs`
5. Targeted regressions:
   - `node scripts/check-instagram-blob-upload-plan-from-content-unit-static.mjs`
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg/ffprobe/upload/API/deploy.

## Definition Of Done

- Owner can take an `instagram-blob-upload-request.json` and produce a no-execute upload readiness JSON.
- The readiness JSON proves source size/hash and deterministic pathname still match the request.
- `--run` remains disabled/fail-closed in this slice.
- No Blob upload/liveness/network/env/API/media generation happens.
- Guards prove fail-closed behavior and side-effect counters all 0.
- No commit/push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- new/updated command(s)
- upload executor/readiness contract summary
- smoke result
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
