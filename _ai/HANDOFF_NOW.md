# Handoff Now

## Task ID

`money-shorts-os-fact-card-to-blueprint-v1`

## Current State

Previous video production routes are retired.

The product core is source-based finance/economy shorts production:

- Main product: source-based finance/economy shorts production OS.
- Supporting layer: Money-OS CTA/conversion only when relevant.
- Content mix: source-based finance/economy shorts 70%, Money-OS-linked money-management shorts 30%.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Local checkpoint complete: `acbaba9 feat(source): add fact card types and validation`
- Existing source/fact-card module: `lib/source-facts/`

Active product/spec sources:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Goal

Create the first local Video Blueprint model and generator skeleton from an existing Fact Card.

This task is only local TypeScript types/schema helpers and deterministic mock generation. It must not call external data APIs, AI, TTS, video, DB, payment, deploy, upload, or ffmpeg services.

## Approved Scope

Allowed:

- Inspect `lib/source-facts/` and existing project TypeScript conventions.
- Add a small local blueprint module, preferably `lib/blueprints/`, if no better local pattern exists.
- Define local TypeScript types for Video Blueprint root fields and scene fields based on `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`.
- Generate a mock/deterministic Video Blueprint from a `FactCard`.
- Preserve Fact Card linkage through `factCardIds`, `sourceCitationIds`, `sourceSummary`, and per-scene source notes where useful.
- Include 15/30/60 target duration support as types or lightweight helper logic if it stays small.
- Add validation helpers if useful, focused on missing Fact Card/source links, empty scenes, unsafe CTA policy, and required title/topic/core message.
- Add focused tests only if the existing repo has an obvious lightweight setup; otherwise run targeted TypeScript/ESLint checks.
- Keep code small, reusable, and local.

Required model concepts:

- `VideoBlueprint`
- `VideoBlueprintScene`
- `VideoBlueprintContentType`
- `VideoBlueprintTemplateMode`
- `VideoBlueprintTemplateKey`
- `VideoBlueprintTargetAudience`
- `VideoBlueprintSceneRole`
- `VideoBlueprintVisualType`
- `VideoBlueprintMotionType`
- `VideoBlueprintValidationResult`

Minimum generated blueprint fields:

- schema version
- video id
- title
- topic
- target duration seconds
- estimated duration seconds
- core message
- content type
- template mode
- template key
- Fact Card ids
- source citation ids
- source summary
- CTA policy
- tone
- target audience
- risk level
- source references
- voice profile id
- ordered scenes

## Forbidden

- No ECOS/KOSIS/OpenDART/FRED live API calls.
- No GPT/Gemini/Veo/ElevenLabs live calls.
- No API key/env/secret changes.
- No Supabase migration or production DB changes.
- No dependency or lockfile changes.
- No payment integration.
- No video rendering.
- No ffmpeg pipeline implementation or execution.
- No upload/post.
- No git push.
- Do not implement the full Money-OS product.
- Do not implement script generation as a separate product yet; only include scene text needed to prove the Blueprint shape.
- Do not reuse retired Candidate10/Jun/static slideshow/old Money Architect routes, assets, prompts, or references.

## Definition of Done

- Video Blueprint types are available from a clear local module.
- A deterministic helper can create a mock Video Blueprint from a valid `FactCard`.
- The generated Blueprint keeps source links and citation ids from the Fact Card.
- The generated Blueprint has ordered scenes and no imagined numeric facts beyond the Fact Card.
- Validation catches missing title/topic/core message, missing Fact Card linkage, missing scenes, and invalid source citation linkage.
- No external service integration is added.
- Focused type/check/test command passes, or a clear reason is reported if no check applies.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only if reusable implementation evidence should be preserved.
