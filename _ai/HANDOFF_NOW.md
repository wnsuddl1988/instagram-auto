# HANDOFF_NOW

전체프로젝트 진행률 : 약 92%

## Current Task

- Task ID: `vercel-blob-instagram-integration-packet-v1`
- Latest accepted checkpoint: `0d3f34d test(media): add youtube shorts letterbox render test`
- Owner approval: `APPROVE_VERCEL_BLOB_PREPARE_INTEGRATION_PACKET`
- Purpose: prepare a no-secret/no-provisioning integration approval packet for using Vercel Blob public direct URLs as the Instagram `video_url` source.

## Active Architecture

- Cloudflare/R2 is suspended by Owner preference.
- Instagram:
  - Active public media URL provider: Vercel Blob public direct URL.
  - Needs public unauthenticated HTTPS `video_url`.
  - Uses the Instagram/full-frame 1080x1920 variant only.
- YouTube:
  - Uses YouTube Data API direct file upload.
  - Does not use Blob/public URL.
  - Uses a separate 1080x1920 letterbox variant.
- One content item produces two render variants and two publish jobs.

## Official Vercel Blob Facts Confirmed By Codex

Use these as current official-doc evidence in the packet. Do not do additional live/network lookups unless strictly needed.

- Vercel Blob is available on all plans.
- Public Blob store read access: anyone with the URL; delivery is via direct blob URL.
- Add/remove/write access requires a valid token.
- Store access mode is chosen at creation time and cannot be changed afterward; Instagram needs a public store, not private.
- Official env variable created for connected projects: `BLOB_READ_WRITE_TOKEN`.
- Vercel recommends `@vercel/blob` SDK usage such as `put(pathname, body, { access: 'public' })`.
- Vercel Function request body limit is 4.5 MB for server uploads through an app route; this project’s 20-30 MB mp4 objects should not be routed through a Next.js upload endpoint that receives the file body.
- Current project `package.json` does not include `@vercel/blob`; any future SDK integration requires explicit dependency/lockfile approval.
- Hobby included Blob resources from official pricing page: 1 GB storage/month, first 10,000 simple operations, first 2,000 advanced operations, first 10 GB Blob Data Transfer. Hobby is free within limits but Blob access stops if limits are exceeded.

Official docs checked by Codex:

- `https://vercel.com/docs/vercel-blob`
- `https://vercel.com/docs/vercel-blob/server-upload`
- `https://vercel.com/docs/vercel-blob/usage-and-pricing`

## Approved Scope

Claude Code may prepare a no-live decision/integration packet only:

1. Add docs:
   - `docs/vercel-blob-instagram-integration-packet.md`
   - Must explain:
     - why Instagram needs Blob/public URL while YouTube does not;
     - why the Blob store must be public;
     - why the future uploader should upload from the local/worker automation path, not through a Vercel Function body route;
     - proposed object key/path scheme;
     - retention and cleanup policy;
     - cost/free-tier guard assumptions;
     - future approval sequence and rollback;
     - forbidden actions in this slice.

2. Add machine-readable fixture:
   - `scripts/fixtures/vercel_blob_instagram_integration_packet.v1.json`
   - Must encode:
     - provider: `vercel_blob_public_direct_url`;
     - platform: Instagram only;
     - YouTube does not use Blob/public URL;
     - proposed store access mode: public;
     - env names only, especially `BLOB_READ_WRITE_TOKEN`;
     - deterministic object key contract;
     - `allowOverwrite:false`, no random suffix for deterministic URLs, immutable path/versioning;
     - retention/cost guards;
     - verifier gates inherited from the Instagram public URL runner;
     - future approval gates;
     - forbidden behavior.

3. Add dependency-free static guard:
   - `scripts/check-vercel-blob-instagram-integration-packet-static.mjs`
   - Node built-ins only.
   - Must fail closed if:
     - Blob is routed to YouTube;
     - store access mode is private;
     - `BLOB_READ_WRITE_TOKEN` env name is missing or contains a secret-like value;
     - dependency/lockfile changes are implied as already approved;
     - upload/provisioning/env write/live URL check/Instagram `--arm` is allowed in this slice;
     - object keys are random-only or overwrite-based instead of deterministic immutable paths;
     - retention/cost guards are missing;
     - public URL verifier gates are missing.

4. Append `_ai/CLAUDE_REPORT.md` with concise evidence.

5. Update `_ai/HANDOFF_NOW.md` only if execution reality differs materially from this handoff.

## Proposed Packet Defaults

These defaults are recommendations to encode unless local evidence gives a better no-live reason:

- Proposed Blob store name: `instagram-auto-instagram-media`
- Access mode: public
- Official write token env name: `BLOB_READ_WRITE_TOKEN`
- Future object key pattern:
  - `instagram/reels/{contentId}/{variantId}/{version}/{sha256_12}.mp4`
- Current Instagram variant ID:
  - `instagram_reels_full_frame_1080x1920`
- Do not use Blob for:
  - `youtube_shorts_letterbox_1080x1920`
- Upload behavior for future code:
  - local/worker-side SDK upload from the produced mp4 path;
  - `access: "public"`;
  - no overwrite;
  - deterministic immutable path;
  - verify returned URL before Instagram upload.
- Retention policy:
  - keep Instagram Blob object long enough for Meta fetch/retry;
  - default target: 1-7 days;
  - delete only after publish success and a safe delay, under a separate approved cleanup path.
- Size/cost guard:
  - Instagram Blob object target 20-30 MB;
  - fail closed above a configured cap, proposed cap 35 MB unless Owner changes it;
  - no long-term video archive in Blob by default.

## Forbidden Actions

- Do not create or provision a Vercel Blob store.
- Do not create/read/write tokens or secrets.
- Do not run `vercel env pull`, write env vars, or access `.env.local`.
- Do not install `@vercel/blob` or change dependencies/lockfiles.
- Do not upload objects.
- Do not perform live public URL checks.
- Do not call Instagram API/`--arm`.
- Do not call YouTube API/OAuth or upload to YouTube.
- Do not deploy or change DNS/domain.
- Do not run render/mux/TTS/image/browser regeneration.
- Do not run ffmpeg or generate media.
- Do not commit/push.
- Do not modify protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/`
  - unrelated `C:\tmp`

## Read-Only Context

Read the minimum useful set:

- `AGENTS.md`
- `_ai/HANDOFF_NOW.md`
- `package.json`
- `docs/dual-platform-variant-publish-architecture.md`
- `scripts/fixtures/dual_platform_variant_publish_architecture.v1.json`
- `docs/media-provider-decision-packet.md`
- `scripts/fixtures/media_provider_decision_packet.v1.json`
- `docs/public-media-url-strategy.md`
- `scripts/fixtures/stable_public_media_url_strategy.v1.json`
- `scripts/run-golden-sample-v3-2-instagram-upload-once.mjs`
- `scripts/fixtures/golden_sample_v3_2_live_instagram_upload_run_plan.t1_lifestyle_inflation.v1.json`

Do not read broad env/secret files.

## Required Checks

1. `git status -sb`
2. Syntax:
   - `node --check scripts/check-vercel-blob-instagram-integration-packet-static.mjs`
3. JSON parse:
   - `scripts/fixtures/vercel_blob_instagram_integration_packet.v1.json`
4. Static guard:
   - `node scripts/check-vercel-blob-instagram-integration-packet-static.mjs`
5. Targeted regressions:
   - `node scripts/check-dual-platform-variant-publish-architecture-static.mjs`
   - `node scripts/check-media-provider-decision-packet-static.mjs`
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`
   - `node scripts/check-youtube-shorts-letterbox-render-test-result-static.mjs`

Do not run full build unless syntax/import issues require it.

## Definition Of Done

- A Vercel Blob Instagram integration packet exists in docs + fixture.
- The packet is explicitly no-secret/no-provisioning/no-upload/no-live.
- It locks Instagram=Blob public direct URL and YouTube=direct upload/no Blob.
- It identifies `BLOB_READ_WRITE_TOKEN` by name only and stores no secret values.
- It states future dependency/env/store/upload/live/Instagram arm gates separately.
- It includes retention/cost guards and deterministic immutable key policy.
- Static guard and targeted regressions pass.
- `_ai/CLAUDE_REPORT.md` records concise evidence.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- packet summary
- changed files
- official-doc basis used
- proposed defaults
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 92%`
