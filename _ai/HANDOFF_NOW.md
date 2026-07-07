# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `dual-platform-actual-api-call-wiring-no-execute-v1`
- Owner approval: `APPROVE_DUAL_PLATFORM_ACTUAL_API_CALL_WIRING_NO_EXECUTE`
- Purpose: wire the dual-platform orchestrator's gate 6 `actual_api_call` structure to the already-import-safe explicit credential client functions, while keeping real Instagram/YouTube/Vercel Blob execution disabled and fail-closed.

## Current Evidence

Checkpoint `63793a5 chore(media): wire credential resolution no-execute` completed gate 5:

- approved six runtime env keys can be resolved into in-memory explicit credential objects
- default `t1_lifestyle_inflation/v3_2` still blocks at gate 4 duplicate guard before credential access
- custom ready-probe with dummy env reaches gate 5 and resolves credentials
- custom ready-probe without env fails closed with missing key names only
- gate 6 remains disabled, no actual API/upload call
- checks passed before checkpoint:
  - orchestrator guard `433 PASS / 0 FAIL`
  - owner entrypoint guard `230 PASS / 0 FAIL`
  - owner local env wrapper guard `49 PASS / 0 FAIL`
  - golden content readiness guard `64 PASS / 0 FAIL`

The next blocker is not credential presence or credential resolution. It is the gate 6 no-execute wiring plan: mapping resolved in-memory credentials + prepared job inputs to the explicit client call structure without actually invoking network/API/upload.

## Approved Scope

Approved:

- In `scripts/run-dual-platform-final-publish-orchestrator.mjs`, wire gate 6 `actual_api_call` as a no-execute execution plan.
- Use explicit credential object shape already produced by gate 5, but do not pass real values into any real API client call.
- Reference existing explicit-credential client functions only as no-execute call specs or dry call descriptors:
  - `lib/instagram.ts#uploadInstagramReelWithCredentials`
  - `lib/youtube.ts#uploadYouTubeShortsWithCredentials`
  - `lib/instagram-blob-media.ts` explicit Blob upload helper/plan function if already safe and import-safe
- Preserve default duplicate-block behavior:
  - default `t1_lifestyle_inflation/v3_2` still blocks at gate 4 before credential resolution and before gate 6.
- For custom ready-probe with dummy env:
  - gate 1 metadata, gate 2 source, gate 3 Blob liveness, gate 4 duplicate guard, and gate 5 credential resolution can pass
  - gate 6 should build an `actualApiCallPlan`/equivalent no-execute structure
  - actual execution must remain disabled/fail-closed
  - expected halt status should clearly indicate actual API execution is still disabled, for example `ACTUAL_API_CALL_EXECUTION_DISABLED_THIS_SLICE` or an existing equivalent if clearer
  - output may include function names, platform job IDs, source paths, public URL presence booleans, and input readiness booleans
  - output must not include credential values or value-derived data
- For missing credentials:
  - gate 5 still blocks before gate 6 plan construction.
- Update fixture/docs/guards to reflect the gate 6 no-execute actual API call wiring contract.
- Append concise reusable evidence to `_ai/CLAUDE_REPORT.md`.

Allowed files:

- `scripts/run-dual-platform-final-publish-orchestrator.mjs`
- `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json`
- `scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
- `docs/dual-platform-final-publish-orchestrator.md`
- `docs/owner-daily-automation-runbook.md`
- `_ai/CLAUDE_REPORT.md`
- If owner-facing output or guard checks break from new status/field names:
  - `scripts/run-owner-daily-automation-entrypoint.mjs`
  - `scripts/check-owner-daily-automation-entrypoint-static.mjs`
  - `scripts/check-owner-local-env-no-log-wrapper-static.mjs`

Only touch another file if a direct import/check break proves it is necessary, and report why.

## Required Behavior

### Gate 6 no-execute plan

Add a narrowly scoped gate 6 planner/executor stub, for example:

- `buildActualApiCallPlanNoExecute(...)`
- or `evaluateActualApiCallGateNoExecute(...)`

It should:

- accept job plan/context and the value-bearing in-memory credential object from gate 5 only inside local scope
- derive a value-free call plan:
  - Instagram publish call target/function ref
  - YouTube direct upload call target/function ref
  - Blob upload call target/function ref or Blob URL prerequisite status
  - required source/public URL/metadata/readiness booleans
  - execution disabled reason
- never include credential values in returned JSON
- never compute credential value length/hash/prefix/suffix/masked/sample/token type
- never import or call live API/upload functions
- never call `fetch`, `googleapis`, `youtube.videos.insert`, Graph API, Blob `put/list/head/del/copy`, OAuth token request, deploy, ffmpeg, or ffprobe
- return a fail-closed status rather than executing calls

### Default content

Default already-published content must remain unchanged:

- `--live` / `--arm` exits `3`
- status `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`
- gate 4 blocks before gate 5 and gate 6
- `credentialValuesAccessed:false`
- `actualApiCallReached:false`
- all live side-effect counters remain 0

### Custom ready-probe with dummy env

For a custom content manifest that passes gates 1-5 with dummy env:

- gate 6 is reached as a no-execute planning gate
- gate 6 produces value-free call specs/function refs
- actual API execution remains disabled
- exit should be non-zero fail-closed
- all real side-effect counters remain 0
- dummy credential values must not appear in stdout/stderr/result JSON
- no value-derived credential data appears

### Missing credentials

For the same custom ready-probe without dummy env:

- gate 5 fails closed with missing key names only
- gate 6 is not reached
- no actual API plan using credentials is constructed
- output contains no values or value-derived data

## Guard Requirements

Update/add checks that prove:

- default duplicate-blocked path still stops before credential resolution and gate 6
- custom dummy-env ready-probe reaches gate 6 no-execute plan
- custom dummy-env ready-probe output has no dummy value or value-derived fields
- custom no-env ready-probe stops at gate 5 and does not reach gate 6
- no actual API/upload/OAuth/Blob mutation function is imported or executed
- live client function references are string refs/call specs only unless an import is proven import-safe and still no-execute
- no `.env`, `.env.local`, dotenv, `vercel env pull`, secret file, broad env dump, or real Owner env wrapper is used in tests
- `process.env` access remains limited to:
  - existing redacted presence helper
  - approved six-key credential resolver from gate 5
- duplicate guard remains before credential resolver
- credential resolver remains before gate 6
- gate 6 remains disabled/fail-closed
- no `fetch`, `googleapis`, `youtube.videos.insert`, Graph API URL execution, OAuth request, Blob `put/list/head/del/copy`, deploy, ffmpeg, or ffprobe is introduced

## Forbidden Actions

- Do not read, edit, print, copy, stage, commit, or summarize `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not run the Owner no-log wrapper against real `.env.local`.
- Do not print, hash, copy, log, stage, or document secret values.
- Do not report value length, prefix, suffix, hash, masked value, sample, token type inference, or derived credential data.
- Do not use dotenv or `vercel env pull`.
- Do not call Instagram API, YouTube API/OAuth/upload, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, Blob SDK/mutation/HEAD, ffmpeg, or ffprobe.
- Do not create new media, TTS, images, browser renders, or muxed source files.
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
2. `node --check scripts/run-dual-platform-final-publish-orchestrator.mjs`
3. `node --check scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
4. JSON parse:
   - `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json`
5. `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
6. Targeted regressions:
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs` if owner entrypoint/guard/docs status behavior changed
   - `node scripts/check-owner-local-env-no-log-wrapper-static.mjs`
   - `node scripts/check-dual-platform-content-unit-final-readiness-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run local generation pipeline.
Do not run against real `.env.local`.

## Definition Of Done

All must be true:

1. Gate 6 no-execute actual API call plan is wired for custom dummy-env ready-probe.
2. Default published content remains duplicate-blocked before credential access and gate 6.
3. Missing credentials still block at gate 5 before gate 6.
4. Actual Instagram/YouTube/Blob execution remains disabled and fail-closed.
5. No credential values or value-derived data appear in output/docs/fixtures/report.
6. `.env.local` and secret files are not read by Claude/Codex/tests.
7. No dependency/lockfile/deploy/media/API side effect, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- gate 6 no-execute wiring summary
- default duplicate-block behavior summary
- custom ready-probe with dummy env result
- missing credential fail-closed result
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
