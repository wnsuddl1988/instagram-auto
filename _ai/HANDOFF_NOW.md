# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `local-pipeline-content-unit-manifest-bridge-no-live-v1`
- Latest checkpoint: `fbf6b58 feat(media): parameterize dual platform content units`
- Owner request: continue remaining work so the project can actually be used to generate and publish videos.
- Purpose: connect the local generation dry-run pipeline outputs to the new dual-platform content unit manifest contract, so future new videos do not require hand-written manifests. This slice is no-live/no-execute for external services.

## Why This Is Next

- The dual-platform orchestrator now accepts `--content-unit <manifest.json>`.
- The Owner entrypoint now knows how to pass `--content-unit`.
- But the current local generation pipeline only produces local run summaries and upload-ready dry-run packets; it does not yet produce a content unit manifest compatible with the publish orchestrator.
- Therefore the next bottleneck is bridging:
  - local full-frame mp4 output → `instagramSourcePath`
  - platform upload metadata → `instagramMetadata` / `youtubeMetadata`
  - YouTube letterbox path placeholder or explicit path → `youtubeSourcePath`
  - optional Blob liveness evidence → `blobPublicUrlLivenessEvidence`

## Approved Scope

Claude Code may implement a no-live bridge from local pipeline output to a content unit manifest.

Allowed edits:
- `scripts/run-local-money-shorts-from-render-manifest.mjs`
- `scripts/run-local-money-shorts-pipeline-dry-run.mjs`
- `scripts/run-owner-daily-automation-entrypoint.mjs`
- `scripts/check-local-pipeline-runner-static.mjs`
- `scripts/check-render-manifest-local-runner-static.mjs`
- `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- `docs/owner-daily-automation-runbook.md`
- New script if useful, suggested:
  - `scripts/build-dual-platform-content-unit-from-local-summary.mjs`
- New static guard if useful, suggested:
  - `scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
- New fixture if useful, suggested:
  - `scripts/fixtures/dual_platform_content_unit_from_local_summary.sample.v1.json`
- Append concise evidence to `_ai/CLAUDE_REPORT.md`

## Required Behavior

1. Add a builder that can create a `dual_platform_content_unit_v1` manifest from local pipeline outputs.
   Suggested input:
   - `--summary <render-manifest-local-run-summary.local-mock.json>` or `--pipeline-summary <pipeline-run-summary.local-mock.json>`
   - `--out-dir <outside-repo path>`
   - optional `--content-id <id>`
   - optional `--version <version>`
   - optional `--youtube-source <mp4 path>`
   - optional `--blob-liveness-result <json path>`

2. The builder should:
   - read only local non-secret JSON outputs from the dry-run pipeline;
   - derive `instagramSourcePath` from the generated full-frame/tts-mux mp4;
   - derive `instagramMetadata` and `youtubeMetadata` from the upload-ready packet or upload payload platform metadata;
   - set `youtubeSourcePath` from `--youtube-source` if provided, otherwise create a deterministic placeholder path and mark/report that the YouTube letterbox source is not ready yet;
   - include `blobPublicUrlLivenessEvidence` only if an explicit local result JSON is provided and shape-valid; do not do any network request;
   - write a manifest file under the provided out-dir;
   - write a small summary JSON with readiness booleans:
     - `instagramSourceReady`
     - `youtubeSourceReady`
     - `metadataReady`
     - `blobLivenessEvidenceReady`
     - `contentUnitPreflightExpectedReady`

3. Update the Owner entrypoint:
   - `--dry-run` should surface the generated content unit manifest path if this bridge runs as part of the dry-run flow, or expose a clear command/flag to build it from the latest summary.
   - Accept a flag such as `--build-content-unit` or a mode such as `--content-unit-from-summary`, whichever is simpler and safer.
   - Do not make live execution easier; this is still no-live.

4. Update docs:
   - Owner runbook should explain the practical sequence:
     1. run local dry-run,
     2. build content unit manifest,
     3. generate/attach YouTube letterbox source in a later approved local media step,
     4. attach Blob liveness evidence after approved Blob upload/liveness,
     5. run `--preflight --content-unit <manifest>`.
   - Make clear that this slice does not upload/publish/generate new external media.

5. Existing safety must remain:
   - no `.env.local` / secret access;
   - no API/OAuth/upload/deploy;
   - no ffmpeg/media generation in this slice;
   - out-dir must be outside repo root;
   - generated manifests/summaries should go under out-dir, not repo, unless they are static fixtures.

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
2. Syntax for any changed/new JS/MJS guard/runner files.
3. JSON parse for any changed/new fixtures.
4. New bridge guard, if added:
   - `node scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
5. Existing guards:
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
   - `node scripts/check-local-pipeline-runner-static.mjs`
   - `node scripts/check-render-manifest-local-runner-static.mjs`
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
6. Smoke:
   - Build a content unit manifest from a small checked-in/sample JSON fixture or an existing gitignored local summary if already present.
   - Then run:
     - `node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight --content-unit <generated-manifest>`
   - This preflight may be not-ready/fail-closed if YouTube source/Blob liveness is missing; that is acceptable if clearly reported.

Do not run full build unless a focused syntax/import issue requires it.
Do not run the full local generation pipeline if it would create new media; use fixture/sample inputs for smoke unless the files already exist and no media generation command is needed.

## Definition Of Done

- A content unit manifest can be generated from local pipeline output data, not hand-written.
- Owner has a clear command or mode to build that manifest.
- The generated manifest can be passed to the dual-platform orchestrator `--preflight --content-unit`.
- Missing YouTube letterbox source or Blob liveness evidence fails closed with clear readiness booleans.
- No env/secret/API/upload/deploy/media-generation/dependency/commit/push side effects.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- bridge command(s)
- generated manifest contract summary
- smoke/preflight result
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
