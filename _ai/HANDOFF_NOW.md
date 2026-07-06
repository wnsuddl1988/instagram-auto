# HANDOFF_NOW

전체프로젝트 진행률 : 약 92%

## Current Task

- Task ID: `youtube-shorts-letterbox-variant-render-test-v1`
- Latest accepted checkpoint: `0bd1bf9 feat(media): add youtube shorts letterbox planner`
- Owner approval: `APPROVE_PLATFORM_VARIANT_RENDER_TEST`
- Purpose: use one existing local Instagram/full-frame mp4 as input and create/verify one local YouTube Shorts 1080x1920 letterbox mp4 test artifact.

## Active Architecture

- Cloudflare/R2 is suspended by Owner preference.
- Instagram uses Vercel Blob public direct URL for public unauthenticated `video_url`.
- YouTube uses YouTube Data API direct file upload and does not use Blob/public URL.
- One content item produces two render variants:
  - `instagram_reels_full_frame_1080x1920`
  - `youtube_shorts_letterbox_1080x1920`
- This task tests only the local YouTube variant conversion. It does not upload or publish anything.

## Approved Input And Output

Use this exact existing local source mp4:

- `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- Expected source byte size from existing fixtures: `20294549`

Write only under this new project output subfolder:

- `output/youtube-shorts-letterbox-render-test-v1/`

Expected output mp4:

- `output/youtube-shorts-letterbox-render-test-v1/golden_sample_t1_lifestyle_inflation_youtube_letterbox_v1.mp4`

Allowed local QA artifacts in the same output subfolder:

- source/output `ffprobe` JSON or text
- a render-test result JSON
- concise logs needed to prove exactly one conversion

Do not write to `C:\tmp`; it is read-only input for this task.

## Required Letterbox Profile

The output variant must:

- be a final 1080x1920 vertical mp4;
- use a black canvas/background;
- place the source video centered;
- create visible black top/bottom space for YouTube Shorts;
- preserve aspect ratio, accepting side gutters instead of stretching;
- target H.264/yuv420p with faststart;
- preserve or re-encode audio to AAC if the source has audio.

Use the existing dry-run profile as the contract:

- Canvas: `1080x1920`
- Content box: `864x1536`, centered
- Transform filter:
  - `scale=w=864:h=1536:force_original_aspect_ratio=decrease`
  - `pad=w=1080:h=1920:x=(ow-iw)/2:y=(oh-ih)/2:color=black`

Because this approval limits ffmpeg to one conversion execution, do not run extra ffmpeg frame extraction or visual sampling commands. Verify by:

- `ffprobe` source dimensions/duration/audio;
- one captured ffmpeg command/process for the conversion;
- `ffprobe` output dimensions/codec/duration/audio;
- deterministic calculation that a 1080x1920 source scaled to 864x1536 inside 1080x1920 creates about 192px top/bottom margins and 108px side margins.

## Approved Scope

Claude Code may:

1. Add a narrow one-shot render test runner, preferably:
   - `scripts/run-youtube-shorts-letterbox-render-test-once.mjs`
   - It may use Node built-ins only.
   - It may call `ffprobe` for verification.
   - It may call `ffmpeg` exactly once for the conversion.
   - It must require an explicit CLI approval token such as `--approval APPROVE_PLATFORM_VARIANT_RENDER_TEST`.
   - It must fail closed if the source path/size is not the approved one.
   - It must fail closed if the output path is outside `output/youtube-shorts-letterbox-render-test-v1/`.
   - It must not overwrite an existing output mp4 unless it first proves the existing file was created by this same test and does not run ffmpeg again. Prefer fail-closed on existing mp4 to preserve the one-conversion rule.

2. Add small durable evidence if useful:
   - `docs/youtube-shorts-letterbox-render-test-result.md`
   - `scripts/fixtures/youtube_shorts_letterbox_render_test_result.v1.json`
   - `scripts/check-youtube-shorts-letterbox-render-test-result-static.mjs`

3. Keep the committed dry-run planner contract intact unless a tiny non-behavioral shared helper extraction is clearly safer:
   - `scripts/create-youtube-shorts-letterbox-variant.mjs`
   - `scripts/fixtures/youtube_shorts_letterbox_render_profile.v1.json`
   - `scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`

4. Append `_ai/CLAUDE_REPORT.md` with concise evidence.

5. Update `_ai/HANDOFF_NOW.md` only if execution reality differs materially from this handoff.

## Read-Only Context

Read the minimum useful set:

- `AGENTS.md`
- `_ai/HANDOFF_NOW.md`
- `docs/youtube-shorts-letterbox-variant-renderer.md`
- `scripts/create-youtube-shorts-letterbox-variant.mjs`
- `scripts/fixtures/youtube_shorts_letterbox_render_profile.v1.json`
- `scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`
- `docs/dual-platform-variant-publish-architecture.md`

Do not read or modify the protected dirty render script:

- `scripts/render-golden-sample-visual-only-v1.mjs`

## Forbidden Actions

- Do not run more than one ffmpeg conversion.
- Do not run ffmpeg for screenshots, frame extraction, blackdetect, probe-like analysis, or any second media operation.
- Do not run Remotion/render regeneration, mux/TTS/image/browser generation, or source media regeneration.
- Do not upload anything.
- Do not call YouTube API/OAuth or Instagram API/`--arm`.
- Do not provision Vercel Blob, create tokens, read/write env/secrets, or access `.env.local`.
- Do not deploy, change DNS/domain, or touch Cloudflare/R2/wrangler.
- Do not change dependencies/lockfiles/fonts.
- Do not commit/push.
- Do not modify protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/` folders
  - unrelated `C:\tmp`

## Required Checks

1. `git status -sb`
2. Source file check:
   - exact path exists;
   - size is `20294549`;
   - source `ffprobe` confirms video dimensions and basic stream metadata.
3. Syntax:
   - `node --check scripts/run-youtube-shorts-letterbox-render-test-once.mjs`
   - if added, `node --check scripts/check-youtube-shorts-letterbox-render-test-result-static.mjs`
4. Existing planner regression:
   - `node --check scripts/create-youtube-shorts-letterbox-variant.mjs`
   - `node --check scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`
   - `node scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`
5. Execute exactly one conversion:
   - run the one-shot runner once with `--approval APPROVE_PLATFORM_VARIANT_RENDER_TEST`
   - output only under `output/youtube-shorts-letterbox-render-test-v1/`
6. Output verification:
   - output `ffprobe` confirms 1080x1920;
   - output video codec is H.264-compatible and pixel format is `yuv420p` if reported;
   - duration is close to source duration;
   - audio presence is preserved if the source has audio;
   - result evidence records the exact filter and that only one ffmpeg conversion was attempted.
7. New static/result guard if added:
   - `node scripts/check-youtube-shorts-letterbox-render-test-result-static.mjs`
8. Targeted regressions:
   - `node scripts/check-dual-platform-variant-publish-architecture-static.mjs`
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`
   - `node scripts/check-media-provider-decision-packet-static.mjs`

Do not run full build unless syntax/import issues require it.

## Definition Of Done

- Exactly one local YouTube Shorts letterbox mp4 test artifact is created from the approved source.
- Output is confined to `output/youtube-shorts-letterbox-render-test-v1/`.
- The transform uses centered 864x1536 content on a black 1080x1920 canvas.
- No upload/API/OAuth/env/deploy/DNS/provider provisioning occurs.
- Existing dry-run planner and dual-platform contracts remain intact.
- Targeted checks pass, or any failure is fail-closed and clearly reported.
- `_ai/CLAUDE_REPORT.md` records concise evidence.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- created output artifact paths and sizes
- changed files
- exact ffmpeg conversion count and command/filter summary
- source/output probe summary
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 92%`
