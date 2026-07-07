# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `content-unit-youtube-render-result-attach-preflight-no-live-v1`
- Latest checkpoint: `f8edc2b feat(media): render youtube letterbox source once`
- Purpose: connect the successful YouTube letterbox local render result JSON to the content unit manifest flow so the generated mp4 can be attached as `youtubeSourcePath` without manual copy/paste.

## Why This Is Next

- The approved local render step produced a verified YouTube letterbox mp4:
  - result JSON: `C:\tmp\money-shorts-os\youtube-letterbox-local-render-execution-once-v1\youtube-letterbox-render-result.json`
  - output mp4: `C:\tmp\money-shorts-os\youtube-letterbox-local-render-execution-once-v1\golden_sample_t1_lifestyle_inflation_youtube_letterbox_v3_2_once.mp4`
- The daily runbook currently says to rebuild/attach the content unit with `--youtube-source <plannedYoutubeSourcePath>`.
- To make the Owner workflow usable, the tool should also accept the render result JSON directly and derive `youtubeSourcePath` from the verified `outputPath`.
- This is no-live/no-media-generation: read JSON, validate paths/booleans, write manifest/build-summary only.

## Approved Scope

Claude Code may implement a no-live bridge from YouTube render result JSON to content unit manifest generation.

Allowed edits:

- `scripts/build-dual-platform-content-unit-from-local-summary.mjs`
- `scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
- `scripts/run-owner-daily-automation-entrypoint.mjs`
- `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- `docs/owner-daily-automation-runbook.md`
- New fixture if useful:
  - `scripts/fixtures/youtube_letterbox_render_result_attach.sample.v1.json`
- Append concise evidence to `_ai/CLAUDE_REPORT.md`

Do not modify the local render runner unless a focused bug is discovered. Do not rerun ffmpeg.

## Required Behavior

1. Add support for an optional render result input, preferably:
   - builder CLI: `--youtube-render-result <youtube-letterbox-render-result.json>`
   - owner entrypoint forwarding through `--build-content-unit --youtube-render-result <path>`

2. Validate the render result fail-closed:
   - JSON parses;
   - `schemaVersion === "youtube_letterbox_render_result_v1"`;
   - `executed === true`;
   - `allVerificationsPass === true`;
   - `ffmpegConversionCount === 1`;
   - `sideEffectCounters.apiCallCount === 0`;
   - `sideEffectCounters.uploadCount === 0`;
   - `sideEffectCounters.envSecretReadCount === 0`;
   - `sideEffectCounters.deployCount === 0`;
   - `outputPath` is a non-empty `.mp4` path;
   - `outputPath` exists and is outside the repo;
   - output size is positive.

3. Derive `youtubeSourcePath` from validated `renderResult.outputPath`.

4. If both `--youtube-source` and `--youtube-render-result` are provided:
   - either require they resolve to the same path, or fail closed with a clear reason such as `youtube_source_render_result_mismatch`.

5. Update build summary/readiness:
   - `youtubeSourceReady:true` when the render result output path exists;
   - include a field/note such as `youtubeSourceDerivedFromRenderResult:true`;
   - do not mark full `contentUnitPreflightExpectedReady:true` unless metadata, Instagram source, YouTube source, and Blob liveness evidence are all ready.

6. Owner entrypoint:
   - `--build-content-unit` should pass `--youtube-render-result` to the builder.
   - `--status` / runbook should mention the preferred command after local render:
     `--build-content-unit --summary <summary.json> --youtube-render-result <youtube-letterbox-render-result.json> --out-dir <repo 밖>`

7. Smoke validation:
   - Use existing checked-in sample summary fixture and/or a temp outside-repo output dir.
   - It is okay to read the real render result JSON under `C:\tmp\money-shorts-os\youtube-letterbox-local-render-execution-once-v1\`.
   - Do not create media. Do not run ffmpeg/ffprobe.
   - Generated smoke manifests must be outside repo or temporary and cleaned when appropriate.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not call Instagram API, YouTube API/OAuth/upload, Vercel Blob upload/list/delete/copy/head, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service.
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
2. Syntax check for changed/new JS/MJS files.
3. JSON parse for changed/new fixtures.
4. Main bridge guard:
   - `node scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`
5. Targeted regressions:
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
   - `node scripts/check-youtube-letterbox-local-render-execution-static.mjs`
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg/ffprobe.

## Definition Of Done

- Owner can rebuild a content unit manifest using the render result JSON instead of manually copying the mp4 path.
- The generated manifest has `youtubeSourcePath` equal to the verified output mp4 path.
- Build summary clearly shows YouTube source readiness and whether it came from render result.
- Full preflight remains fail-closed until Blob liveness evidence is supplied.
- Guards prove no env/secret/API/upload/deploy/media-generation side effects.
- No commit/push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- new/updated command(s)
- render-result attach contract summary
- smoke/preflight result
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
