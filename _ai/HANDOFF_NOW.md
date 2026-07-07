# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `dual-platform-credential-resolution-wiring-no-execute-v1`
- Owner approval: `APPROVE_DUAL_PLATFORM_CREDENTIAL_RESOLUTION_WIRING_NO_EXECUTE`
- Purpose: wire the dual-platform orchestrator's credential gate so the six approved runtime env keys injected by the Owner local no-log wrapper can be assembled into explicit credential objects, while actual Instagram/YouTube/Blob API execution remains disabled and fail-closed.

## Current Evidence

Checkpoint `5eed757 feat(operator): add no-log local env command wrapper` added:

- `pnpm owner:credential-preflight:local`
- `scripts/run-owner-command-with-local-env-no-log.mjs`
- `scripts/check-owner-local-env-no-log-wrapper-static.mjs`

Owner ran:

```powershell
cd C:\Users\PC\jjy\instagram-auto
pnpm owner:credential-preflight:local
```

Redacted output showed all six required keys `present:true`:

- `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- `INSTAGRAM_ACCESS_TOKEN`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`
- `BLOB_READ_WRITE_TOKEN`

The same output confirmed:

- `allRequiredKeysPresent:true`
- `readyForCredentialResolution:true`
- `credentialResolutionWiredThisSlice:false`
- no credential values printed

So the next blocker is no longer key presence. It is wiring gate 5 so credentials can be resolved into in-memory explicit credential objects without enabling any real publish/upload.

## Approved Scope

Approved:

- Wire credential gate in `scripts/run-dual-platform-final-publish-orchestrator.mjs`.
- Use only these approved env key names:
  - `INSTAGRAM_BUSINESS_ACCOUNT_ID`
  - `INSTAGRAM_ACCESS_TOKEN`
  - `YOUTUBE_CLIENT_ID`
  - `YOUTUBE_CLIENT_SECRET`
  - `YOUTUBE_REFRESH_TOKEN`
  - `BLOB_READ_WRITE_TOKEN`
- Read values only from runtime `process.env` injected by the Owner no-log wrapper or dummy test env.
- Build explicit credential objects in memory only:
  - Instagram credentials for `uploadInstagramReelWithCredentials`
  - YouTube credentials for `uploadYouTubeShortsWithCredentials`
  - Vercel Blob token object/plan for future Blob upload
- Do not serialize, print, hash, measure, mask, sample, or log credential values.
- Keep actual API/upload execution disabled:
  - no Instagram publish
  - no YouTube OAuth/upload
  - no Blob upload/delete/overwrite/list/head/copy
- Keep default already-published `t1_lifestyle_inflation/v3_2` duplicate guard behavior unchanged:
  - default `--live` / `--arm` must still stop at gate 4 duplicate guard before credential resolution
  - exit/status should remain `BLOCKED_DUPLICATE_ALREADY_PUBLISHED` / exit 3
- For custom/non-default ready content:
  - gate 1 metadata, gate 2 source, gate 3 Blob liveness, gate 4 duplicate guard pass
  - gate 5 should now resolve credentials when dummy env is provided
  - gate 6 actual API call must remain disabled/fail-closed
  - expected new halt should clearly mean "API execution not enabled", not "credential resolution not wired"
- For missing credentials:
  - gate 5 should fail-closed before API call
  - output may list missing key names only, not values or value-derived data.
- Update fixture/docs/guards to reflect the new no-execute credential resolution contract.
- Append concise evidence to `_ai/CLAUDE_REPORT.md`.

Allowed files:

- `scripts/run-dual-platform-final-publish-orchestrator.mjs`
- `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json`
- `scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
- `docs/dual-platform-final-publish-orchestrator.md`
- `docs/owner-daily-automation-runbook.md`
- `_ai/CLAUDE_REPORT.md`
- If necessary, `scripts/run-owner-daily-automation-entrypoint.mjs` and/or `scripts/check-owner-daily-automation-entrypoint-static.mjs` only if owner-facing summaries or guards break from changed status names.

Only touch another file if a direct import/check break proves it is necessary, and report why.

## Required Behavior

### Credential resolution helper

Add a narrowly scoped helper in the orchestrator, for example:

- `resolveExplicitCredentialsFromRuntimeEnv()`

It should:

- read only the six approved `process.env[KEY]` values
- treat empty string as missing
- return booleans/key names suitable for JSON output:
  - `credentialResolutionWiredThisSlice:true`
  - `credentialValuesAccessed:true` only when gate 5 is actually reached
  - `credentialValuesResolved:true/false`
  - `missingCredentialKeyNames:[...]`
  - platform-level `allPresent`
- keep actual credential values in local in-memory objects only
- never include credential values in returned JSON, docs, fixtures, reports, or thrown errors
- never compute or output value length/hash/prefix/suffix/masked/token type.

### Live gate behavior

Default already-published content:

- `--live` / `--arm` remains duplicate-blocked at gate 4.
- credential resolution gate is not reached.
- `credentialValuesAccessed:false`
- API call not reached.
- counters remain 0.

Custom ready-probe with dummy env:

- reaches gate 5
- resolves explicit credential objects in memory
- reports `credentialValuesAccessed:true` and `credentialValuesResolved:true`
- reports no values and no value-derived data
- reaches gate 6 as "blocked because actual API execution is disabled this slice"
- exits non-zero fail-closed, preferably exit 4, with a clear status such as `ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE` or equivalent
- all side-effect counters remain 0.

Custom ready-probe without dummy env:

- reaches gate 5
- reports missing key names only
- does not reach actual API call
- exits non-zero fail-closed
- all side-effect counters remain 0.

Credential preflight mode:

- may continue to report presence booleans.
- If status wording changes due to `credentialResolutionWiredThisSlice:true`, make sure it cannot be misunderstood as publish enabled.

## Guard Requirements

Update/add checks that prove:

- default duplicate-blocked live path still stops before credential resolution
- custom ready-probe with dummy env resolves credentials but does not call APIs
- custom ready-probe without dummy env blocks at credential gate with missing key names only
- output does not include dummy values
- output does not include value length/hash/prefix/suffix/masked/sample/token type
- runner does not use `.env`, `.env.local`, dotenv, `vercel env pull`, or secret files
- runner env access is limited to the six approved `process.env[KEY]` reads inside the credential resolver and the existing redacted presence helper
- duplicate guard remains before credential resolution
- actual API call gate remains disabled
- no `fetch`, `googleapis` execution, `@vercel/blob` mutation, `youtube.videos.insert`, Graph API, OAuth request, upload, deploy, ffmpeg, or ffprobe is introduced
- no real `.env.local` is read in tests; use dummy env only.

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

1. Gate 5 credential resolution is wired for dummy env/custom ready-probe.
2. Default published content remains duplicate-blocked before credential access.
3. Actual API/upload execution remains disabled and fail-closed.
4. No credential values or value-derived data appear in output/docs/fixtures/report.
5. `.env.local` and secret files are not read by Claude/Codex/tests.
6. No dependency/lockfile/deploy/media/API side effect, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- credential resolution behavior summary
- default duplicate-block behavior summary
- custom ready-probe with dummy env result
- missing credential fail-closed result
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`

