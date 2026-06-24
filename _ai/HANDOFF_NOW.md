# Handoff Now

## Task ID

`money-shorts-os-timeline-recalc-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed local checkpoint before voice-profiles:
  - `5bb99fd feat(image-prompts): add source-linked prompt package generator`
- Voice profile module is complete and checkpoint-ready:
  - `lib/voice-profiles/`
  - default voice profile aligned to `provider: "elevenlabs"` with pending placeholder voice id only
  - no live ElevenLabs/OpenAI/TTS/audio call

Active local modules:

- `lib/source-facts/`
- `lib/blueprints/`
- `lib/scripts/`
- `lib/risk-review/`
- `lib/chart-cards/`
- `lib/image-prompts/`
- `lib/voice-profiles/`

Active product/spec sources:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Goal

Create a local deterministic timeline recalculation module for Money Shorts OS.

This task only recalculates scene and caption timings from existing Blueprint/Script/TTS package data plus mocked or manually supplied audio duration values. It must not generate audio, measure real audio files, call ElevenLabs, or render video.

## Approved Scope

Allowed:

- Inspect `lib/blueprints/`, `lib/scripts/`, `lib/voice-profiles/`, and specs listed above.
- Add a small local module, preferably `lib/timeline/`, if no better local pattern exists.
- Define TypeScript types for timeline calculation input/output.
- Accept a provided/mock measured audio duration in seconds.
- Recalculate scene start/end/duration values deterministically.
- Derive simple caption timing blocks from script scenes or TTS scene blocks.
- Preserve linkage to source package/video/scene ids.
- Add lightweight validation helpers if useful.
- Add fixtures from existing blueprint/script/TTS fixtures.

## Forbidden

- No ElevenLabs call.
- No OpenAI/GPT/Gemini/Veo call.
- No audio generation.
- No actual audio duration measurement from files.
- No external API calls.
- No ffmpeg pipeline implementation or execution.
- No image/video rendering.
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

- Timeline model types are available from a clear local module.
- A deterministic helper can recalculate timeline from existing mock Blueprint/Script/TTS data and a supplied measured duration.
- Scene/package linkage is preserved.
- Caption timing blocks are generated from existing caption/scene text without inventing new facts.
- Validation catches missing source id, invalid duration, empty scenes, non-ordered scene times, and target/measured duration mismatches where practical.
- No external service integration is added.
- Focused type/check/sample command passes, or a clear reason is reported if no check applies.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only if reusable implementation evidence should be preserved.
