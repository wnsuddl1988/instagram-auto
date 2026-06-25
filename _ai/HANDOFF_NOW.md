# Handoff Now

## Task ID

`money-shorts-os-ffmpeg-render-plan-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed local checkpoint before timeline:
  - `55f4a9b feat(voice-profiles): add local tts script formatter`
- Timeline recalculation module is complete and checkpoint-ready:
  - `lib/timeline/`
  - supplied/mock measured duration only
  - no real audio file measurement, no ElevenLabs, no ffmpeg, no render

Active local modules:

- `lib/source-facts/`
- `lib/blueprints/`
- `lib/scripts/`
- `lib/risk-review/`
- `lib/chart-cards/`
- `lib/image-prompts/`
- `lib/voice-profiles/`
- `lib/timeline/`

Active product/spec sources:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Goal

Create a local deterministic render manifest and ffmpeg command plan model for Money Shorts OS.

This task plans what a future render would need, but it must not execute ffmpeg, render video, create media files, probe media files, or touch `output/`.

## Approved Scope

Allowed:

- Inspect `lib/blueprints/`, `lib/scripts/`, `lib/chart-cards/`, `lib/image-prompts/`, `lib/voice-profiles/`, `lib/timeline/`, and specs listed above.
- Add a small local module, preferably `lib/render-plan/`, if no better local pattern exists.
- Define TypeScript types for render manifest, planned inputs, overlays, captions, audio slots, and planned ffmpeg command fragments.
- Create deterministic helpers that build a render plan from existing mock Blueprint/Script/Chart/Image/TTS/Timeline data.
- Use placeholder asset paths/ids only; do not read or create media files.
- Preserve linkage to source package/video/scene ids where available.
- Add lightweight validation helpers if useful.
- Add fixtures from existing local modules.

## Forbidden

- No ffmpeg execution.
- No video/audio/image rendering.
- No actual media file probing or duration measurement.
- No ElevenLabs call.
- No OpenAI/GPT/Gemini/Veo call.
- No external API calls.
- No API key/env/secret changes.
- No Supabase migration or production DB changes.
- No dependency or lockfile changes.
- No payment integration.
- No upload/post.
- No git push.
- Do not implement full Money-OS product.
- Do not touch `output/`.
- Do not reuse retired Candidate10/Jun/static slideshow/old Money Architect routes, assets, prompts, or references.

## Definition of Done

- Render-plan model types are available from a clear local module.
- A deterministic helper can build a render manifest/command plan from existing mock local package data.
- The plan references planned inputs and overlays without requiring files to exist.
- Captions, source overlays, chart/image prompt references, voice/TTS references, and timeline scene ids are linked.
- Validation catches missing source id, missing timeline, empty scenes, invalid dimensions, missing caption/overlay linkage, and forbidden executable/render flags where practical.
- No command is executed and no output file is created.
- Focused type/check/sample command passes, or a clear reason is reported if no check applies.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only if reusable implementation evidence should be preserved.
