# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `instagram-existing-blob-liveness-and-content-unit-attach-no-arm-v1`
- Owner approval token: `APPROVE_INSTAGRAM_EXISTING_BLOB_LIVENESS_AND_ATTACH_NO_ARM`
- Latest checkpoint: `a96940a feat(operator): add instagram blob upload one-shot runner`
- Purpose: confirm the existing Vercel Blob object public URL for the Instagram/full-frame mp4, verify only public `HEAD` liveness (`video/mp4`, content length `20294549`), write a secret-free liveness result JSON, and attach that evidence into a content unit/preflight path without publishing.

## Approved Scope

Approved:

- Use the existing Blob object pathname:
  - `instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4`
- Derive or confirm the public URL in a read-only way from existing repo evidence/result files.
- Perform public URL `HEAD` request only against the expected existing mp4 URL.
- Validate:
  - HTTP status is 2xx/3xx, preferably 200
  - `content-type` is `video/mp4` or starts with `video/`
  - `content-length` equals `20294549`
  - URL path contains the exact expected pathname
- Write a secret-free liveness result JSON under a gitignored/repo-outside output path.
- Feed that result into existing content-unit builder via `--blob-liveness-result`.
- Verify the generated content unit contains `blobPublicUrlLivenessEvidence`.
- Run content-unit preflight and confirm Blob evidence is accepted while no live publish occurs.

Not approved:

- Instagram publish/arm or Instagram Graph API calls.
- YouTube API/OAuth/upload.
- Blob upload/delete/overwrite/copy/mutation. Avoid Blob SDK token use.
- Env/secret read/write/print, including `.env`, `.env.*`, `.env.local`.
- Deploy, dependency/lockfile changes, DB/Supabase, browser automation.
- New media generation, ffmpeg, ffprobe, TTS/image/render/mux.
- Commit/push.

## Known Inputs And Evidence

Expected object:

- pathname/key: `instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4`
- source size: `20294549`
- sha256_12: `54957450ac10`

Recent one-shot upload result:

- status: `BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED`
- uploadAttemptCount: `1`
- blobUploadCount: `0`
- meaning: the object already exists and `allowOverwrite:false` correctly refused overwrite.

Useful existing code paths:

- `scripts/build-dual-platform-content-unit-from-local-summary.mjs`
  - accepts `--blob-liveness-result <json>`
  - copies shape-valid `{ url, headStatus, contentType, contentLength }` into `blobPublicUrlLivenessEvidence`
  - never performs network validation itself.
- `scripts/run-dual-platform-final-publish-orchestrator.mjs`
  - supports `--preflight --content-unit <manifest>`
  - must remain no-publish for this task.

## Suggested Implementation Shape

Prefer adding a small, no-secret liveness runner plus guard:

- New liveness runner:
  - `scripts/check-instagram-existing-blob-liveness-no-arm.mjs`
- Optional static/result guard:
  - `scripts/check-instagram-existing-blob-liveness-attach-static.mjs`
- Optional docs update:
  - `docs/owner-daily-automation-runbook.md`
- Append concise evidence:
  - `_ai/CLAUDE_REPORT.md`

If no new runner is needed, a temporary gitignored output script is acceptable, but durable runner + guard is preferred because this is part of the owner-usable workflow.

## Required Runner Contract

Example command:

`node scripts/check-instagram-existing-blob-liveness-no-arm.mjs --pathname instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4 --expected-size 20294549 --out-dir <repo 밖>`

Required behavior:

1. No env/secret access and no `.env*` access.
2. No `@vercel/blob` mutation calls (`put`, `del`, `copy`, `empty`, overwrite).
3. Public URL derivation must be deterministic and documented in result JSON.
   - If using an existing known base URL from project evidence, record it as non-secret public evidence.
   - Do not require `BLOB_READ_WRITE_TOKEN`.
4. Perform exactly one public `HEAD` request against the candidate URL.
5. Do not perform `GET`/download/body fetch.
6. Result JSON must include:
   - schemaVersion
   - status
   - url
   - pathname
   - headStatus
   - contentType
   - contentLength
   - expectedContentLength
   - urlPathMatchesExpectedPath
   - livenessOk
   - sideEffectCounters
   - envSecretAccess booleans
7. Fail closed if:
   - URL is missing
   - status is not 2xx/3xx
   - content type is html/text or non-video
   - content length mismatches `20294549`
   - URL path does not contain the expected pathname

## Content Unit Attach / Preflight

After liveness result is produced:

1. Use the existing builder to generate or rebuild a content unit with:
   - `--blob-liveness-result <liveness-result.json>`
   - existing local summary/render result inputs where available
2. Confirm generated manifest has:
   - `blobPublicUrlLivenessEvidence.url`
   - `headStatus`
   - `contentType`
   - `contentLength`
3. Run:
   - `node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight --content-unit <generated manifest>`
4. Confirm:
   - no publish/upload occurs
   - Blob evidence gate is accepted
   - any remaining readiness failures are accurately reported

Do not run `--live` or `--arm`.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not print, hash, copy, log, stage, or commit token values.
- Do not call Instagram API, YouTube API/OAuth/upload, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or paid/external live services.
- Do not call Blob upload/delete/overwrite/copy/mutation.
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
3. JSON parse for changed/new fixtures/result examples, if any.
4. New guard, if added:
   - `node scripts/check-instagram-existing-blob-liveness-attach-static.mjs`
5. Targeted regressions:
   - `node scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
   - `node scripts/check-instagram-blob-upload-from-request-once-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg/ffprobe/deploy/API.

## Definition Of Done

All must be true:

1. Existing Blob public URL is confirmed or fail-closed with a clear blocker.
2. Exactly one public URL `HEAD` check is performed if URL derivation succeeds.
3. Liveness result JSON is secret-free and records URL/status/type/length/path match.
4. Content unit builder accepts the liveness result via `--blob-liveness-result`.
5. Orchestrator `--preflight --content-unit <manifest>` runs without publish/upload.
6. No env/secret access, Blob mutation, Instagram publish, YouTube upload, deploy, dependency change, media generation, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- public URL
- HEAD result: status/content-type/content-length
- liveness result JSON path
- content unit manifest path used/generated
- preflight result summary
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
