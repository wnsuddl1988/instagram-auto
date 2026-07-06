# HANDOFF_NOW

전체프로젝트 진행률 : 약 92%

## Current Task

- Task ID: `dual-platform-variant-publish-architecture-no-live-v1`
- Owner decision:
  - Cloudflare/R2 is not preferred and should remain suspended.
  - Proceed with a Vercel Blob based Instagram public URL path.
  - YouTube must be included as a first-class publish target, not deferred as an unrelated later system.
  - One content item produces platform-specific render variants:
    - Instagram Reels: current/full-frame vertical format.
    - YouTube Shorts: separate 1080x1920 mp4 with black top/bottom background space and the main video centered.
- Owner usage assumption:
  - 1 content item/day means 2 publish jobs/day: Instagram + YouTube.
  - 2 content items/day means 4 publish jobs/day: Instagram + YouTube for each content item.
  - Expected mp4 size target: about 20-30 MB per rendered variant.
  - Free-first media storage rule: use Vercel Blob only where a public URL is needed, keep retention short, and do not long-term archive mp4 files unless later approved.

## Current Baseline

- Latest checkpoint: `81f6b91 chore(media): record r2 bucket provisioning blocked result`
- Branch reported ahead 191, not pushed.
- Cloudflare/R2 status:
  - No bucket was created.
  - No DNS/custom domain/token/env/deploy/object upload/live check happened.
  - R2 path is now suspended by Owner preference.
- Existing public media strategy before this task:
  - Sustained public media target was being explored under `media.buildgongjakso.com`.
  - R2 had been primary due to custom-domain fit, but this is now suspended.
  - Vercel Blob is now the preferred simple/free-first candidate for Instagram public URL needs.

## Approved Scope

Claude Code may do only no-live architecture documentation/fixture/guard work.

Read minimal source of truth:

- `AGENTS.md`
- `_ai/HANDOFF_NOW.md`
- `docs/public-media-url-strategy.md`
- `scripts/fixtures/stable_public_media_url_strategy.v1.json`
- `docs/media-provider-decision-packet.md`
- `scripts/fixtures/media_provider_decision_packet.v1.json`
- `docs/r2-bucket-provisioning-result.md`
- `scripts/fixtures/r2_bucket_provisioning_result.v1.json`

Use official docs only for current platform/API facts:

- Vercel Blob overview/pricing/public storage.
- YouTube Data API `videos.insert` media upload behavior.
- YouTube Shorts format/duration guidance.
- Instagram facts only from existing project code/docs unless an official Meta doc check is truly needed; do not do live API calls.

## Target Architecture To Capture

The decision packet must define this operating model:

1. Content unit:
   - One generated content item owns the script, audio, captions, scene manifest, metadata, and publish plan.
2. Render variants:
   - `instagram_reels_full_frame_1080x1920`
     - Existing/current visual style.
     - Full-frame vertical mp4.
     - Intended for Instagram Reels.
   - `youtube_shorts_letterbox_1080x1920`
     - Separate platform variant.
     - Final file remains 1080x1920 vertical mp4.
     - Background is black.
     - Main video/content is centered with top/bottom black space.
     - Preserve readability and avoid important text in YouTube UI risk zones.
3. Publish jobs:
   - Instagram job:
     - Needs a public, unauthenticated HTTPS video URL.
     - Use Vercel Blob public direct URL as the free-first path.
     - Upload only the Instagram variant to Blob unless a later need says otherwise.
     - Delete/expire Blob mp4 after successful ingestion or after a short retention window, preferably 1-7 days.
   - YouTube job:
     - Uses YouTube Data API file upload from the YouTube variant.
     - Does not require the mp4 to be hosted on Vercel Blob.
     - Needs separate future OAuth/API verification and credential approval.
4. Daily capacity math:
   - 1 content/day = 2 render variants + 2 publish jobs/day.
   - 2 contents/day = 4 render variants + 4 publish jobs/day.
   - Blob storage pressure is from Instagram public URL variants only under the recommended path.
5. Free-first answer:
   - For 2 contents/day, 20-30 MB per Instagram Blob object, and 1-7 day retention, Vercel Blob Hobby free-tier operation is plausible.
   - This is not unlimited and must include hard cost/usage guards.

## Output Files

Create:

- `docs/dual-platform-variant-publish-architecture.md`
- `scripts/fixtures/dual_platform_variant_publish_architecture.v1.json`
- `scripts/check-dual-platform-variant-publish-architecture-static.mjs`

Append:

- `_ai/CLAUDE_REPORT.md`

Update only if needed:

- `_ai/HANDOFF_NOW.md`

## Required Decision Packet Content

The docs/fixture must include:

- `cloudflareR2Status`: suspended by Owner preference, no bucket created.
- `primaryPublicUrlProviderForInstagram`: Vercel Blob direct public URL.
- `youtubeUploadMode`: direct media/file upload, not Blob-hosted URL.
- `contentToVariantToPublishJobModel`: one content item to two variants to two publish jobs.
- `dailyCapacityBaseline`: 1 content/day -> 2 publishes; 2 contents/day -> 4 publishes.
- `instagramVariantSpec`.
- `youtubeVariantSpec`, including black top/bottom background space and centered content.
- `freeTierFeasibility`, including 20-30 MB variant size and 1-7 day retention assumptions.
- `costAndQuotaGuards`.
- `futureApprovalSequence`.
- `forbiddenBehavior`.
- Official source URLs used.

Future approval sequence must include, at minimum:

1. `APPROVE_DUAL_PLATFORM_ARCHITECTURE`
2. `APPROVE_YOUTUBE_VARIANT_RENDER_SPEC`
3. `APPROVE_VERCEL_BLOB_STORE_PROVISIONING`
4. `APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE`
5. `APPROVE_BLOB_INSTAGRAM_UPLOAD_CODE_INTEGRATION`
6. `APPROVE_YOUTUBE_OAUTH_AND_UPLOAD_INTEGRATION`
7. `APPROVE_PLATFORM_VARIANT_RENDER_TEST`
8. `APPROVE_INSTAGRAM_BLOB_URL_LIVENESS`
9. `APPROVE_YOUTUBE_UPLOAD_TEST`
10. `APPROVE_DUAL_PLATFORM_ARM`

## Forbidden Actions

- Cloudflare/R2/wrangler action.
- Vercel Blob store creation/provisioning.
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

## Static Guard Requirements

The new guard must be dependency-free and fail closed if:

- Cloudflare/R2 remains primary.
- Vercel Blob is used for YouTube when direct file upload is the recommended path.
- YouTube is missing as a first-class target.
- one content -> two variants -> two publish jobs is missing.
- 1 content/day -> 2 publish jobs or 2 contents/day -> 4 publish jobs math is missing.
- YouTube variant black top/bottom background space or centered content is missing.
- Instagram variant is not the only Blob-required variant under the recommended free-first path.
- free-tier feasibility is stated as unlimited/guaranteed.
- cost/retention guards are missing.
- token/env/provision/deploy/upload/liveness/Instagram/YouTube live actions are allowed.
- repo `public/` fallback is promoted to sustained default.
- official Vercel/YouTube source URLs are missing.

## Required Checks

1. `git status -sb`
2. `node --check scripts/check-dual-platform-variant-publish-architecture-static.mjs`
3. JSON parse:
   - `scripts/fixtures/dual_platform_variant_publish_architecture.v1.json`
4. New guard:
   - `node scripts/check-dual-platform-variant-publish-architecture-static.mjs`
5. Regressions:
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`
   - `node scripts/check-media-provider-decision-packet-static.mjs`
   - `node scripts/check-r2-bucket-provisioning-result-static.mjs`

Do not run full build unless a syntax/import problem requires it.

## Definition Of Done

- A no-live dual-platform architecture decision packet exists.
- It clearly defines platform-specific render variants.
- It clearly routes Instagram through Vercel Blob public URL and YouTube through direct file upload.
- It answers the 1 content/day and 2 contents/day publish math.
- It captures YouTube black top/bottom background/centered-video requirement.
- It keeps all live/provisioning/secret/deploy/upload actions blocked.
- Static guard and targeted regressions pass.
- `_ai/CLAUDE_REPORT.md` has concise reusable evidence.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- recommendation summary
- platform render/publish model
- free-tier answer
- changed files
- checks/results
- live side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 92%`
