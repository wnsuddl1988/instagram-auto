# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `dual-platform-actual-api-executor-wiring-no-run-v1`
- Owner approval: `APPROVE_DUAL_PLATFORM_ACTUAL_API_EXECUTOR_WIRING_NO_RUN`
- Purpose: connect the gate 6 value-free `actualApiCallPlan` to an executor-shaped orchestration structure for Instagram Blob upload → Instagram publish → YouTube direct upload → ledger record, while keeping execution disabled/fail-closed.

## Current Evidence

Checkpoint `0550a85 chore(media): wire actual api no-execute plan` completed gate 6 no-execute planning:

- gate 6 can build a value-free `actualApiCallPlan` for custom ready-probe with dummy env
- plan contains three call specs:
  - Vercel Blob upload
  - Instagram Graph publish
  - YouTube direct upload
- every call spec is `executionEnabled:false` and `actualCallPerformed:false`
- default `t1_lifestyle_inflation/v3_2` still blocks at gate 4 before credential access and gate 6
- missing credentials still block at gate 5 before gate 6
- no credential values or value-derived data are printed or serialized
- checks passed before checkpoint:
  - orchestrator guard `453 PASS / 0 FAIL`
  - owner entrypoint guard `230 PASS / 0 FAIL`
  - owner local env wrapper guard `49 PASS / 0 FAIL`
  - golden content readiness guard `64 PASS / 0 FAIL`

The next blocker is not the plan. It is adding a no-run executor structure that defines how the plan would be executed in strict order, without importing/calling live clients and without enabling actual side effects.

## Approved Scope

Approved:

- In `scripts/run-dual-platform-final-publish-orchestrator.mjs`, add a no-run executor layer for gate 6 plan.
- The executor structure must represent this order:
  1. Instagram source mp4 → Vercel Blob public URL
  2. Blob public URL + optimized metadata → Instagram Graph publish
  3. YouTube letterbox mp4 + optimized metadata → YouTube direct upload
  4. Publish ledger record
- Execution flags must remain disabled:
  - global executor execution flag false
  - every step execution flag false
  - every step performed flag false
- Executor may reference existing function refs as strings/call specs only:
  - `lib/instagram-blob-media.ts` Blob helper/plan refs
  - `lib/instagram.ts#uploadInstagramReelWithCredentials`
  - `lib/youtube.ts#uploadYouTubeShortsWithCredentials`
  - future ledger record ref if represented as string only
- Executor must not receive or serialize credential values.
- Executor may use credential presence booleans already present in the plan.
- Keep the current no-execute status/fail-closed behavior:
  - custom ready-probe with dummy env may reach gate 6 executor plan
  - actual execution remains disabled/fail-closed
  - default duplicate content still blocks before credential/executor
  - missing credentials still block before executor
- Update fixture/docs/guards to reflect the no-run executor contract.
- Append concise reusable evidence to `_ai/CLAUDE_REPORT.md`.

Allowed files:

- `scripts/run-dual-platform-final-publish-orchestrator.mjs`
- `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json`
- `scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
- `docs/dual-platform-final-publish-orchestrator.md`
- `docs/owner-daily-automation-runbook.md`
- `_ai/CLAUDE_REPORT.md`
- If owner-facing output or guard checks break from new fields:
  - `scripts/run-owner-daily-automation-entrypoint.mjs`
  - `scripts/check-owner-daily-automation-entrypoint-static.mjs`
  - `scripts/check-owner-local-env-no-log-wrapper-static.mjs`

Only touch another file if a direct import/check break proves it is necessary, and report why.

## Required Behavior

### No-run executor structure

Add a narrowly scoped helper, for example:

- `buildActualApiExecutorNoRun(...)`
- or `buildDualPlatformExecutorNoRun(...)`

It should consume the existing value-free `actualApiCallPlan` plus non-secret context and return a value-free executor description:

- `executionEnabledThisSlice:false`
- `executorWillRun:false`
- `executorPerformed:false`
- ordered steps array with exactly four logical steps:
  1. `instagram_blob_upload`
  2. `instagram_publish_reel`
  3. `youtube_direct_upload`
  4. `publish_ledger_record`
- each step should include:
  - order
  - id
  - platform/provider
  - functionRef string or executorRef string
  - dependsOn step IDs
  - input source/readiness booleans
  - required approval tokens to enable future execution
  - executionEnabled:false
  - willRun:false
  - performed:false
  - disabled reason
- ledger step must be no-run/no-mutation and string-ref only.

The executor must not:

- import or call `lib/instagram.ts`, `lib/youtube.ts`, `lib/instagram-blob-media.ts`, `@vercel/blob`, `googleapis`, or any live client
- call `fetch`, `youtube.videos.insert`, Graph API URLs, OAuth/token endpoints, Blob `put/list/head/del/copy`, deploy, ffmpeg, or ffprobe
- read `.env` or `.env.local`
- receive credential values or any value-bearing object
- expose credential value-derived data.

### Default content

Default already-published content must remain unchanged:

- `--live` / `--arm` exits `3`
- status `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`
- gate 4 blocks before gate 5, gate 6 plan, and executor
- `credentialValuesAccessed:false`
- `actualApiCallReached:false`
- no executor result for default duplicate-blocked run
- all live side-effect counters remain 0

### Custom ready-probe with dummy env

For a custom content manifest that passes gates 1-5 with dummy env:

- gate 6 plan is reached
- no-run executor structure is built from the plan
- executor reports all steps disabled/not performed
- actual API execution remains disabled
- exit remains non-zero fail-closed
- all real side-effect counters remain 0
- dummy credential values must not appear in stdout/stderr/result JSON
- no value-derived credential data appears

### Missing credentials

For the same custom ready-probe without dummy env:

- gate 5 fails closed with missing key names only
- gate 6 plan and executor are not reached
- output contains no values or value-derived data

## Guard Requirements

Update/add checks that prove:

- default duplicate-blocked path still stops before credential resolution, gate 6 plan, and executor
- custom dummy-env ready-probe reaches no-run executor structure
- executor has exactly the expected four ordered steps
- every executor step has `executionEnabled:false`, `willRun:false`, `performed:false`
- executor dependencies are correct:
  - Instagram publish depends on Blob upload
  - ledger depends on Instagram publish and YouTube upload
- executor output has no dummy credential value or value-derived fields
- custom no-env ready-probe stops at gate 5 and does not build executor
- no live client function is imported or executed
- no `.env`, `.env.local`, dotenv, `vercel env pull`, secret file, broad env dump, or real Owner env wrapper is used in tests
- `process.env` access remains limited to existing approved presence/resolver patterns
- duplicate guard remains before credential resolver
- credential resolver remains before gate 6 plan/executor
- gate 6 executor remains disabled/fail-closed
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

1. Gate 6 no-run executor structure is wired for custom dummy-env ready-probe.
2. Executor models Blob upload → Instagram publish → YouTube upload → ledger order.
3. Every executor step remains disabled/not performed.
4. Default published content remains duplicate-blocked before credential access and executor.
5. Missing credentials still block at gate 5 before executor.
6. Actual Instagram/YouTube/Blob/ledger execution remains disabled and fail-closed.
7. No credential values or value-derived data appear in output/docs/fixtures/report.
8. `.env.local` and secret files are not read by Claude/Codex/tests.
9. No dependency/lockfile/deploy/media/API side effect, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- no-run executor wiring summary
- default duplicate-block behavior summary
- custom ready-probe with dummy env result
- missing credential fail-closed result
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
