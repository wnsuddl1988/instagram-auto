# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `dual-platform-credential-preflight-redacted-no-live-v1`
- Owner approval basis: continue after checkpoint `23f1d9f chore(media): route custom content to credential gate`
- Purpose: add a no-live, no-secret credential readiness preflight so the Owner can see whether required runtime env key names are present before the final live publish wiring step. This must not read `.env.local`, print values, call APIs, or enable actual publish.

## Why This Is Next

The previous slice removed the old custom-content gate 4.5 halt:

- default published content still blocks at duplicate guard(exit 3)
- custom ready content reaches gate 5 and exits with `CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE`(exit 4)

The next real blocker is credential readiness. Before wiring credential resolution/API execution, the project needs a safe command that answers:

- Are the required runtime env key **names** present?
- Which platform is missing keys?
- Is the output free of secret values?
- Does this check avoid `.env.local` and external APIs?

This slice is still no-live. It does **not** resolve credential values into API calls.

## Approved Scope

Approved:

- Add a redacted credential preflight mode to the dual-platform orchestrator:
  - suggested CLI: `--credential-preflight`
  - optional `--content-unit <manifest>` should be accepted like other modes if easy; it must not affect env presence logic except context fields.
  - output JSON only, no secret values.
- Add owner entrypoint support:
  - suggested CLI: `node scripts/run-owner-daily-automation-entrypoint.mjs --credential-preflight [--content-unit <path>]`
  - package script may be added: `owner:credential-preflight`
  - status/runbook should mention it briefly.
- The check may inspect `process.env` **only** for boolean presence of approved key names:
  - `INSTAGRAM_BUSINESS_ACCOUNT_ID`
  - `INSTAGRAM_ACCESS_TOKEN`
  - `YOUTUBE_CLIENT_ID`
  - `YOUTUBE_CLIENT_SECRET`
  - `YOUTUBE_REFRESH_TOKEN`
  - `BLOB_READ_WRITE_TOKEN`
- Presence output must be redacted:
  - allowed: key name, `present:true/false`, platform-level `allPresent:true/false`
  - forbidden: actual value, value length, prefix, suffix, hash, sample, token type inference, copied value.
- Keep live execution behavior unchanged:
  - default duplicate content still exit 3 `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`
  - custom ready content still exit 4 `CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE`
  - actual credential resolution/API call still disabled.
- Update fixture/docs/guards to reflect the new redacted preflight command.
- Append concise evidence to `_ai/CLAUDE_REPORT.md`.

Allowed files:

- `scripts/run-dual-platform-final-publish-orchestrator.mjs`
- `scripts/run-owner-daily-automation-entrypoint.mjs`
- `scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
- `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json`
- `docs/dual-platform-final-publish-orchestrator.md`
- `docs/owner-daily-automation-runbook.md`
- `package.json` (scripts only, no dependency/devDependency changes)
- `_ai/CLAUDE_REPORT.md`

Only touch another file if a direct import/check break proves it is necessary, and report why.

## Required Behavior

### Orchestrator credential preflight

Suggested output fields:

- `schemaVersion`
- `mode: "credential_preflight"`
- `contentId` / `version` / `isDefaultContentUnit`
- `credentialValuesAccessed:false`
- `credentialValuesPrinted:false`
- `dotEnvLocalDirectAccess:false`
- `externalApiCallPerformed:false`
- `requiredEnvKeyNames`
- `platforms.instagram.keys[]`
- `platforms.youtube.keys[]`
- `platforms.vercelBlob.keys[]`
- `allRequiredKeysPresent`
- `readyForCredentialResolution`

It may exit 0 regardless of missing keys, as a diagnostic/readiness report. If you choose non-zero on missing keys, document it and make guards deterministic in this environment. Prefer exit 0 for a status-style operator check.

### Owner entrypoint

- Add `--credential-preflight` mode that delegates to the orchestrator safely with `spawnSync(process.execPath, [...], { shell:false })`.
- Must not read `.env.local`.
- Must not print any env value.
- Must not call live/API/upload.
- `--status` should list the command and explain it checks only redacted key presence.
- If adding `package.json` script, modify scripts only:
  - suggested: `owner:credential-preflight`

### Guard requirements

- Verify the new mode exists.
- Verify output includes key names and `present` booleans only.
- Verify output has no secret-shaped values:
  - Meta token shape like `EAA...`
  - Google token shape like `ya29...`
  - Vercel blob token shape like `vercel_blob_rw_...`
- Verify no value length/hash/prefix/suffix fields exist.
- Verify `.env.local` is not referenced in executable code.
- Verify no external API/Blob/ffmpeg/deploy patterns were added.
- Verify live behavior is unchanged:
  - default live duplicate block exit 3
  - custom ready-probe credential stub exit 4

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not print, hash, copy, log, stage, or commit token values.
- Do not use dotenv, `vercel env pull`, broad env dumps, secret file reads, or any helper that reveals values.
- Do not report value length, prefix, suffix, hash, sample, or token type inference.
- Do not call Instagram API, YouTube API/OAuth/upload, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or paid/external live services.
- Do not call Blob SDK, upload/delete/overwrite/copy/list/head/mutation.
- Do not call public HEAD.
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
2. `node --check scripts/run-dual-platform-final-publish-orchestrator.mjs`
3. `node --check scripts/run-owner-daily-automation-entrypoint.mjs`
4. `node --check scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
5. `node --check scripts/check-owner-daily-automation-entrypoint-static.mjs`
6. `package.json` JSON parse if modified.
7. Fixture JSON parse for `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json` if modified.
8. `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
9. `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
10. Targeted regression:
    - `node scripts/check-dual-platform-content-unit-final-readiness-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run local generation pipeline.
Do not run ffmpeg/ffprobe/deploy/API/network.

## Definition Of Done

All must be true:

1. Owner can run a short credential preflight command.
2. The command reports only key presence booleans and platform readiness.
3. No credential values, lengths, hashes, prefixes, suffixes, or token-shaped strings appear in output/docs/fixtures/report.
4. `.env.local` and secret files are not read.
5. Actual live publish behavior remains unchanged and no API/upload/blob/media side effect occurs.
6. No dependency/lockfile/deploy change, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- added command/package script if any
- credential preflight behavior summary
- live behavior unchanged summary
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
