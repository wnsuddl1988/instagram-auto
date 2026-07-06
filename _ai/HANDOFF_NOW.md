# HANDOFF_NOW

전체프로젝트 진행률 : 약 92%

## Current Task

- Task ID: `vercel-blob-store-provisioning-v1`
- Latest accepted checkpoint: `afc67d0 docs(media): prepare vercel blob instagram integration packet`
- Owner approval: `APPROVE_VERCEL_BLOB_STORE_PROVISIONING`
- Purpose: create or confirm an already-existing Vercel Blob public store for Instagram media only.

## Approved External Action

The only approved external mutation is:

- Create one public Vercel Blob store named `instagram-auto-instagram-media`, or confirm an already-existing equivalent store.

Everything else remains forbidden.

## Active Architecture

- Instagram uses Vercel Blob public direct URL for public unauthenticated `video_url`.
- YouTube uses YouTube Data API direct file upload and must not use Blob/public URL.
- Cloudflare/R2 remains suspended by Owner preference.
- This task provisions only the Blob store container. It does not configure env values, install SDKs, upload files, check live media URLs, or publish to Instagram.

## Official Vercel CLI Facts Confirmed By Codex

Use these as current official-doc evidence. Do not perform additional live/network research unless a command fails in a way that requires confirming changed official behavior.

- Official Vercel Blob docs: `https://vercel.com/docs/vercel-blob`
- Official Vercel Blob CLI docs: `https://vercel.com/docs/cli/blob`
- Vercel Blob docs say Blob stores can be managed from dashboard or Vercel CLI.
- CLI supports:
  - `vercel blob list-stores [--all]`
  - `vercel blob get-store [store-id]`
  - `vercel blob create-store [name] --access <access> [--region <region>] [--yes] [--environment <env>]`
- `--access` is required and must be `public` for this project.
- Default region is `iad1` when `--region` is not specified.
- `--yes` auto-connects to the linked project and defaults to all environments, so do not use it in this slice because project connection may create or attach env token state.
- Store access mode is immutable after creation; never create a private store for this task.

## Approved Defaults

- Store name: `instagram-auto-instagram-media`
- Access mode: `public`
- Region: default `iad1` unless Vercel CLI requires explicit selection; do not invent another region.
- Project connection:
  - Do not connect the store to a project in this slice.
  - Do not use `--yes` or `--environment`.
  - If the CLI requires connection, env creation, an interactive question, or ambiguous scope/team/project selection, stop and report rather than guessing.

## Approved Scope

Claude Code may:

1. Read:
   - `AGENTS.md`
   - `_ai/HANDOFF_NOW.md`
   - `docs/vercel-blob-instagram-integration-packet.md`
   - `scripts/fixtures/vercel_blob_instagram_integration_packet.v1.json`
   - `.vercel/project.json` only for non-secret project/org identification.

2. Run safe Vercel CLI checks:
   - `vercel --version`
   - `vercel whoami`
   - `vercel project ls` or equivalent non-mutating project context check
   - `vercel blob list-stores --all`

3. If no matching public store exists and the CLI path is authenticated/non-interactive:
   - create exactly one public store:
     - `vercel blob create-store instagram-auto-instagram-media --access public`
   - Do not pass `--yes`, `--environment`, `--token`, or `--rw-token`.
   - If the command cannot create a standalone store without project/env connection, stop and record `BLOCKED_VERCEL_STORE_CONNECTION_OR_ENV_WRITE_REQUIRED`.

4. If a matching store already exists:
   - do not create another store;
   - record already-exists confirmation.

5. Add small durable result evidence:
   - `docs/vercel-blob-store-provisioning-result.md`
   - `scripts/fixtures/vercel_blob_store_provisioning_result.v1.json`
   - `scripts/check-vercel-blob-store-provisioning-result-static.mjs`

6. Append `_ai/CLAUDE_REPORT.md` with concise evidence.

7. Update `_ai/HANDOFF_NOW.md` only if execution reality differs materially from this handoff.

## Secret / Env Handling

- Do not read, print, copy, or write `BLOB_READ_WRITE_TOKEN`.
- Do not run `vercel env pull`.
- Do not access `.env.local`.
- Do not pass `--token` or `--rw-token`.
- Do not inspect shell environment values.
- It is acceptable for the Vercel CLI to use the Owner's already-authenticated CLI session.
- If Vercel requires a token value, login, MFA, browser action, or interactive prompt, stop and report `BLOCKED_VERCEL_AUTH_OR_INTERACTIVE_REQUIRED`.

## Forbidden Actions

- Do not create private Blob stores.
- Do not create more than one Blob store.
- Do not create, read, write, or print tokens/secrets/env values.
- Do not install `@vercel/blob` or change dependencies/lockfiles.
- Do not upload objects.
- Do not perform public URL liveness checks.
- Do not call Instagram API/`--arm`.
- Do not call YouTube API/OAuth or upload to YouTube.
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

## Required Result Fixture Contract

The result fixture must include:

- `taskId`: `vercel-blob-store-provisioning-v1`
- `approvalToken`: `APPROVE_VERCEL_BLOB_STORE_PROVISIONING`
- `storeName`: `instagram-auto-instagram-media`
- `accessMode`: `public`
- one of:
  - `status`: `PROVISIONED`
  - `status`: `ALREADY_EXISTS`
  - `status`: `BLOCKED_VERCEL_AUTH_OR_INTERACTIVE_REQUIRED`
- `status`: `BLOCKED_VERCEL_CLI_UNAVAILABLE`
- `status`: `BLOCKED_UNSAFE_OR_AMBIGUOUS_CONTEXT`
- `status`: `BLOCKED_VERCEL_STORE_CONNECTION_OR_ENV_WRITE_REQUIRED`
- `externalMutationOccurred`: true only if a new store was actually created.
- `storeCreationAttemptCount`: 0 or 1 only.
- `blobObjectUploadCount`: 0.
- `envSecretAccessCount`: 0.
- `dependencyChangeCount`: 0.
- `deployCount`: 0.
- `instagramApiCallCount`: 0.
- `youtubeApiCallCount`: 0.
- evidence that no token/secret literal is recorded.

## Required Checks

1. `git status -sb`
2. Syntax:
   - `node --check scripts/check-vercel-blob-store-provisioning-result-static.mjs`
3. JSON parse:
   - `scripts/fixtures/vercel_blob_store_provisioning_result.v1.json`
4. Static guard:
   - `node scripts/check-vercel-blob-store-provisioning-result-static.mjs`
5. Targeted regressions:
   - `node scripts/check-vercel-blob-instagram-integration-packet-static.mjs`
   - `node scripts/check-dual-platform-variant-publish-architecture-static.mjs`
   - `node scripts/check-media-provider-decision-packet-static.mjs`
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`

Do not run full build unless syntax/import issues require it.

## Definition Of Done

- The Vercel Blob public store `instagram-auto-instagram-media` is either created exactly once or confirmed already existing.
- If the operation is blocked, no unsafe workaround is attempted and the blocker is recorded fail-closed.
- No env/secret/token values are read, written, or recorded.
- No object upload, liveness check, API publish, dependency change, deploy, media generation, commit, or push occurs.
- Result docs + fixture + guard capture the outcome.
- Static guard and targeted regressions pass.
- `_ai/CLAUDE_REPORT.md` records concise evidence.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- provisioning status (`PROVISIONED` / `ALREADY_EXISTS` / blocker code)
- store name/access/region if known
- whether external mutation occurred
- changed files
- Vercel CLI commands/results summary
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 92%`
