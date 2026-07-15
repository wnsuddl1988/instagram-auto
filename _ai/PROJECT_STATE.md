# AutoShorts AI — Project State

Updated: 2026-07-15 KST

## Operating State

- ROLE_MODE: `MAIN_AI_MODE`
- Main AI: Codex
- Branch: `codex/source-first-blueprint-clean`
- Remote state: local commits ahead of origin; push not approved and not performed.
- Overall Owner-facing progress: approximately 88%.

## Current Product State

- Money Shorts 500-topic/editorial, character cast, voice routing, scene image, caption, and local video pipeline changes are accumulated in the working tree.
- The latest pilot is Owner-rejected: visual tone, script-to-scene relevance, scene pacing, and true character motion are not accepted.
- Flow retry-v3 scene 08 was generated once with Veo 3.1 Fast (9:16, 8s, 20 credits) and technically downloaded, but Owner-directed visual QA rejected it: the card finishes on the wooden desk left of the notebook rather than centered on the notebook paper. Its local state is `qa_failed`; it is not render-ready and must not be consumed by final render.
- The Owner-approved first/last Flow canary proved the actual agent binding: `start_image_media_id=3cf44be8-71bd-4092-b9c6-1598ce8cb17a` and `end_image_media_id=4e2a0d59-03ed-4652-95bc-35e971084489`. Ordered composer attachments were translated into real first/last-frame arguments for this run.
- The first/last result is `FLOW_GENERATED_OWNER_QA_PASSED`: result media `3248a04b-8171-4dcf-aa5a-ebe09892b687`, local SHA-256 `8df5e4df6818083e0530922cc2d049ec16e119a9f90294845cb244e47549292b`, 720x1280 H.264/AAC, 24fps, 8.0s. Owner accepted the warm 3D identity, real hand/wrist/elbow/head/gaze motion, and card ending centered on notebook paper. The brief opening lift before lowering is recorded as an accepted minor deviation for this exact clip only.
- The current 12-scene production script now selects scene 08 (`mindset`) as `veo_motion`; an isolated `render_ready` state and QA evidence bind the current scene ID, reference hash, prompt hash, and output hash. The existing render-input resolver accepts it (`17/17` contract checks pass).
- The no-upload final-render canary is fail-closed at `REAL_TTS_REQUIRED`: the current full TTS timeline is 66.76 seconds, above the restored 15~60 second contract, so no final MP4 was produced. The current full TTS evidence also has masked voice `fHz***r16`, not Owner-selected Harry Kim `pb3lVZVjdFWbkhPKlelB`; no paid replacement TTS was run.
- Current FFmpeg layered motion is camera/parallax/masked micro-motion, not true articulated character animation.
- Owner selected ElevenLabs `Harry Kim – Conversational` (`pb3lVZVjdFWbkhPKlelB`) for Minjae. A complete same-script Harry Kim production TTS has not yet been generated.
- No shared-engine readiness, upload readiness, publication approval, or final product completion is declared.
- No deploy, push, env/secret change, or unrelated external account change was performed. The exact Owner-approved Flow first/last canary submitted once, clicked the ordinary `승인` once, and used 20 credits; the post-run balance observed through Flow was 920.

## Diff Cleanup State

- Removed approved generated QA/diagnostic artifacts: repository `.tmp/`, `tmp/`, `piq_diag_out.txt`, and `shadow-list.txt`.
- Deleted the approved stale `_ai/CONTEXT_TRANSFER_CODEX.md`.
- Removed the approved temporary `allowBuilds` placeholder from `pnpm-workspace.yaml`; dependency declarations and lockfile were not changed.
- Restored the project video duration contract to `15~60s` in renderer, server readiness gates, documentation, and static checks.
- Updated three stale static guards for the current voice-cast, character-cast, and non-executing ffmpeg evidence structure.

## Validation Evidence

- Changed/untracked `.mjs` syntax: 59/59 PASS.
- Targeted static guards: PASS, including 500-topic quality, character/voice cast, visual evidence, dynamic captions, layered motion, platform discovery, upload fail-closed, and production input contracts.
- `pnpm build`: PASS (Next.js compile + TypeScript + 23 routes/pages).
- `git diff --check`: PASS.
- Flow motion approval selection: 7/7 PASS; Flow runner: 30/30 PASS; Flow motion job state: 22/22 PASS.
- Retry-v3 downloaded output: SHA-256 `e380c1a0561a8476b2fd568393fd7900f344d1599fc7372406161c0b1501d065`, 720x1280, 24fps, 8 seconds. Technical validity does not override the visual QA rejection.
- Build warnings remain for broad `output/v2` file tracing and project-wide NFT tracing; these are performance follow-ups, not build failures.

## Current Priority

1. Keep retry-v3 as `qa_failed`; do not regenerate it from the existing single-reference Flow dialog.
2. Preserve the accepted first/last clip as isolated `render_ready` evidence; do not call it final or upload-ready.
3. Repair the 12-scene narration to fit 15~60 seconds, then obtain explicit approval before one full Harry Kim ElevenLabs TTS generation. Only after that TTS passes should the final render canary be retried.
4. Finish exact checkpoint inclusion/exclusion review and ask Owner for a local-only commit; no push.
