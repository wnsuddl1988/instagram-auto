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
- Playwright read-only inspection of the existing Flow project found only one unlabelled `프롬프트에 추가` media attachment control. It did not expose a start-frame/end-frame binding, so attaching two images must not be treated as deterministic first/last-frame animation.
- Current FFmpeg layered motion is camera/parallax/masked micro-motion, not true articulated character animation.
- Minjae currently uses `Hojin Lim`; Owner requested a voice change. Historical candidates are `Hojin Lim`, `Yohan Koo`, and `Gihong`, but a complete same-script three-way audition does not yet exist.
- No shared-engine readiness, upload readiness, publication approval, or final product completion is declared.
- No upload, deploy, push, env/secret change, or external account change was performed in the cleanup slice.

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
2. Agree a real character-motion approach before another pilot: an explicit start/end-frame product input must be proven in Flow or a different approved motion path must be selected. Do not infer end-frame support from two generic media attachments.
3. Finish exact checkpoint inclusion/exclusion review and ask Owner for a local-only commit; no push.
4. Resume Minjae voice audition and motion architecture only after the checkpoint boundary is complete.
