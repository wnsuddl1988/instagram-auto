# HANDOFF_NOW

전체프로젝트 진행률 : 약 92%

## Current Task

- Task ID: `vercel-blob-env-token-write-or-pull-v1`
- Latest accepted checkpoint: `010ccec feat(media): add vercel blob instagram no-upload integration`
- Owner approval: `APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL`
- Purpose: prepare/verify the Vercel Blob write credential path for future Instagram Blob object upload, without uploading any object or printing/recording secret values.

## Active Architecture

- Instagram public `video_url` provider: Vercel Blob public direct URL.
- YouTube upload mode: YouTube Data API direct file upload, no Blob/public URL.
- Provisioned Blob store:
  - name: `instagram-auto-instagram-media`
  - id: `store_NyZYiaz51y6acaCQ`
  - access: `public`
  - region: `iad1`
  - last known connectedProjects: none/standalone at checkpoint `c8e8f8f`
- Blob no-upload code integration is committed at `010ccec`.
- This task may prepare/verify credential availability only. It must not upload, check a live URL, deploy, or publish.

## Official / Local CLI Facts Confirmed By Codex

Use these as current evidence unless the CLI reports different behavior.

- Official Vercel Blob CLI docs: `https://vercel.com/docs/cli/blob`
  - `vercel blob` supports list/put/get/del/copy/create-store/delete-store/get-store/list-stores/empty-store.
  - Blob CLI auth reads `BLOB_READ_WRITE_TOKEN` from env, or can use `--rw-token`.
  - `create-store --yes` auto-connects to the linked project; this was not used during store creation because env write was not approved then.
  - Current CLI help for `vercel blob list-stores` supports `--all --json`.
- Official Vercel env CLI docs: `https://vercel.com/docs/cli/env`
  - `vercel env list` lists env vars by environment.
  - `vercel env pull [file]` writes env values to a local file.
  - `vercel env run -- <command>` runs a child command with project env without writing them to a file.
  - Production/preview env vars default to sensitive/encrypted behavior; values must not be printed.
- Local CLI path observed by Codex:
  - `C:\Users\PC\AppData\Roaming\npm\vercel.cmd`
  - version: `54.5.0`
- Current CLI help does not expose a clear standalone "connect existing Blob store to project" subcommand. If Claude discovers one from live CLI help, it may use it only under the exact safe conditions below.

## Approved Scope

Claude Code may:

1. Read only:
   - `AGENTS.md`
   - `_ai/HANDOFF_NOW.md`
   - `docs/vercel-blob-store-provisioning-result.md`
   - `docs/vercel-blob-dependency-code-integration-no-upload.md`
   - `scripts/fixtures/vercel_blob_store_provisioning_result.v1.json`
   - `scripts/fixtures/vercel_blob_dependency_code_integration_no_upload.v1.json`
   - `.vercel/project.json` only for non-secret linked project/org metadata.

2. Run non-secret Vercel CLI inspection:
   - `& 'C:\Users\PC\AppData\Roaming\npm\vercel.cmd' --version`
   - `& 'C:\Users\PC\AppData\Roaming\npm\vercel.cmd' whoami`
   - `& 'C:\Users\PC\AppData\Roaming\npm\vercel.cmd' blob list-stores --all --json`
   - `& 'C:\Users\PC\AppData\Roaming\npm\vercel.cmd' blob get-store store_NyZYiaz51y6acaCQ`
   - `& 'C:\Users\PC\AppData\Roaming\npm\vercel.cmd' env list production`
   - `& 'C:\Users\PC\AppData\Roaming\npm\vercel.cmd' env list preview`
   - `& 'C:\Users\PC\AppData\Roaming\npm\vercel.cmd' env list development`
   - CLI help commands as needed.
   - Record only metadata: command name, exit code, store id/name/access/project names, whether `BLOB_READ_WRITE_TOKEN` appears by name. Do not record env values.

3. Prepare a small redacted env presence checker:
   - `scripts/check-vercel-blob-token-presence-redacted.mjs`
   - It may read only `process.env.BLOB_READ_WRITE_TOKEN`.
   - It must print only redacted metadata:
     - `tokenPresent: true/false`
     - `tokenValuePrinted: false`
     - `allowedEnvKeysRead: ["BLOB_READ_WRITE_TOKEN"]`
   - It must not print token length, prefix, suffix, hash, or derived value.
   - It must not read `.env.local` or any other env key.
   - It must not import/call `@vercel/blob`.
   - It must not upload or call network.

4. Verify token runtime availability without writing env files:
   - Prefer `vercel env run` over `vercel env pull`.
   - Approved command shape:
     - `& 'C:\Users\PC\AppData\Roaming\npm\vercel.cmd' env run -e production -- node scripts/check-vercel-blob-token-presence-redacted.mjs`
     - If production is unavailable, try preview, then development.
   - This child script may read only the allowlisted key and must not print the value.

5. Perform at most one approved external mutation if and only if the Vercel CLI presents an unambiguous safe path to connect the existing store:
   - exact store: `instagram-auto-instagram-media` / `store_NyZYiaz51y6acaCQ`
   - exact linked project: `instagram-auto`
   - action: connect/link this existing public Blob store to the project so `BLOB_READ_WRITE_TOKEN` becomes available as a project env var.
   - Do not create a new Blob store.
   - Do not delete/empty/put/copy/get/list blobs.
   - Do not use `--rw-token`, `--token`, or any secret literal.
   - Do not answer any prompt unless it explicitly names the exact existing store and exact project. If ambiguous, stop.
   - If the CLI has no safe connect path, stop and record `BLOCKED_VERCEL_BLOB_EXISTING_STORE_LINK_METHOD_UNAVAILABLE`.

6. Create durable result evidence:
   - `docs/vercel-blob-env-token-write-or-pull-result.md`
   - `scripts/fixtures/vercel_blob_env_token_write_or_pull_result.v1.json`
   - `scripts/check-vercel-blob-env-token-write-or-pull-result-static.mjs`
   - Append `_ai/CLAUDE_REPORT.md` concise evidence.

7. Update `_ai/HANDOFF_NOW.md` only if execution reality differs materially from this handoff.

## Forbidden Actions

- Do not upload any Blob object.
- Do not call `put()`, `vercel blob put`, `copy`, `del`, `get` for object contents, `empty-store`, or `delete-store`.
- Do not perform public URL liveness checks.
- Do not call Instagram API/`--arm`.
- Do not call YouTube API/OAuth/upload.
- Do not deploy or change DNS/domain.
- Do not run render/mux/TTS/image/browser/ffmpeg/media generation.
- Do not install/change dependencies, lockfiles, fonts, or pnpm config.
- Do not commit/push.
- Do not read, print, hash, store, copy, or record secret/token values.
- Do not access `.env.local`.
- Do not run broad `vercel env pull` into `.env.local`.
- Do not use `--rw-token` or `--token`.
- Do not create another Blob store.
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

The fixture must encode:

- `taskId`: `vercel-blob-env-token-write-or-pull-v1`
- `approvalToken`: `APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL`
- store:
  - `storeName`: `instagram-auto-instagram-media`
  - `storeId`: `store_NyZYiaz51y6acaCQ`
  - `access`: `public`
- project:
  - linked project name/id metadata if available, no secret values.
- outcome status, one of:
  - `ALREADY_CONFIGURED_TOKEN_AVAILABLE_REDACTED`
  - `CONNECTED_TOKEN_AVAILABLE_REDACTED`
  - `CONNECTED_TOKEN_NOT_RUNTIME_AVAILABLE`
  - `BLOCKED_VERCEL_CLI_UNAVAILABLE`
  - `BLOCKED_VERCEL_AUTH_OR_INTERACTIVE_REQUIRED`
  - `BLOCKED_VERCEL_BLOB_EXISTING_STORE_LINK_METHOD_UNAVAILABLE`
  - `BLOCKED_AMBIGUOUS_STORE_OR_PROJECT`
  - `BLOCKED_SECRET_VALUE_WOULD_BE_EXPOSED`
- side effect counts:
  - `storeProjectConnectionAttemptCount`: 0 or 1
  - `storeProjectConnectionCreatedCount`: 0 or 1
  - `blobObjectUploadCount`: 0
  - `blobObjectReadListDeleteCount`: 0
  - `publicUrlLivenessCheckCount`: 0
  - `instagramApiCallCount`: 0
  - `youtubeApiCallCount`: 0
  - `deployCount`: 0
  - `dependencyChangeCount`: 0
- env/token safety:
  - `allowedEnvKey`: `BLOB_READ_WRITE_TOKEN`
  - `tokenValuePrinted`: false
  - `tokenValueRecorded`: false
  - `tokenHashRecorded`: false
  - `envLocalAccessed`: false
  - `broadEnvPullPerformed`: false
  - `vercelEnvRunUsed`: true/false

## Required Checks

1. `git status -sb`
2. Syntax:
   - `node --check scripts/check-vercel-blob-token-presence-redacted.mjs`
   - `node --check scripts/check-vercel-blob-env-token-write-or-pull-result-static.mjs`
3. JSON parse:
   - `scripts/fixtures/vercel_blob_env_token_write_or_pull_result.v1.json`
4. Static guard:
   - `node scripts/check-vercel-blob-env-token-write-or-pull-result-static.mjs`
5. Targeted regressions:
   - `node scripts/check-vercel-blob-dependency-code-integration-static.mjs`
   - `node scripts/check-vercel-blob-store-provisioning-result-static.mjs`
   - `node scripts/check-vercel-blob-instagram-integration-packet-static.mjs`
   - `node scripts/check-dual-platform-variant-publish-architecture-static.mjs`

Do not run full build unless required by a concrete syntax/import issue.

## Definition Of Done

- The project either has redacted runtime availability for `BLOB_READ_WRITE_TOKEN`, or a fail-closed blocker explains why not.
- If a store/project connection is created, it is exactly one connection for the existing store and linked project.
- No secret/token value is printed, hashed, copied, stored, or recorded.
- No Blob object upload/read/download/delete, liveness check, API publish, deploy, media generation, dependency change, commit, or push occurs.
- Result docs + fixture + static guard capture the outcome.
- Required checks pass, or the blocker is recorded fail-closed.
- `_ai/CLAUDE_REPORT.md` records concise evidence.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- outcome status
- whether store/project connection was already configured, newly connected, or blocked
- whether `BLOB_READ_WRITE_TOKEN` runtime availability was verified redacted
- changed files
- Vercel CLI commands/results summary with no secret values
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 92%`
