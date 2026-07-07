# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `owner-local-env-no-log-command-wrapper-v1`
- Owner approval: `APPROVE_OWNER_LOCAL_ENV_NO_LOG_COMMAND_WRAPPER`
- Purpose: create an Owner-run no-log wrapper/launcher so local automation commands can receive only the approved env keys from `.env.local` as child process env, without exposing values to AI/model/chat/log/docs/git. The first target is making `owner:credential-preflight` show `present:true` when the Owner runs it locally.

## Why This Is Next

`8405904 chore(media): add redacted credential preflight` added a safe redacted presence command. Codex executed:

```powershell
node scripts/run-owner-daily-automation-entrypoint.mjs --credential-preflight
```

In the Codex shell, all six required keys were `present:false` because this process does not inherit the Owner's local secret env. The next blocker is not implementation logic; it is a safe Owner-run wrapper that can read only approved keys from the local `.env.local` file and pass them to a child command without ever printing, storing, hashing, or exposing values.

## Approved Scope

Approved:

- Add a no-log Owner-run wrapper/launcher for local commands.
- The wrapper may read `.env.local` only when the Owner runs it locally.
- Claude/Codex must not read `.env.local` during implementation or tests.
- Wrapper must load only these approved keys:
  - `INSTAGRAM_BUSINESS_ACCOUNT_ID`
  - `INSTAGRAM_ACCESS_TOKEN`
  - `YOUTUBE_CLIENT_ID`
  - `YOUTUBE_CLIENT_SECRET`
  - `YOUTUBE_REFRESH_TOKEN`
  - `BLOB_READ_WRITE_TOKEN`
- Values may be injected only into a child process env.
- Output may include key names and present/missing booleans only.
- Add an Owner command for credential preflight through the wrapper.
- Add docs/runbook instructions that are easy for Owner to run.
- Add static guard(s) and tests using fake temp env files or dummy env only.
- Append concise evidence to `_ai/CLAUDE_REPORT.md`.

Suggested implementation shape:

- `scripts/run-owner-command-with-local-env-no-log.mjs`
  - reads an explicit env file path, defaulting to `.env.local` only at Owner runtime
  - allowlist-only parser for the six approved keys
  - no value print, no length/hash/prefix/suffix/masked output
  - spawns approved project commands with `spawnSync(process.execPath, args, { shell:false, env: sanitizedEnv })`
  - first supported command can be `owner:credential-preflight` or `credential-preflight`
- `scripts/check-owner-local-env-no-log-wrapper-static.mjs`
  - dependency-free static/runtime guard
  - uses a fake temp env file with dummy values
  - asserts child output has `present:true` and dummy values are absent
  - asserts real `.env.local` is never read by the guard
- `package.json`
  - optional script only, no dependency changes, for example `owner:credential-preflight:local`
- `docs/owner-daily-automation-runbook.md`
  - add a short "local env no-log wrapper" section

Allowed files:

- `scripts/run-owner-command-with-local-env-no-log.mjs` (new)
- `scripts/check-owner-local-env-no-log-wrapper-static.mjs` (new)
- `docs/owner-daily-automation-runbook.md`
- `package.json` (scripts only; no deps/devDeps/lockfile)
- `_ai/CLAUDE_REPORT.md`
- If necessary, `scripts/run-owner-daily-automation-entrypoint.mjs` only for a tiny command-list/status integration; avoid touching it if the standalone wrapper is enough.

Only touch another file if a direct import/check break proves it is necessary, and report why.

## Required Behavior

### Wrapper

The wrapper must:

- be no-log by construction
- never print credential values
- never print value length, prefix, suffix, hash, masked value, token type, sample, or derived data
- support a fake env file path for tests
- support the real `.env.local` path only for Owner runtime, not guard tests
- parse basic `.env` syntax safely enough for key/value lines:
  - `KEY=value`
  - optional single/double quotes around values
  - ignore blank lines and comments
  - do not expand variables or execute anything
- allowlist only the six approved keys
- pass those key/value pairs to a child process env
- preserve only minimal non-secret OS env needed for child node execution on Windows
- run the child with `shell:false`
- remove values from local variables as much as practical after child exits

First command target:

- `credential-preflight`
  - should execute `scripts/run-owner-daily-automation-entrypoint.mjs --credential-preflight`
  - expected with fake env: all six keys `present:true`, `readyForCredentialResolution:true`, but still `credentialResolutionWiredThisSlice:false`
  - expected with missing fake keys: present false/missing as reported, exit still status-style if underlying command exits 0

### Guard

The guard must:

- create a fake temp env file outside the repo or under OS temp with dummy values
- run the wrapper against that fake env only
- verify dummy values never appear in stdout/stderr/result text
- verify no value length/hash/prefix/suffix/masked fields are emitted
- verify `.env.local` is not read by the guard
- verify wrapper source has no broad env dump/spread that could copy secrets accidentally
- verify wrapper only supports approved key names
- verify child process uses `shell:false`
- verify no Instagram/YouTube/Blob/OpenAI/ElevenLabs/Pexels/Supabase/API/upload/deploy/media generation patterns exist

## Forbidden Actions

- Claude/Codex must not read, print, edit, copy, stage, commit, or summarize `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not run the wrapper against real `.env.local` during implementation or tests.
- Do not print, hash, copy, log, stage, or document secret values.
- Do not report value length, prefix, suffix, hash, masked value, sample, token type inference, or derived credential data.
- Do not use dotenv package if it would require dependency changes.
- Do not use `vercel env pull`.
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
2. `node --check scripts/run-owner-command-with-local-env-no-log.mjs`
3. `node --check scripts/check-owner-local-env-no-log-wrapper-static.mjs`
4. `node scripts/check-owner-local-env-no-log-wrapper-static.mjs`
5. Regression:
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
6. If `package.json` changed, JSON parse and confirm deps/devDeps unchanged and `pnpm-lock.yaml` unchanged.

Do not run full build unless a focused syntax/import issue requires it.
Do not run local generation pipeline.
Do not run against real `.env.local`.

## Definition Of Done

All must be true:

1. Owner has one clear command to run credential preflight with local `.env.local` injected no-log.
2. The command can be tested with fake env and produces all six `present:true` booleans without exposing values.
3. No credential values, lengths, hashes, prefixes, suffixes, masked values, or token-shaped strings appear in output/docs/fixtures/report.
4. Claude/Codex did not read real `.env.local`.
5. Actual live publish behavior remains unchanged and no API/upload/blob/media side effect occurs.
6. No dependency/lockfile/deploy change, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- added command/package script if any
- no-log wrapper behavior summary
- fake-env test result
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`

