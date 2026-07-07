# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `youtube-letterbox-local-render-execution-once-v1`
- Latest checkpoint: `19c3c02 feat(operator): prepare youtube letterbox render requests`
- Owner approval: `APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE`
- Purpose: use one existing local Instagram/full-frame mp4 to generate and verify exactly one YouTube Shorts letterbox mp4 via local ffmpeg.

## Why This Is Next

- The owner-facing automation flow can now:
  - run a local dry-run;
  - build a content unit manifest;
  - plan a deterministic YouTube letterbox path;
  - prepare a no-execute render request.
- The next actual usability blocker is the missing YouTube letterbox mp4 for a new/future content unit.
- This slice is the first approved local media execution step. It may run exactly one ffmpeg conversion and read-only ffprobe verification, with no API/upload/env/deploy side effects.

## Approved Source And Output

Use this approved existing source mp4 only:

- `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- Expected size: `20294549` bytes

Approved repo-outside output folder:

- `C:\tmp\money-shorts-os\youtube-letterbox-local-render-execution-once-v1`

Approved output mp4:

- `C:\tmp\money-shorts-os\youtube-letterbox-local-render-execution-once-v1\golden_sample_t1_lifestyle_inflation_youtube_letterbox_v3_2_once.mp4`

Allowed result/probe JSON files under the same output folder:

- `youtube-letterbox-render-request.json`
- `youtube-letterbox-render-result.json`
- `source-ffprobe.json`
- `output-ffprobe.json`

If another valid `youtube-letterbox-render-request.json` is discovered for this exact source and a repo-outside mp4 output path, it may be used only if it is consistent with the same render profile and does not overwrite an existing mp4. If no valid request exists, create a one-shot request JSON under the approved output folder using the source/output above.

## Approved Scope

Claude Code may implement and run a one-shot local render execution path.

Allowed edits:

- New one-shot runner if useful:
  - `scripts/run-youtube-letterbox-render-from-request-once.mjs`
- New static/result guard if useful:
  - `scripts/check-youtube-letterbox-local-render-execution-static.mjs`
- Optional owner entrypoint integration:
  - `scripts/run-owner-daily-automation-entrypoint.mjs`
  - `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- Optional docs update:
  - `docs/owner-daily-automation-runbook.md`
- Optional fixture/result contract:
  - `scripts/fixtures/youtube_letterbox_local_render_execution_once.v1.json`
- Append concise evidence to `_ai/CLAUDE_REPORT.md`

Avoid modifying `scripts/create-youtube-shorts-letterbox-variant.mjs`. Its existing no-execute planner contract should remain intact unless there is a strong reason and all existing guards still pass. Prefer a separate one-shot runner.

## Required Behavior

1. The runner must require the exact approval token:
   - `--approval APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE`

2. The runner must validate before ffmpeg:
   - source path exactly equals the approved source or the request source resolved to that same file;
   - source exists;
   - source size is exactly `20294549`;
   - output path is repo-outside and ends with `.mp4`;
   - output path is inside the approved output folder unless using a valid request-provided repo-outside path;
   - output mp4 does not already exist;
   - no `.env`, `.env.*`, `.env.local`, secret, API, upload, deploy, or network access.

3. Render profile must match the existing YouTube Shorts letterbox contract:
   - canvas: `1080x1920`
   - background: black
   - content box: `864x1536`
   - filter: `scale=w=864:h=1536:force_original_aspect_ratio=decrease,pad=w=1080:h=1920:x=(ow-iw)/2:y=(oh-ih)/2:color=black`
   - video codec: h264
   - pixel format: yuv420p
   - movflags: +faststart
   - audio: preserve existing audio as AAC when source audio exists

4. Execution limits:
   - ffmpeg conversion count must be exactly 1 when it runs;
   - ffprobe may run read-only before/after for validation;
   - no screenshot/frame extraction/blackdetect/browser/render regeneration;
   - if any precondition fails, ffmpeg count must remain 0 and the task must fail closed with a clear blocker status.

5. Verification must confirm:
   - output file exists;
   - output size > 0;
   - output video is `1080x1920`;
   - output codec is h264-compatible;
   - output pixel format is yuv420p;
   - duration delta from source is within a reasonable tolerance such as <= 1.0s;
   - audio is present if source audio is present;
   - result JSON records `ffmpegConversionCount: 1`;
   - side effects for API/upload/env/deploy are all 0/false.

6. Owner entrypoint, if integrated, should expose a command such as:
   - `node scripts/run-owner-daily-automation-entrypoint.mjs --render-youtube-letterbox-once --request <youtube-letterbox-render-request.json> --approval APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE`
   - It must refuse to run without the exact approval token.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not call Instagram API, YouTube API/OAuth/upload, Vercel Blob upload/list/delete/copy/head, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service.
- Do not generate a new original/source video, new TTS, new images, new browser render, or new muxed Instagram source.
- Do not overwrite an existing mp4. If the output mp4 exists, stop with `BLOCKED_OUTPUT_ALREADY_EXISTS_NO_RENDER`.
- Do not run ffmpeg more than once.
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
2. Syntax for changed/new JS/MJS files.
3. JSON parse for changed/new fixtures/result JSON.
4. Run the one-shot runner exactly once if all preconditions pass.
5. New guard if added:
   - `node scripts/check-youtube-letterbox-local-render-execution-static.mjs`
6. Targeted regressions:
   - `node scripts/check-youtube-letterbox-render-execution-wiring-static.mjs`
   - `node scripts/check-youtube-letterbox-source-plan-bridge-static.mjs`
   - `node scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs` if owner entrypoint is changed

Do not run full build unless a focused syntax/import issue requires it.
Do not run upload/API/deploy checks.

## Definition Of Done

- Exactly one YouTube letterbox mp4 is generated from the approved existing source, or the runner fails closed before ffmpeg with a precise blocker.
- If generated, output/probe/result paths are reported and result JSON proves `ffmpegConversionCount === 1`.
- No env/secret/API/upload/deploy/dependency/commit/push side effects occur.
- Owner has a clear next command/path to attach the generated `youtubeSourcePath` to a content unit manifest.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- exact runner command used
- source/output paths and file sizes
- ffmpeg conversion count and ffprobe verification summary
- result JSON path
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
