# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `content-unit-metadata-optimization-enrichment-no-live-v1`
- Latest checkpoint: `9b01b57 feat(operator): build content units from local pipeline output`
- Owner request: continue remaining work so the project can actually be used to generate and publish videos.
- Purpose: make locally generated content unit manifests pass the metadata optimization gate without manual JSON editing, while staying no-live/no-execute.

## Why This Is Next

- The local pipeline can now produce a `dual_platform_content_unit_v1` manifest from dry-run output.
- That bridge intentionally failed closed when local upload metadata lacked:
  - `instagramMetadata.captionFirstLineHook`
  - `instagramMetadata.callToAction`
  - 8-12 Instagram hashtags
- As a result, future/new content units can be generated but still report `metadataReady:false`.
- The next usability bottleneck is a deterministic metadata enrichment layer:
  - derive a short Instagram hook from existing title/caption, not from external AI;
  - add a safe save/follow CTA;
  - normalize hashtags to 8-12 category-relevant tags;
  - keep YouTube metadata/tags consistent;
  - preserve fail-closed behavior when the source metadata is too thin or malformed.

## Approved Scope

Claude Code may implement no-live metadata optimization enrichment for content unit manifest generation.

Allowed edits:
- `scripts/build-dual-platform-content-unit-from-local-summary.mjs`
- `scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
- `scripts/fixtures/dual_platform_content_unit_from_local_summary.sample.v1.json`
- `scripts/fixtures/dual_platform_content_unit_from_local_summary.sample.v1.owner_approved_upload_ready_packet.json`
- `scripts/run-owner-daily-automation-entrypoint.mjs` only if a small CLI flag/status message is needed
- `scripts/check-owner-daily-automation-entrypoint-static.mjs` only if entrypoint behavior changes
- `docs/owner-daily-automation-runbook.md`
- Append concise evidence to `_ai/CLAUDE_REPORT.md`

Do not edit local render pipeline internals unless a tiny read-only contract reference is unavoidable. Prefer enriching in the content unit builder so existing generation behavior remains stable.

## Required Behavior

1. Add deterministic metadata enrichment in the content unit builder.
   - It must use only already-present local summary/upload packet fields.
   - It must not call OpenAI, browser, network, API, env, or any external service.
   - It must not create new media.

2. Instagram metadata rules:
   - `captionFirstLineHook` must be non-empty.
   - Prefer deriving hook from an existing title/caption first line.
   - Keep hook concise and Korean-reader friendly.
   - Do not add unrelated trend claims.
   - `callToAction` must be non-empty and should encourage save/follow/comment without misleading claims.
   - Hashtags must normalize to 8-12 unique relevant tags.
   - Preserve existing relevant hashtags first, then add safe category/default tags only as needed.
   - Reject/fail closed if metadata cannot be made safe enough.

3. YouTube metadata rules:
   - Keep existing title/description/tags if present.
   - Ensure tags remain relevant and not unrelated viral bait.
   - Do not require `YOUTUBE_ACCESS_TOKEN`.

4. Readiness behavior:
   - For the checked-in sample fixture, metadata enrichment should make `metadataReady:true` if enough source metadata exists after deterministic normalization.
   - `contentUnitPreflightExpectedReady` must still require all readiness gates:
     - `instagramSourceReady`
     - `youtubeSourceReady`
     - `metadataReady`
     - `blobLivenessEvidenceReady`
   - Therefore sample preflight may still be false because source files or Blob evidence are missing. That is expected.

5. Guard behavior:
   - Static guard must prove:
     - no `process.env` / `.env` / secret access;
     - no fetch/axios/googleapis/@vercel/blob/child_process/ffmpeg;
     - Instagram hook/CTA are produced for the sample;
     - Instagram hashtag count is 8-12 after enrichment;
     - unrelated trend tags are not introduced;
     - `contentUnitPreflightExpectedReady` still includes `blobLivenessEvidenceReady`;
     - source/Blob missing still fail closed even if metadataReady is true.

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
   - `node --check scripts/build-dual-platform-content-unit-from-local-summary.mjs`
   - `node --check scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
   - if touched: `node --check scripts/run-owner-daily-automation-entrypoint.mjs`
   - if touched: `node --check scripts/check-owner-daily-automation-entrypoint-static.mjs`
3. Fixture JSON parse for any changed fixtures.
4. New/updated bridge guard:
   - `node scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
5. Targeted regressions:
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run the full local generation pipeline if it would create new media; use fixture/sample inputs for smoke.

## Definition Of Done

- Generated content unit manifests no longer require manual hook/CTA/hashtag JSON editing when enough local metadata exists.
- The sample bridge output has `metadataReady:true`.
- Overall preflight readiness still fails closed when sources or Blob evidence are missing.
- Guards prove no env/secret/API/upload/deploy/media-generation side effects.
- No commit/push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- metadata enrichment summary
- sample manifest/build-summary result
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
