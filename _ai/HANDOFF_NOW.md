# Handoff Now

## Task ID

`money-shorts-os-image-prompt-generator-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Local checkpoints already completed:
  - `909098b feat(source): establish clean source-first baseline`
  - `35ca73c feat(blueprints): add fact card video blueprint generator`
  - `902e632 feat(scripts): add source-linked script package generator`
  - `79faa5b feat(risk): add financial expression scanner`
- Chart-card module is complete and ready for local checkpoint:
  - `lib/chart-cards/`
  - review-fix corrected `AnyCardProps[]` typing for optional CTA cards

Active local modules:

- `lib/source-facts/`
- `lib/blueprints/`
- `lib/scripts/`
- `lib/risk-review/`
- `lib/chart-cards/`

Active product/spec sources:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Goal

Create a local deterministic image-prompt package module for source-backed finance shorts.

This task only derives prompt text and prompt metadata from existing `FactCard`, `VideoBlueprint`, and/or script scene fields. It must not submit prompts to GPT, Gemini, Veo, OpenAI, or any external service.

## Approved Scope

Allowed:

- Inspect `lib/source-facts/`, `lib/blueprints/`, `lib/scripts/`, `lib/chart-cards/`, and specs listed above.
- Add a small local module, preferably `lib/image-prompts/`, if no better local pattern exists.
- Define TypeScript types for image prompt packages and scene-level prompts.
- Generate deterministic prompt objects from `VideoBlueprint` scenes and source-backed fields.
- Preserve linkage to `videoId`, `sceneId`, `factCardId`, and `sourceCitationIds` where available.
- Include global negative rules:
  - no text inside generated image
  - no numbers inside generated image
  - no labels/UI/logos/card numbers
  - no subtitles/CTA/source text inside generated image
  - no fantasy/game/cartoon/chibi/mascot style
  - no investment advice or performance promises
- Keep text/numbers/source display responsibility assigned to chart cards or later overlay layers, not the generated image itself.
- Add lightweight validation helpers if useful.
- Add mock fixtures from existing blueprints.

## Forbidden

- No GPT/OpenAI image generation call.
- No Gemini/Veo call.
- No external API calls.
- No image, canvas, SVG, PNG, or video rendering.
- No ffmpeg pipeline implementation or execution.
- No ElevenLabs/TTS.
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

- Image prompt model types are available from a clear local module.
- A deterministic helper can derive scene-level image prompts from existing mock `VideoBlueprint` data.
- Prompt package preserves source/scene linkage.
- Prompt text does not place factual numbers, captions, CTA text, source text, or labels inside the generated image.
- Validation catches empty prompt text, missing scene linkage, missing negative rules, unsupported provider/asset type, and text/numbers-in-image rule violations where practical.
- No external service integration is added.
- Focused type/check/sample command passes, or a clear reason is reported if no check applies.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only if reusable implementation evidence should be preserved.
