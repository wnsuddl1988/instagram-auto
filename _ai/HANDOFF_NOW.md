# HANDOFF_NOW

전체프로젝트 진행률 : 약 92%

## Current Task

- Task ID: `provider-strategy-supersession-for-dual-platform-v1`
- Latest accepted checkpoint: `14d5f76 feat(media): define dual platform publish architecture`
- Purpose: align the older media-provider/stable-public-media strategy contracts with the newly accepted dual-platform direction so future implementation cannot accidentally follow the obsolete R2-primary path.

## Current Direction

The current Owner-approved operating direction is:

- Cloudflare/R2 is suspended by Owner preference.
- Instagram uses Vercel Blob public direct URL for the public `video_url` path.
- YouTube uses YouTube Data API direct file upload and does not need Blob-hosted public URL.
- One content item produces two render variants:
  - Instagram Reels: current/full-frame vertical 1080x1920.
  - YouTube Shorts: separate 1080x1920 mp4 with black top/bottom background space and centered main content.
- One content item produces two publish jobs:
  - Instagram job.
  - YouTube job.
- Daily baseline:
  - 1 content/day = 2 publish jobs/day.
  - 2 contents/day = 4 publish jobs/day.
- Free-first assumption:
  - Instagram Blob object size target: about 20-30 MB.
  - Blob retention: preferably 1-7 days.
  - No long-term mp4 archive unless later approved.

## Why This Slice Exists

The project now has a newer dual-platform architecture packet:

- `docs/dual-platform-variant-publish-architecture.md`
- `scripts/fixtures/dual_platform_variant_publish_architecture.v1.json`
- `scripts/check-dual-platform-variant-publish-architecture-static.mjs`

But older artifacts still encode a prior R2-primary decision:

- `docs/media-provider-decision-packet.md`
- `scripts/fixtures/media_provider_decision_packet.v1.json`
- `scripts/check-media-provider-decision-packet-static.mjs`
- `docs/public-media-url-strategy.md`
- `scripts/fixtures/stable_public_media_url_strategy.v1.json`
- `scripts/check-stable-public-media-url-strategy-static.mjs`

This slice is a no-live supersession patch so these contracts stop treating R2 as the current primary. Keep useful historical evidence, but make the active contract point to the dual-platform architecture.

## Approved Scope

Claude Code may modify only no-live docs/fixtures/guards needed to express the supersession:

1. `docs/media-provider-decision-packet.md`
   - Mark previous R2-primary recommendation as historical/superseded.
   - Active recommendation must point to dual-platform architecture:
     - Instagram public URL provider = Vercel Blob public direct URL.
     - YouTube upload mode = direct file upload, no Blob public URL needed.
   - State Cloudflare/R2 suspended by Owner preference.

2. `scripts/fixtures/media_provider_decision_packet.v1.json`
   - Preserve historical evidence where useful.
   - Add/adjust active decision fields so the machine-readable current contract is no longer R2-primary.
   - Must reference `scripts/fixtures/dual_platform_variant_publish_architecture.v1.json`.

3. `scripts/check-media-provider-decision-packet-static.mjs`
   - Update guard expectations so current active primary is dual-platform:
     - Instagram = Vercel Blob public direct URL.
     - YouTube = direct file upload.
     - R2 = suspended, not current primary.
   - Keep fail-closed checks for no provisioning/env/deploy/upload/live side effects.
   - Add mutants that fail if R2 is promoted back to active primary or YouTube is routed through Blob.

4. `docs/public-media-url-strategy.md`
   - Clarify that `media.buildgongjakso.com`/R2 strategy is superseded for current execution.
   - Current Instagram public URL path = Vercel Blob direct URL.
   - YouTube does not use this public URL layer.
   - repo `public/` fallback remains one-off/manual only.

5. `scripts/fixtures/stable_public_media_url_strategy.v1.json`
   - Align active strategy fields with the dual-platform architecture.
   - Keep verifier gate requirements for Instagram Blob URL.
   - Do not require `media.buildgongjakso.com` as the current active host.

6. `scripts/check-stable-public-media-url-strategy-static.mjs`
   - Update guard expectations accordingly:
     - Instagram public URL path is Vercel Blob direct URL.
     - YouTube direct upload does not require public URL.
     - R2/media custom domain is historical/superseded, not current default.
     - repo `public/` fallback cannot become sustained default.

7. `_ai/CLAUDE_REPORT.md`
   - Append concise evidence.

8. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

## Forbidden Actions

- Cloudflare/R2/wrangler action.
- Vercel Blob provisioning/store creation.
- token/env/secret read/write.
- `.env.local` access or broad env parsing.
- deploy/domain/DNS changes.
- object upload.
- public URL liveness check.
- Instagram upload or `--arm`.
- YouTube upload/API/OAuth execution.
- render/mux/TTS/image/browser regeneration.
- dependency/lockfile/font changes.
- commit/push.
- Protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/`
  - unrelated `C:\tmp`

## Required Checks

1. `git status -sb`
2. Syntax checks:
   - `node --check scripts/check-media-provider-decision-packet-static.mjs`
   - `node --check scripts/check-stable-public-media-url-strategy-static.mjs`
3. JSON parses:
   - `scripts/fixtures/media_provider_decision_packet.v1.json`
   - `scripts/fixtures/stable_public_media_url_strategy.v1.json`
4. Updated guards:
   - `node scripts/check-media-provider-decision-packet-static.mjs`
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`
5. Regression:
   - `node scripts/check-dual-platform-variant-publish-architecture-static.mjs`
   - `node scripts/check-r2-bucket-provisioning-result-static.mjs`

Do not run full build unless a syntax/import problem requires it.

## Definition Of Done

- Older R2-primary provider/media strategy artifacts clearly show that R2 is historical/superseded.
- Active current contract is:
  - Instagram = Vercel Blob public direct URL.
  - YouTube = direct file upload.
  - R2 = suspended by Owner preference.
- Guards fail closed if R2 returns as active primary, YouTube is routed through Blob, or live/provisioning/secret/deploy actions are allowed.
- Targeted checks pass.
- `_ai/CLAUDE_REPORT.md` records concise evidence.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- summary of supersession
- changed files
- checks/results
- live side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 92%`
