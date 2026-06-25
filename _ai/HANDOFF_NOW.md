# Handoff Now

## Task ID

`money-shorts-os-final-qa-model-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed local module: `lib/render-plan/`
- Render-plan checkpoint is Codex-reviewed and ready to be committed locally with no push.

Active local modules:

- `lib/source-facts/`
- `lib/blueprints/`
- `lib/scripts/`
- `lib/risk-review/`
- `lib/chart-cards/`
- `lib/image-prompts/`
- `lib/voice-profiles/`
- `lib/timeline/`
- `lib/render-plan/`

## Goal

Create a local deterministic final QA model/checklist runner for the source-first Money Shorts OS package chain.

This is not real rendered-video QA yet. It should validate the linked local package data we already have:

- Fact Card linkage
- Video Blueprint
- Script Package
- Risk Review result
- Chart Card Package
- Image Prompt Package
- Voice/TTS Package
- Recalculated Timeline
- Render Manifest

The module should answer: "Is this local content package structurally ready to move toward a future render step?"

## Approved Scope

Allowed:

- Add a new local module under `lib/final-qa/`.
- Define QA result/checklist types.
- Implement deterministic helper(s) that aggregate existing validation results and cross-package invariants.
- Add fixtures that reuse existing mock packages from source-first modules.
- Add lightweight validation for required package ids, factCardIds, citation ids, duration/timeline/render linkage, risk status, and source attribution presence.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Suggested files:

- `lib/final-qa/types.ts`
- `lib/final-qa/checker.ts`
- `lib/final-qa/fixtures.ts`
- `lib/final-qa/index.ts`

Optional only if useful:

- `lib/final-qa/validation.ts`

## Required Behavior

- No external calls.
- No AI generation.
- No media file probing.
- No ffmpeg execution.
- No render.
- No output file creation.
- No dependency changes.
- No new facts, numbers, captions, or narration.
- Use existing local package fields only.

At minimum, QA should check:

- Package ids are non-empty.
- Fact Card ids and source citation ids are non-empty and preserved across Blueprint/Script/Timeline/Render Manifest where available.
- Script validation is OK for the provided package.
- Risk review is not blocked.
- Chart card validation is OK when chart package is provided.
- Image prompt validation is OK when image prompt package is provided.
- Voice profile/TTS validation is OK.
- Timeline validation is OK and duration matches render plan duration.
- Render manifest validation is OK.
- Render manifest uses relative placeholder output paths only.
- Captions/render overlays have non-empty text and scene linkage.

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

## Required Checks

Run focused checks only:

- ESLint for `lib/final-qa/`
- TypeScript check targeted to `lib/final-qa/` or source-first modules
- Runtime/sample check that verifies:
  - a valid local mock package returns QA ok
  - blocked/high-risk package behavior is reported clearly
  - broken linkage or broken render/timeline duration fails
  - no command is executed and no files are created

## Definition of Done

- Final QA module exports clear local types and deterministic checker helper(s).
- Valid existing mock package chain passes.
- Broken mock cases fail with useful codes/messages.
- Source linkage and duration invariants are checked across modules.
- Focused checks pass.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise final-qa implementation evidence because this crosses multiple local module contracts.
