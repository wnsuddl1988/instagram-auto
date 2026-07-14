# AutoShorts AI — Project State

Updated: 2026-07-14 KST

## Operating State

- ROLE_MODE: `MAIN_AI_MODE`
- Main AI: Codex
- Branch: `codex/source-first-blueprint-clean`
- Remote state: local commits ahead of origin; push not approved and not performed.
- Overall Owner-facing progress: approximately 88%.

## Current Product State

- Money Shorts 500-topic/editorial, character cast, voice routing, scene image, caption, and local video pipeline changes are accumulated in the working tree.
- The latest pilot is Owner-rejected: visual tone, script-to-scene relevance, scene pacing, and true character motion are not accepted.
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
- Build warnings remain for broad `output/v2` file tracing and project-wide NFT tracing; these are performance follow-ups, not build failures.

## Current Priority

1. Finish exact checkpoint inclusion/exclusion review.
2. Ask Owner for local checkpoint commit approval; no push.
3. Start a fresh compact Codex task after the checkpoint to reduce context latency.
4. Resume Minjae voice audition and motion architecture only after the cleanup boundary is complete.
