# HANDOFF_NOW

전체프로젝트 진행률 : 약 92%

## Current Task

- Task ID: `youtube-shorts-letterbox-variant-renderer-dryrun-v1`
- Latest accepted checkpoint: `bc3e1a0 chore(media): supersede r2 provider strategy`
- Purpose: implement the local YouTube Shorts letterbox variant renderer skeleton and dry-run command planner, without executing video rendering yet.

## Current Direction

The current active architecture is:

- Cloudflare/R2 suspended by Owner preference.
- Instagram:
  - Uses Vercel Blob public direct URL.
  - Needs public unauthenticated HTTPS `video_url`.
- YouTube:
  - Uses YouTube Data API direct file upload.
  - Does not use Blob-hosted public URL.
  - Needs a separate platform render variant.
- One content item:
  - produces `instagram_reels_full_frame_1080x1920`;
  - produces `youtube_shorts_letterbox_1080x1920`;
  - creates two publish jobs.
- Daily baseline:
  - 1 content/day = 2 publish jobs/day.
  - 2 contents/day = 4 publish jobs/day.

## YouTube Variant Requirement

The YouTube Shorts variant must:

- produce final 1080x1920 vertical mp4;
- use a black canvas/background;
- place the main/source video centered;
- create visible black top/bottom space;
- preserve aspect ratio, accepting side gutters if needed rather than stretching;
- avoid important text being placed in YouTube UI risk zones in future render profiles;
- not require Vercel Blob/public URL.

Recommended initial transform profile:

- Canvas: 1080x1920 black.
- Content box: 864x1536, centered.
- Top/bottom margin: about 192px each when source is 9:16.
- Side margin: about 108px each for aspect-ratio preservation.
- Video codec target: H.264/yuv420p, faststart.
- Audio: preserve/re-encode to AAC if present.

## Approved Scope

Claude Code may implement no-live/no-upload local tooling only:

1. Add a new renderer/planner script:
   - `scripts/create-youtube-shorts-letterbox-variant.mjs`
   - CLI behavior:
     - accepts `--input <mp4>` and `--output <mp4>`;
     - supports `--dry-run` or defaults to dry-run/no-write;
     - prints the deterministic ffmpeg plan/command without executing by default;
     - optionally supports `--run`, but this slice must not execute `--run`;
     - validates target profile constants: 1080x1920 canvas, 864x1536 content box, black background, centered placement;
     - validates output path safety if `--run` is ever used in a later approved slice;
     - never reads env/secrets.

2. Add a render profile fixture:
   - `scripts/fixtures/youtube_shorts_letterbox_render_profile.v1.json`
   - Must encode the same profile constants and no-live constraints.

3. Add a static guard:
   - `scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`
   - Must validate script/fixture/docs contract and fail closed if:
     - final canvas is not 1080x1920;
     - content box does not create top/bottom black space;
     - black background is missing;
     - centered placement is missing;
     - YouTube is routed through Blob/public URL;
     - Instagram full-frame variant is modified or conflated;
     - script executes ffmpeg by default instead of dry-run;
     - env/secret/network/upload/deploy/YouTube API/Instagram API behavior appears;
     - dependencies/lockfiles would be needed.

4. Add concise docs:
   - `docs/youtube-shorts-letterbox-variant-renderer.md`
   - Explain:
     - why YouTube gets a separate variant;
     - why the source is scaled into a black canvas;
     - why side gutters may exist to preserve aspect ratio;
     - that this is local post-processing only, not YouTube upload.

5. Append `_ai/CLAUDE_REPORT.md` with concise evidence.

6. Update `_ai/HANDOFF_NOW.md` only if needed.

## Read Only Source Files

Read the minimum useful set:

- `AGENTS.md`
- `_ai/HANDOFF_NOW.md`
- `docs/dual-platform-variant-publish-architecture.md`
- `scripts/fixtures/dual_platform_variant_publish_architecture.v1.json`
- `package.json`
- Existing local ffmpeg helper scripts only as needed for style/patterns:
  - `scripts/audit-money-shorts-post-render-artifact-v1.mjs`
  - `scripts/mux-local-tts-audio-into-visual-mp4.mjs`

Do not read or modify protected dirty render script:

- `scripts/render-golden-sample-visual-only-v1.mjs`

## Forbidden Actions

- Do not execute ffmpeg to create a new mp4 in this slice.
- Do not render/mux/TTS/image/browser regenerate media.
- Do not upload anything.
- Do not call YouTube API/OAuth or Instagram API.
- Do not provision Vercel Blob, create tokens, read/write env/secrets, or access `.env.local`.
- Do not deploy, change DNS/domain, or touch Cloudflare/R2/wrangler.
- Do not change dependencies/lockfiles/fonts.
- Do not commit/push.
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
2. Syntax:
   - `node --check scripts/create-youtube-shorts-letterbox-variant.mjs`
   - `node --check scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`
3. JSON parse:
   - `scripts/fixtures/youtube_shorts_letterbox_render_profile.v1.json`
4. Dry-run/no-write script smoke:
   - run the new script in a mode that prints an example/plan without needing an existing mp4 and without writing output;
   - if the script cannot support no-input example mode, add one.
5. Static guard:
   - `node scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`
6. Regressions:
   - `node scripts/check-dual-platform-variant-publish-architecture-static.mjs`
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`
   - `node scripts/check-media-provider-decision-packet-static.mjs`

Do not run full build unless syntax/import issues require it.

## Definition Of Done

- A new YouTube letterbox variant renderer/planner script exists.
- It defaults to dry-run/no-write and does not execute ffmpeg in this slice.
- It encodes 1080x1920 black canvas, centered 864x1536 content box, visible top/bottom black space.
- It keeps YouTube direct-file-upload architecture separate from Blob/public URL.
- It does not touch protected dirty render files.
- Static guard and targeted regressions pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- renderer/planner summary
- changed files
- dry-run example/result
- checks/results
- live/media side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 92%`
