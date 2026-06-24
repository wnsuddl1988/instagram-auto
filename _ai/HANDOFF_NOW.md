# Handoff Now

## Task ID

`money-shorts-os-chart-card-model-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Clean source-first baseline: `909098b feat(source): establish clean source-first baseline`
- Blueprint checkpoint: `35ca73c feat(blueprints): add fact card video blueprint generator`
- Script checkpoint: `902e632 feat(scripts): add source-linked script package generator`
- Risk review module is checkpoint-ready: `lib/risk-review/`

Active local modules:

- `lib/source-facts/`
- `lib/blueprints/`
- `lib/scripts/`
- `lib/risk-review/`

Active product/spec sources:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Goal

Create the first local chart/number-card data model for 9:16 source-backed finance shorts cards.

This task is only local deterministic TypeScript data modelling. It must not generate images, render video, call ffmpeg, or call external services.

## Approved Scope

Allowed:

- Inspect `lib/source-facts/`, `lib/blueprints/`, `lib/scripts/`, and `lib/risk-review/`.
- Add a small local chart/card module, preferably `lib/chart-cards/`, if no better local pattern exists.
- Define TypeScript types for 9:16 chart/number card props.
- Create deterministic helpers that derive card props from `FactCard` and/or `VideoBlueprint`.
- Preserve source linkage: factCardId, source citation ids, source name/url, published date, data period.
- Include model types for number card, comparison card, source card, and optional CTA card if it stays small.
- Add lightweight validation helpers if useful.
- Keep code small, reusable, and local.

## Forbidden

- No chart rendering.
- No canvas/SVG/PNG generation.
- No ffmpeg pipeline implementation or execution.
- No external API calls.
- No GPT/Gemini/Veo/ElevenLabs live calls.
- No API key/env/secret changes.
- No Supabase migration or production DB changes.
- No dependency or lockfile changes.
- No payment integration.
- No upload/post.
- No git push.
- Do not implement full Money-OS product.
- Do not implement TTS/render/image pipelines yet.
- Do not reuse retired Candidate10/Jun/static slideshow/old Money Architect routes, assets, prompts, or references.

## Definition of Done

- Chart/card model types are available from a clear local module.
- A deterministic helper can derive source-backed card props from a mock Fact Card/Blueprint.
- Source/citation linkage is preserved.
- No numeric facts are invented beyond Fact Card/Blueprint values.
- Validation catches missing source linkage, empty title/value, invalid card dimensions or unsupported card type.
- No external service integration is added.
- Focused type/check/test command passes, or a clear reason is reported if no check applies.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only if reusable implementation evidence should be preserved.
