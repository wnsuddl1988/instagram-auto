# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `instagram-blob-upload-from-request-once-v1`
- Owner approval token: `APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE`
- Latest checkpoint: `9970983 chore(operator): commonize repo root output guard`
- Purpose: use an existing `instagram-blob-upload-request.json` to perform at most one Vercel Blob public upload attempt for the Instagram/full-frame mp4, producing a public `video_url` candidate for later Instagram publish. The upload must run only after no-execute preflight passes, must not overwrite, must not retry, and must not expose secrets.

## Approval Scope

Approved:

- Build the smallest safe one-shot upload runner needed to consume a validated `instagram_blob_upload_request_v1` JSON.
- Use `@vercel/blob` only for the one approved upload attempt.
- Use `BLOB_READ_WRITE_TOKEN` only through runtime/platform env or a no-log Owner-run wrapper path; never read `.env.local`.
- Perform at most one `put()` attempt for the request pathname.
- Write a secret-free result JSON under an approved gitignored output folder.

Not approved:

- Instagram publish/arm.
- YouTube API/OAuth/upload.
- Blob list/head/delete/copy/liveness/public HEAD.
- Deploy, dependency/lockfile changes, new media generation, DB/Supabase, browser automation.
- `.env`, `.env.*`, `.env.local`, secret file read/write/print.
- Commit/push.

## Request Selection

Preferred request input:

1. If a repo-outside request path is already available from recent planner output, use it.
2. Otherwise use the checked-in sample request:
   - `scripts/fixtures/instagram_blob_upload_plan_from_content_unit.sample.v1.json`

Before upload, the runner must call or reuse `prepareInstagramBlobUploadFromRequest()` so source size/SHA-256/pathname/put options are reverified.

If the chosen request targets an object that already exists, `allowOverwrite:false` must refuse it. Treat that as a safe blocked outcome:

- status like `BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED`
- upload attempt count = 1
- no retry
- no overwrite
- no delete

## Allowed Edits

- New one-shot runner:
  - `scripts/run-instagram-blob-upload-from-request-once.mjs`
- New static/result guard if useful:
  - `scripts/check-instagram-blob-upload-from-request-once-static.mjs`
- Optional owner entrypoint mode:
  - `scripts/run-owner-daily-automation-entrypoint.mjs`
  - `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- Optional docs update:
  - `docs/owner-daily-automation-runbook.md`
- Append concise evidence:
  - `_ai/CLAUDE_REPORT.md`

Avoid changing existing no-execute planner/executor scripts unless a focused bug blocks the one-shot runner.

## Required Runner Contract

The runner should be explicit and approval gated, for example:

`node scripts/run-instagram-blob-upload-from-request-once.mjs --approval APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE --request <instagram-blob-upload-request.json> --out-dir <repo 밖>`

Required gates, in order:

1. Approval token argument matches `APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE`.
2. `--out-dir` is outside repo root and not `.money-shorts-local`.
3. Request preflight passes via `prepareInstagramBlobUploadFromRequest()`.
4. Runtime credential availability:
   - do not read `.env.local`;
   - do not print/copy/hash token value;
   - boolean presence check for `BLOB_READ_WRITE_TOKEN` is allowed only if needed;
   - if token is absent, stop with `BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD` and optionally create a no-log Owner-run wrapper under gitignored `output/`.
5. Upload is attempted at most once:
   - `put(pathname, body, { access:"public", addRandomSuffix:false, allowOverwrite:false, multipart:true, contentType:"video/mp4" })`
   - no retry
   - no overwrite
   - no list/head/delete/copy/liveness
6. Result JSON must be secret-free and include:
   - status
   - uploaded URL if success
   - pathname/key
   - source path
   - size
   - sha256/sha256_12
   - uploadAttemptCount
   - blobUploadCount
   - side-effect counters
   - env/secret handling booleans

## No-Log Token Fallback

If Claude's runtime does not have `BLOB_READ_WRITE_TOKEN` available and the SDK cannot upload:

- Do not read `.env.local`.
- Do not ask Owner to paste token into chat.
- Create a gitignored PowerShell wrapper under `output/instagram-blob-upload-from-request-once-v1/` if useful:
  - `Read-Host -AsSecureString`
  - set `$env:BLOB_READ_WRITE_TOKEN` only for child Node process
  - clear env in `finally`
  - do not echo token
- Report the exact single Owner-run command.
- Stop without upload unless the wrapper was actually run by the Owner and result JSON exists.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not print, hash, copy, log, stage, or commit token values.
- Do not call Blob list/head/delete/copy/liveness/public HEAD.
- Do not call Instagram API, YouTube API/OAuth/upload, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service other than the single approved Blob `put()` attempt.
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
2. Syntax check for changed/new JS/MJS files.
3. JSON parse for changed/new fixtures, if any.
4. New guard, if added:
   - `node scripts/check-instagram-blob-upload-from-request-once-static.mjs`
5. Targeted regressions:
   - `node scripts/check-instagram-blob-upload-from-request-executor-static.mjs`
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs` if owner entrypoint is changed
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg/ffprobe/deploy/API.

## Definition Of Done

One of these must be true:

1. `UPLOADED`:
   - exactly one Blob `put()` attempt succeeds;
   - result JSON contains URL/path/size/sha256;
   - no other external calls occur.
2. `BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED`:
   - exactly one Blob `put()` attempt is refused by `allowOverwrite:false`;
   - no retry/overwrite/delete occurs.
3. `BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD`:
   - no upload attempt occurs;
   - no secret is exposed;
   - shortest no-log Owner-run fallback is provided.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- request path used
- upload result status
- uploaded URL if success
- pathname/key
- source path and size
- sha256/sha256_12
- upload attempt count and Blob mutation count
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
