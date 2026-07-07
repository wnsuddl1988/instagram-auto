# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `dual-platform-custom-content-live-credential-gate-no-execute-v1`
- Owner approval basis: continue usability work after checkpoint `b3197c2 chore(operator): add golden sample readiness shortcuts`
- Purpose: move custom/non-default content live evaluation past the old gate 4.5 halt when all no-secret readiness gates pass, while still stopping before credential values/API calls. This makes the remaining blocker for new content explicit: credential resolution/API execution is not wired in this slice.

## Why This Is Next

The ready golden sample can now be checked with short commands:

- `pnpm owner:ready-preflight`
- `pnpm owner:ready-duplicate-guard-check`

However, future/new content still has a hard custom-content halt:

- `CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE`
- gate 4.5, before credential resolution

For actual new videos, the system needs to prove:

1. metadata/source/blob/duplicate gates are evaluated in order,
2. duplicate guard still runs before credential resolution,
3. custom content that is otherwise ready reaches the credential stub,
4. credential values are still not read,
5. actual Instagram/YouTube/Blob API calls still do not execute.

## Approved Scope

Approved:

- Update the dual-platform orchestrator so custom/non-default content no longer stops at the unconditional gate 4.5 when gates 1-4 pass.
- Keep gate 5 as a no-secret fail-closed stub:
  - `CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE`
  - no `process.env` access in the orchestrator
  - no credential value read/print/hash/copy/log
  - no lib import/call
  - no API call
- Preserve default/golden sample behavior:
  - default `t1_lifestyle_inflation/v3_2` still exits 3 with `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`
  - duplicate guard remains before credential resolution
  - no repost
- Update fixture/docs/guard to reflect the new custom-content live state:
  - custom content can reach credential gate if readiness gates pass
  - actual credential/API execution remains disabled in this slice
- Add/adjust static guard tests using temp/probe manifests only if needed. Probe artifacts must be outside the repo or OS temp and cleaned up.
- Append concise evidence to `_ai/CLAUDE_REPORT.md`.

Allowed files:

- `scripts/run-dual-platform-final-publish-orchestrator.mjs`
- `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json`
- `scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
- `docs/dual-platform-final-publish-orchestrator.md`
- `_ai/CLAUDE_REPORT.md`

Only touch another file if a direct import/check break proves it is necessary, and report why.

## Required Behavior

### Default evidence content

Must remain unchanged:

- `--preflight` default: `preflightOk:true`
- `--live` default: exit 3
- status: `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`
- `credentialResolutionReached:false`
- `actualApiCallReached:false`
- all side-effect counters 0

### Custom content with missing source or missing readiness

Must still fail closed at the earliest correct gate:

- missing source -> source-file gate blocks before credential
- bad/missing metadata -> metadata gate blocks before credential
- bad/missing blob evidence -> blob evidence gate blocks before credential

### Custom content with gates 1-4 passing

Use a temp/probe custom content manifest in the guard if needed. It may reuse existing local mp4 files and shape-valid no-network blob evidence, but must not call public HEAD or Blob SDK.

Expected live behavior for that probe:

- `--live --content-unit <probe>` exits 4
- status: `CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE`
- `credentialResolutionReached:true`
- `credentialValuesAccessed:false`
- `credentialValuesResolved:false`
- `actualApiCallReached:false`
- all side-effect counters 0
- gate trace shows:
  - metadata gate evaluated before source/blob/duplicate
  - source file gate evaluated before blob
  - blob evidence gate evaluated before duplicate
  - duplicate guard evaluated before credential
  - credential stub evaluated
  - actual API call not reached

The old unconditional custom halt must not be the final status for otherwise-ready custom content.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not print, hash, copy, log, stage, or commit token values.
- Do not read `process.env` in the orchestrator.
- Do not import or call live client functions from the orchestrator.
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
3. `node --check scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
4. Fixture JSON parse for `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json`
5. `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
6. Targeted regressions:
   - `node scripts/check-dual-platform-content-unit-final-readiness-static.mjs`
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run local generation pipeline.
Do not run ffmpeg/ffprobe/deploy/API/network.

## Definition Of Done

All must be true:

1. Default golden sample duplicate block behavior is unchanged.
2. Custom content with incomplete readiness still fails closed before credential.
3. Custom content probe with readiness gates passing reaches credential stub and exits with `CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE`.
4. Credential values are not accessed and actual API calls are not reached.
5. Guards/docs/fixture describe the new state without implying live publish is enabled.
6. No env/secret access, Blob mutation, Instagram publish, YouTube upload, deploy, dependency/lockfile change, media generation, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- behavior summary for default/custom missing/custom ready-probe
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
