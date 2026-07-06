# HANDOFF_NOW

전체프로젝트 진행률 : 약 92%

## Current Task

- Task ID: `vercel-blob-dependency-code-integration-no-upload-v1`
- Latest accepted checkpoint: `c8e8f8f chore(media): record vercel blob store provisioning`
- Owner approval: `APPROVE_VERCEL_BLOB_DEPENDENCY_AND_CODE_INTEGRATION_NO_UPLOAD`
- Purpose: install `@vercel/blob` and add fail-closed Instagram Blob uploader code integration, without reading env/secrets or uploading any object.

## Active Architecture

- Instagram public `video_url` provider: Vercel Blob public direct URL.
- YouTube upload mode: YouTube Data API direct file upload, no Blob/public URL.
- Provisioned Blob store:
  - name: `instagram-auto-instagram-media`
  - id: `store_NyZYiaz51y6acaCQ`
  - access: `public`
  - region: `iad1`
  - connectedProjects: none/standalone
- This task adds dependency and code only. It does not connect the store to a project, write env, upload an object, check a live URL, or publish.

## Official Vercel Blob SDK Facts Confirmed By Codex

Use these as current official-doc evidence. Do not do additional live/network lookups unless a command fails in a way that requires checking changed official behavior.

- Official SDK docs: `https://vercel.com/docs/vercel-blob/using-blob-sdk`
- Official server upload docs: `https://vercel.com/docs/vercel-blob/server-upload`
- Install command in docs: `pnpm i @vercel/blob`
- SDK `put(pathname, body, options)` uploads a blob object.
- Required `put` option: `access: 'private' | 'public'`.
- Relevant optional `put` options:
  - `addRandomSuffix`, default false.
  - `allowOverwrite`, default false.
  - `contentType`.
  - `multipart` for large files.
  - `token`, defaulting to credential resolution if not explicitly passed.
  - `oidcToken` + `storeId` for OIDC.
- SDK credential resolution order:
  1. explicit `token`;
  2. OIDC credentials with `VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID`;
  3. `process.env.BLOB_READ_WRITE_TOKEN`;
  4. throw if none are available.
- Therefore this slice must not call `put`, because calling it can trigger env/credential resolution.

## Approved Scope

Claude Code may:

1. Install the SDK dependency:
   - Use the same pnpm major version that created current `node_modules`, and point it at the base store path:
     - `& 'C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd' add @vercel/blob --store-dir "C:\Users\PC\AppData\Local\pnpm\store"`
   - Reason: current `node_modules/.modules.yaml` is linked with `packageManager: pnpm@11.7.0` and `storeDir: C:\Users\PC\AppData\Local\pnpm\store\v11`; `C:\Program Files\nodejs\pnpm.CMD` is pnpm 10.33.2 and repeatedly tried to use a v10 store. Passing the base store path to pnpm 11.7.0 should resolve to the existing `...\store\v11` store.
   - `package.json` and `pnpm-lock.yaml` changes are approved for this exact dependency only.
   - No other dependency/lockfile churn is allowed.
   - Do not run `pnpm config set`, do not change global pnpm config, and do not run full `pnpm install` unless Owner gives a separate approval.
   - If the bundled pnpm 11.7.0 path is unavailable, stop and record `BLOCKED_PNPM_11_BINARY_UNAVAILABLE`.
   - If the exact command still fails with a store mismatch, stop and record `BLOCKED_PNPM_STORE_MISMATCH_UNRESOLVED`.

2. Add fail-closed reusable code, preferably:
   - `lib/instagram-blob-media.ts`
   - Requirements:
     - Build deterministic immutable Blob pathname:
       - `instagram/reels/{contentId}/{variantId}/{version}/{sha256_12}.mp4`
     - Validate:
       - platform is Instagram only;
       - variant is `instagram_reels_full_frame_1080x1920`;
       - extension/content type is mp4/video;
       - file size is <= 35 MB;
       - hash segment is 12 lowercase hex characters;
       - `addRandomSuffix:false`;
       - `allowOverwrite:false`;
       - `access:"public"`;
       - `multipart:true` for mp4 upload plan.
     - Provide a no-upload plan builder that returns the pathname/options metadata.
     - If an actual upload function is added, it must be impossible to call successfully without a future explicit approval token such as `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST`.
     - Actual upload function must not be executed in this slice.
     - Do not read `process.env`, `.env.local`, `BLOB_READ_WRITE_TOKEN`, `VERCEL_OIDC_TOKEN`, or `BLOB_STORE_ID` in this slice.

3. Add a no-upload planning/check script, preferably:
   - `scripts/plan-vercel-blob-instagram-upload-no-upload.mjs`
   - It may read the approved local Instagram full-frame mp4 path only to compute size/hash and build a deterministic planned pathname.
   - It must not import or call `@vercel/blob`.
   - It must not upload or call network.
   - It must not read env/secrets.
   - It must write only small JSON evidence if useful.

4. Add/update durable evidence:
   - `docs/vercel-blob-dependency-code-integration-no-upload.md`
   - `scripts/fixtures/vercel_blob_dependency_code_integration_no_upload.v1.json`
   - `scripts/check-vercel-blob-dependency-code-integration-static.mjs`

5. Keep prior provisioning/integration packet history coherent:
   - Existing packet/result docs may remain historical.
   - If you touch them, do so only to add a short pointer to this new code-integration result.
   - Do not weaken existing no-secret/no-upload guards.

6. Append `_ai/CLAUDE_REPORT.md` with concise evidence.

7. Update `_ai/HANDOFF_NOW.md` only if execution reality differs materially from this handoff.

## Approved Input For No-Upload Planning

If a dry/no-upload planner needs a sample source, use the same approved Instagram/full-frame mp4:

- `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- expected bytes: `20294549`

This path is read-only input. Do not modify `C:\tmp`.

## Forbidden Actions

- Do not call `put()` or any SDK method that uploads, reads, lists, deletes, heads, or checks Blob objects.
- Do not upload any object.
- Do not perform public URL liveness checks.
- Do not read, write, print, or copy env/secret/token values.
- Do not access `.env.local`.
- Do not run `vercel env pull`.
- Do not connect the Blob store to a project.
- Do not use Vercel CLI for Blob mutation in this slice.
- Do not call Instagram API/`--arm`.
- Do not call YouTube API/OAuth/upload.
- Do not deploy or change DNS/domain.
- Do not run render/mux/TTS/image/browser/ffmpeg/media generation.
- Do not commit/push.
- Do not modify protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/`
  - unrelated `C:\tmp`

## Result Fixture Contract

The new fixture must encode:

- `taskId`: `vercel-blob-dependency-code-integration-no-upload-v1`
- `approvalToken`: `APPROVE_VERCEL_BLOB_DEPENDENCY_AND_CODE_INTEGRATION_NO_UPLOAD`
- dependency:
  - package `@vercel/blob` installed;
  - only `package.json` and `pnpm-lock.yaml` changed for dependency;
  - no other dependency added.
- code integration:
  - `lib/instagram-blob-media.ts` exists;
  - provider `vercel_blob_public_direct_url`;
  - platform `instagram_only`;
  - YouTube uses Blob: false;
  - store id/name/access recorded as non-secret metadata;
  - deterministic key pattern;
  - `access:"public"`, `addRandomSuffix:false`, `allowOverwrite:false`, `multipart:true`;
  - size cap 35 MB fail-closed.
- side effect counts all zero:
  - `blobObjectUploadCount`
  - `blobListHeadGetDeleteCount`
  - `publicUrlLivenessCheckCount`
  - `envSecretAccessCount`
  - `projectConnectionCount`
  - `deployCount`
  - `instagramApiCallCount`
  - `youtubeApiCallCount`
  - `mediaGenerationCount`
- no secret/token literal recorded.

## Required Checks

1. `git status -sb`
2. Dependency install:
   - `& 'C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd' add @vercel/blob --store-dir "C:\Users\PC\AppData\Local\pnpm\store"`
   - If the bundled pnpm 11.7.0 path is unavailable, stop and report `BLOCKED_PNPM_11_BINARY_UNAVAILABLE`.
   - If it fails because of network/sandbox/registry access, stop and report `BLOCKED_DEPENDENCY_INSTALL_NETWORK_OR_REGISTRY`; do not hand-edit lockfile.
   - If it fails because of store mismatch, stop and report `BLOCKED_PNPM_STORE_MISMATCH_UNRESOLVED`; do not run global config changes or full reinstall.
3. Syntax:
   - `node --check scripts/plan-vercel-blob-instagram-upload-no-upload.mjs`
   - `node --check scripts/check-vercel-blob-dependency-code-integration-static.mjs`
4. JSON parse:
   - `scripts/fixtures/vercel_blob_dependency_code_integration_no_upload.v1.json`
5. Type check if a TypeScript lib file is added:
   - prefer `pnpm exec tsc --noEmit --pretty false`
   - if existing unrelated type errors appear, record them clearly and also run narrower syntax/static checks.
6. No-upload planner smoke:
   - run the planner in no-upload/dry mode only.
   - confirm no upload/env/network occurs.
7. Static guard:
   - `node scripts/check-vercel-blob-dependency-code-integration-static.mjs`
8. Targeted regressions:
   - `node scripts/check-vercel-blob-store-provisioning-result-static.mjs`
   - `node scripts/check-vercel-blob-instagram-integration-packet-static.mjs`
   - `node scripts/check-dual-platform-variant-publish-architecture-static.mjs`
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`

Do not run full build unless type/import issues require it.

## Definition Of Done

- `@vercel/blob` is installed via pnpm and only expected dependency/lockfile changes occur.
- Fail-closed Instagram Blob media upload integration code exists.
- Deterministic immutable key builder and no-upload planner exist.
- No object upload, env/secret read/write, live URL check, API publish, deploy, or media generation occurs.
- Static guard proves Blob is Instagram-only and cannot drift to YouTube.
- Static guard proves no secret/token literal is recorded and side effect counts are zero.
- Required checks pass, or any blocker is reported fail-closed.
- `_ai/CLAUDE_REPORT.md` records concise evidence.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- dependency/code integration summary
- changed files
- dependency version installed
- no-upload planner result
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 92%`
