# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `golden-sample-content-unit-final-readiness-no-live-v1`
- Owner approval basis: follows completed no-live/read-only approvals and latest checkpoint `5d9857b feat(media): add instagram blob liveness check`
- Purpose: create and verify a real `dual_platform_content_unit_v1` manifest for the existing final golden sample (`t1_lifestyle_inflation`, `v3_2`) using existing local Instagram/full-frame mp4, existing YouTube letterbox mp4/render result, and existing Blob public URL liveness evidence. This is a no-live readiness consolidation step only.

## Approved Scope

Approved:

- Use existing local output/evidence files only.
- Create a checked-in fixture manifest for the ready golden sample content unit.
- Add a static/readiness guard that validates the fixture and runs orchestrator `--preflight --content-unit <fixture>`.
- Confirm no publish/upload/API/Blob mutation occurs.
- Append concise evidence to `_ai/CLAUDE_REPORT.md`.

Not approved:

- Instagram publish/arm or Instagram Graph API calls.
- YouTube API/OAuth/upload.
- Blob upload/delete/overwrite/copy/mutation or additional public HEAD.
- Env/secret read/write/print, including `.env`, `.env.*`, `.env.local`.
- Deploy, dependency/lockfile changes, DB/Supabase, browser automation.
- New media generation, ffmpeg, ffprobe, TTS/image/render/mux.
- Commit/push.

## Existing Inputs

Use existing files/evidence. Do not regenerate media.

Instagram source mp4:

- `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- expected size: `20294549`

YouTube letterbox mp4/render evidence:

- Preferred render result JSON:
  - `C:\tmp\money-shorts-os\youtube-letterbox-local-render-execution-once-v1\youtube-letterbox-render-result.json`
- If valid, use its `outputPath` as `youtubeSourcePath`.
- Expected prior output size from that approved render: `7349425`

Blob public URL liveness result:

- `C:\tmp\money-shorts-os\instagram-existing-blob-liveness-no-arm-v1\instagram-existing-blob-liveness-result.json`
- expected:
  - `status: LIVE_PUBLIC_URL_OK`
  - `headStatus: 200`
  - `contentType: video/mp4`
  - `contentLength: 20294549`
  - `livenessOk: true`

Known public URL:

- `https://7iq7vppwlaha2vuo.public.blob.vercel-storage.com/instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4`

## Suggested Files

New fixture:

- `scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json`

New guard:

- `scripts/check-dual-platform-content-unit-final-readiness-static.mjs`

Optional docs update only if useful:

- `docs/owner-daily-automation-runbook.md`

Report append:

- `_ai/CLAUDE_REPORT.md`

## Fixture Contract

The fixture must be secret-free and include:

- `schemaVersion: "dual_platform_content_unit_v1"`
- `contentId: "t1_lifestyle_inflation"`
- `version: "v3_2"`
- `instagramSourcePath`: existing final Instagram/full-frame mp4 path
- `youtubeSourcePath`: existing YouTube letterbox mp4 path, preferably derived from the render result JSON
- optimized Instagram metadata:
  - non-empty `captionFirstLineHook`
  - non-empty `caption`
  - 8-12 relevant hashtags
  - non-empty `callToAction`
  - `forbiddenUnrelatedTrendTags: true`
- optimized YouTube metadata:
  - `titleBase`
  - `titleWithShortsSuffix`
  - `descriptionBase`
  - relevant tags
  - `categoryId: "22"`
  - `defaultLanguage: "ko"`
  - `privacyStatus: "public"`
  - `selfDeclaredMadeForKids: false`
- `blobPublicUrlLivenessEvidence` copied from the liveness result:
  - `url`
  - `headStatus`
  - `contentType`
  - `contentLength`
- optionally `existingPublishedKeys` for explicit duplicate reference, but remember `contentId/version` already makes this the default evidence content in the orchestrator.

## Guard Requirements

The guard must be dependency-free and no-live. It should:

1. Parse the fixture JSON.
2. Parse the existing liveness result JSON read-only.
3. Parse the existing YouTube render result JSON read-only if present.
4. Validate source file existence and expected sizes using `existsSync/statSync` only.
5. Validate metadata gate expectations:
   - Instagram hashtags 8-12
   - no unrelated trend tags
   - hook/CTA non-empty
   - YouTube tags/title present
6. Run:
   - `node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight --content-unit scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json`
7. Confirm preflight:
   - `preflightOk === true`
   - `sourceFilesReady === true`
   - `blobLivenessEvidenceOk === true` or equivalent liveArm evidence ok
   - metadata gate ok
   - duplicate guard uses `v3_2`
   - side-effect counters all zero
   - no publish/upload/API occurs
8. Do not run `--live` or `--arm`.

If any required local evidence file is missing, fail closed with a clear blocker and do not synthesize fake readiness.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not print, hash, copy, log, stage, or commit token values.
- Do not call public HEAD again in this task.
- Do not call Instagram API, YouTube API/OAuth/upload, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or paid/external live services.
- Do not call Blob SDK, upload/delete/overwrite/copy/mutation.
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
4. New guard:
   - `node scripts/check-dual-platform-content-unit-final-readiness-static.mjs`
5. Targeted regressions:
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
   - `node scripts/check-instagram-existing-blob-liveness-attach-static.mjs`
   - `node scripts/check-dual-platform-content-unit-from-local-summary-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg/ffprobe/deploy/API.

## Definition Of Done

All must be true:

1. A real golden-sample content unit fixture exists and points at existing local Instagram and YouTube mp4 files.
2. Blob liveness evidence from the already completed HEAD result is attached.
3. Orchestrator `--preflight --content-unit <fixture>` passes with `preflightOk:true` and side effects 0.
4. The fixture remains duplicate-guarded for the already published `t1_lifestyle_inflation/v3_2` evidence.
5. No env/secret access, Blob mutation, Instagram publish, YouTube upload, deploy, dependency change, media generation, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- content unit fixture path
- Instagram source path/size
- YouTube source path/size
- Blob liveness evidence summary
- preflight result summary
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
