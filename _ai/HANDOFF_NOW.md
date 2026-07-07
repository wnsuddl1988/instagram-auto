# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `instagram-blob-upload-plan-from-content-unit-no-upload-v1`
- Latest checkpoint: `92a861b feat(operator): attach youtube render result to content unit`
- Purpose: create a no-upload Instagram Blob upload plan/request from a `dual_platform_content_unit_v1` manifest so the later approved Blob upload step has deterministic input and no manual pathname work.

## Why This Is Next

- The Owner workflow can now:
  - build a content unit manifest from local pipeline summary;
  - attach the generated YouTube letterbox mp4 via `--youtube-render-result`;
  - run preflight with the manifest.
- The next remaining readiness blocker for Instagram publish is `blobPublicUrlLivenessEvidence`.
- Before asking for a live Blob upload/liveness step, the system should produce a deterministic no-upload request:
  - read content unit manifest;
  - validate Instagram full-frame source mp4;
  - compute size + SHA-256;
  - build deterministic Blob pathname using the existing contract;
  - write a small upload request JSON under a repo-outside folder;
  - keep Blob upload/env/network/API at 0.

## Approved Scope

Claude Code may implement a no-upload Instagram Blob upload planner from content unit manifests.

Allowed edits:

- New script if useful:
  - `scripts/plan-instagram-blob-upload-from-content-unit.mjs`
- New static guard if useful:
  - `scripts/check-instagram-blob-upload-plan-from-content-unit-static.mjs`
- Optional owner entrypoint integration:
  - `scripts/run-owner-daily-automation-entrypoint.mjs`
  - `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- Optional docs update:
  - `docs/owner-daily-automation-runbook.md`
- Optional fixture:
  - `scripts/fixtures/instagram_blob_upload_plan_from_content_unit.sample.v1.json`
- Append concise evidence to `_ai/CLAUDE_REPORT.md`

Avoid changing `lib/instagram-blob-media.ts` unless a focused bug is discovered. Prefer using or mirroring its existing no-upload contract.

## Required Behavior

1. Add a no-upload planner command, preferably:
   - `node scripts/plan-instagram-blob-upload-from-content-unit.mjs --content-unit <dual_platform_content_unit_v1 manifest> --out-dir <repo 밖>`

2. Owner entrypoint should expose a matching mode if edited:
   - `node scripts/run-owner-daily-automation-entrypoint.mjs --plan-instagram-blob-upload --content-unit <manifest.json> --out-dir <repo 밖>`

3. Planner input validation:
   - content unit JSON parses;
   - `schemaVersion === "dual_platform_content_unit_v1"`;
   - `contentId` and `version` are non-empty strings;
   - `instagramSourcePath` is a non-empty `.mp4` path;
   - `instagramSourcePath` exists;
   - source file size > 0 and <= `35 * 1024 * 1024`;
   - variant fixed to `instagram_reels_full_frame_1080x1920`;
   - platform fixed to `instagram`;
   - content type fixed to `video/mp4`.

4. Planner behavior:
   - read Instagram source mp4 read-only to compute SHA-256;
   - build deterministic pathname:
     `instagram/reels/{contentId}/instagram_reels_full_frame_1080x1920/{version}/{sha256_12}.mp4`
   - build put option plan:
     `access:"public"`, `addRandomSuffix:false`, `allowOverwrite:false`, `multipart:true`, `contentType:"video/mp4"`;
   - write request JSON under `--out-dir`, e.g. `instagram-blob-upload-request.json`;
   - include `uploadPerformed:false`, `willUpload:false`, `requiresApprovalToken:"APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST"`;
   - include side-effect counters all 0 for Blob upload/list/head/delete/copy, env/secret, API, deploy, media generation.

5. Output path safety:
   - `--out-dir` must be outside repo root;
   - do not write into `.money-shorts-local`;
   - do not mutate the content unit manifest.

6. Smoke behavior:
   - Use an existing sample manifest or a temp manifest outside repo.
   - It is okay to read the existing local mp4 path if the sample points to it.
   - Do not call Vercel Blob SDK, `@vercel/blob`, `put`, `list`, `head`, `del`, `fetch`, or any network/API.

7. Runbook:
   - Insert this as the step after content unit has Instagram source + YouTube render result, and before actual Blob upload/liveness.
   - Make clear this command only prepares the request; actual upload still needs `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST`.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not call Instagram API, YouTube API/OAuth/upload, Vercel Blob upload/list/delete/copy/head, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service.
- Do not import or call `@vercel/blob`.
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
3. JSON parse for changed/new fixtures.
4. New guard if added:
   - `node scripts/check-instagram-blob-upload-plan-from-content-unit-static.mjs`
5. Targeted regressions:
   - `node scripts/check-vercel-blob-dependency-code-integration-static.mjs`
   - `node scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs` if owner entrypoint is changed
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg/ffprobe/upload/API/deploy.

## Definition Of Done

- Owner can generate an Instagram Blob upload request from a content unit manifest.
- Request JSON contains deterministic pathname, size, sha256/sha256_12, put option plan, and future approval token requirement.
- No Blob upload/liveness/network/env/API/media generation happens.
- Guards prove fail-closed behavior and side-effect counters all 0.
- No commit/push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- new/updated command(s)
- upload-plan request contract summary
- smoke result
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
