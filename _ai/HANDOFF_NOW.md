# Handoff Now

## Task ID

`money-shorts-os-voice-profile-spec-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed local checkpoint before image-prompts:
  - `fa6b5a1 feat(chart-cards): add source-linked card props model`
- Image prompt module is complete and checkpoint-ready:
  - `lib/image-prompts/`
  - review-fix prevents CTA/card labels/numeric card surfaces from entering generated image prompt text

Active local modules:

- `lib/source-facts/`
- `lib/blueprints/`
- `lib/scripts/`
- `lib/risk-review/`
- `lib/chart-cards/`
- `lib/image-prompts/`

Active product/spec sources:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Goal

Create a local deterministic voice profile and TTS script formatting module for Money Shorts OS.

This task only models voice profile settings and formats existing script/blueprint narration into provider-ready text blocks. It must not call ElevenLabs, OpenAI, or any external TTS/audio service.

## Approved Scope

Allowed:

- Inspect `lib/blueprints/`, `lib/scripts/`, and specs listed above.
- Add a small local module, preferably `lib/voice-profiles/`, if no better local pattern exists.
- Define TypeScript types for voice profiles, voice settings, and formatted TTS script packages.
- Create deterministic helpers that derive TTS-ready text from existing `GeneratedScriptPackage` and/or `VideoBlueprint` narration fields.
- Preserve linkage to package/video/scene ids where available.
- Include a default local voice profile matching the spec:
  - Korean
  - male
  - calm
  - confident
  - trustworthy
  - warm but not soft
  - clear pronunciation
  - not too slow
  - not ad-like
  - not news-anchor-like
- Add lightweight validation helpers if useful.
- Add fixtures from existing script/blueprint fixtures.

## Forbidden

- No ElevenLabs call.
- No OpenAI/GPT/Gemini/Veo call.
- No audio generation.
- No audio duration measurement.
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

- Voice profile model types are available from a clear local module.
- A deterministic helper can build TTS-ready script text from existing mock script/blueprint data.
- Scene/package linkage is preserved.
- Formatter does not invent narration beyond existing script/blueprint narration fields.
- Validation catches missing profile id/name/provider, empty TTS text, missing scene linkage, and unsupported provider/locale where practical.
- No external service integration is added.
- Focused type/check/sample command passes, or a clear reason is reported if no check applies.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only if reusable implementation evidence should be preserved.
