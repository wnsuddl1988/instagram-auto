# Handoff Now

## Task ID

`money-shorts-os-fact-card-script-generator-v1`

## Current State

Previous video production routes are retired.

The product core is source-based finance/economy shorts production:

- Main product: source-based finance/economy shorts production OS.
- Supporting layer: Money-OS CTA/conversion only when relevant.
- Content mix: source-based finance/economy shorts 70%, Money-OS-linked money-management shorts 30%.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Clean branch baseline: `909098b feat(source): establish clean source-first baseline`
- Source/fact-card module exists: `lib/source-facts/`
- Fact Card -> Video Blueprint module is checkpoint-ready: `lib/blueprints/`

Active product/spec sources:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Goal

Create the first local script/caption/storyboard generation structure from a validated Fact Card and Video Blueprint.

This task is only local deterministic TypeScript generation. It must not call external data APIs, AI, TTS, video, DB, payment, deploy, upload, or ffmpeg services.

## Approved Scope

Allowed:

- Inspect `lib/source-facts/` and `lib/blueprints/`.
- Add a small local script module, preferably `lib/scripts/`, if no better local pattern exists.
- Define local TypeScript types for generated script package outputs.
- Generate deterministic 15s/30s/60s script/caption/storyboard text from a `FactCard` and/or `VideoBlueprint`.
- Preserve source linkage through `factCardId`, `blueprintId` or `videoId`, and source/citation references.
- Keep generated numeric facts strictly limited to values already present in the Fact Card/Blueprint.
- Add lightweight validation helpers if useful.
- Keep code small, reusable, and local.

Required concepts:

- generated scripts
- captions
- storyboard scenes
- source notes
- risk-safe wording flags or placeholders
- output durations 15 / 30 / 60

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
- Do not implement full Money-OS product.
- Do not implement chart/image/TTS/render pipelines yet.
- Do not reuse retired Candidate10/Jun/static slideshow/old Money Architect routes, assets, prompts, or references.

## Definition of Done

- Script/caption/storyboard types are available from a clear local module.
- A deterministic helper can create script package output from a valid Fact Card/Video Blueprint.
- Generated output preserves Fact Card and source/citation linkage.
- Generated text uses only Fact Card/Blueprint facts and does not invent numbers.
- Output includes 15s/30s/60s variants or a clear duration-specific structure.
- Validation or a focused sample catches missing source linkage and empty narration/captions.
- No external service integration is added.
- Focused type/check/test command passes, or a clear reason is reported if no check applies.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only if reusable implementation evidence should be preserved.
