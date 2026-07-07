# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `dual-platform-content-unit-manifest-parameterization-no-live-v1`
- Latest checkpoint: `b520fc5 feat(operator): add owner daily automation entrypoint`
- Owner request: continue remaining work so the project can actually be used to generate and publish videos.
- Purpose: remove the next usability bottleneck by making the dual-platform publish orchestrator and Owner entrypoint accept an external content unit manifest for future new videos. This slice is no-live/no-execute: it parameterizes and verifies the path, but does not upload, publish, generate new media, or read secrets.

## Why This Is Next

- The Owner now has a local operator entrypoint, but the publish orchestrator is still hard-coded around the already-published evidence content:
  - contentId/version: `t1_lifestyle_inflation` / `v3_2`
  - Instagram media_id: `17916511431199303`
  - YouTube videoId: `r9jhckdpC9w`
- For actual daily use, the system must accept a new content unit manifest with different `contentId`, `version`, platform source paths, metadata, and later Blob liveness evidence.
- Current evidence content must remain duplicate-guarded and must not be reposted.

## Approved Scope

Claude Code may implement no-live content unit parameterization.

Allowed edits:
- `scripts/run-dual-platform-final-publish-orchestrator.mjs`
- `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json`
- `scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
- `scripts/run-owner-daily-automation-entrypoint.mjs`
- `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- `docs/dual-platform-final-publish-orchestrator.md`
- `docs/owner-daily-automation-runbook.md`
- New fixture if useful, suggested:
  - `scripts/fixtures/dual_platform_content_unit.sample.v1.json`
- Append concise evidence to `_ai/CLAUDE_REPORT.md`

## Required Behavior

1. Add a content unit manifest contract for future new videos.
   Suggested fields:
   - `schemaVersion`
   - `contentId`
   - `version`
   - `instagramSourcePath`
   - `youtubeSourcePath`
   - optional `instagramMetadata`
   - optional `youtubeMetadata`
   - optional `blobPublicUrlLivenessEvidence`
   - optional `existingPublishedKeys`

2. Add CLI support to the publish orchestrator:
   - `--content-unit <path>` for `--dry-run` and `--preflight`.
   - Default behavior without `--content-unit` must remain current evidence content and duplicate-guarded.
   - `--live` / `--arm` with a custom non-default content unit must fail closed in this slice before credential/API gates, with a clear status such as `CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE`.
   - For the default current evidence content, `--live` must still return duplicate blocked exit `3`, with all side effect counters 0.

3. Preflight behavior for custom content:
   - Build Instagram + YouTube jobs from the manifest.
   - Apply metadata optimization gates.
   - Check source file existence as booleans only.
   - If `blobPublicUrlLivenessEvidence` is missing or invalid, preflight must report not ready/fail-closed for Instagram publish readiness.
   - No network HEAD/list/readback is allowed.
   - No env/secret access.

4. Owner entrypoint:
   - Accept `--content-unit <path>` and pass it to orchestrator `--preflight`.
   - `--status` should mention that future new videos use `--content-unit`.
   - `--duplicate-guard-check` must not run `--live` for a custom non-default manifest unless duplicate block is explicitly confirmed. For non-duplicate custom content, it should fail closed without invoking live.

5. Existing safety must remain:
   - Existing `t1_lifestyle_inflation/v3_2` evidence is retryForbidden.
   - Duplicate guard happens before credential/API.
   - No `YOUTUBE_ACCESS_TOKEN` as long-lived required env.
   - Metadata optimization gate remains mandatory.
   - Instagram hashtags/CTA and YouTube metadata rules remain intact.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not call Instagram API, YouTube API/OAuth/upload, Vercel Blob upload/list/delete/copy/head, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service.
- Do not create new media or run render/mux/TTS/image/browser/ffmpeg.
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
2. Syntax:
   - `node --check scripts/run-dual-platform-final-publish-orchestrator.mjs`
   - `node --check scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
   - `node --check scripts/run-owner-daily-automation-entrypoint.mjs`
   - `node --check scripts/check-owner-daily-automation-entrypoint-static.mjs`
3. Fixture JSON parse for any changed/new fixtures.
4. Static guards:
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
5. Smoke:
   - default: `node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight`
   - default duplicate block: `node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check`
   - custom manifest preflight: `node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight --content-unit scripts/fixtures/dual_platform_content_unit.sample.v1.json`
   - custom owner entrypoint preflight: `node scripts/run-owner-daily-automation-entrypoint.mjs --preflight --content-unit scripts/fixtures/dual_platform_content_unit.sample.v1.json`
6. Targeted regressions:
   - `node scripts/check-local-pipeline-runner-static.mjs`
   - `node scripts/check-render-manifest-local-runner-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.

## Definition Of Done

- A future new video can be represented as a content unit manifest.
- The publish orchestrator can build dry-run/preflight plans from that manifest.
- Custom content live execution remains fail-closed/no-execute in this slice.
- Existing evidence content remains duplicate-guarded and not repostable.
- Owner runbook explains how custom manifests fit into future real use.
- Guards/checks prove no env/secret/API/upload/deploy/media-generation side effects.
- No commit/push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- manifest contract summary
- default evidence behavior
- custom manifest behavior
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
