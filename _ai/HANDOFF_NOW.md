# Handoff Now

## Task ID

`money-shorts-os-risk-review-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Clean source-first baseline: `909098b feat(source): establish clean source-first baseline`
- Blueprint checkpoint: `35ca73c feat(blueprints): add fact card video blueprint generator`
- Script generator is checkpoint-ready: `lib/scripts/`

Active local modules:

- `lib/source-facts/`
- `lib/blueprints/`
- `lib/scripts/`

Active product/spec sources:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Goal

Create the first local financial expression risk review structure for generated scripts, captions, descriptions, hashtags, and CTA copy.

This task is only local deterministic TypeScript scanning/validation. It must not call external data APIs, AI, TTS, video, DB, payment, deploy, upload, or ffmpeg services.

## Approved Scope

Allowed:

- Inspect `lib/source-facts/`, `lib/blueprints/`, and `lib/scripts/`.
- Add a small local risk/compliance module, preferably `lib/risk-review/` or `lib/compliance/`, if no better local pattern exists.
- Define local TypeScript types for risk review results and findings.
- Scan generated script package fields for risky financial expressions.
- Include initial blocked/high-risk patterns from `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`.
- Return deterministic findings with target field, matched text, risk level, message, and suggested safer wording where practical.
- Keep code small, reusable, and local.

Required detection examples:

- 매수하세요
- 무조건 오릅니다
- 수익 보장
- 급등 확정
- 지금 안 사면 늦습니다
- 100% 돈 법니다
- 이 종목 사면 됩니다

## Forbidden

- No external API calls.
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

- Risk review types are available from a clear local module.
- A deterministic helper can scan a `GeneratedScriptPackage`.
- Risky financial expressions are detected in narration, captions, title, description, hashtags, and CTA where applicable.
- Safe fixture package passes with low or unchecked findings as designed.
- Broken/risky sample package fails or returns high/blocked findings for the required examples.
- No external service integration is added.
- Focused type/check/test command passes, or a clear reason is reported if no check applies.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only if reusable implementation evidence should be preserved.
