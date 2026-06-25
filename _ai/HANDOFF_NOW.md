# Handoff Now

## Task ID

`money-shorts-os-content-package-assembler-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed local module: `lib/final-qa/`
- Final QA review-fix-2 passed Codex verification and is ready for local checkpoint commit.

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
- `lib/final-qa/`

## Goal

Create a local deterministic content package assembler that wires the existing source-first modules into one package object for a single mock short.

This is a local orchestration/data module only. It should not call external APIs, generate new facts, execute render commands, create media files, or touch `output/`.

The assembler should answer: "Given an existing valid Fact Card and local options, can we build a linked package chain from Fact Card through Final QA using existing local modules?"

## Approved Scope

Allowed:

- Add a new local module under `lib/content-package/`.
- Define package/result types that group the existing module outputs:
  - Fact Card
  - Video Blueprint
  - Script Package
  - Risk Review
  - Chart Card Package
  - Image Prompt Package
  - Voice/TTS Package
  - Recalculated Timeline
  - Render Manifest
  - Final QA Result
- Implement deterministic helper(s) that call existing local generators/validators.
- Use mock/measured audio duration passed in by options or fixture data; do not measure files.
- Add fixtures using existing mock Fact Cards.
- Add validation/helper output that preserves source/fact/citation linkage.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Suggested files:

- `lib/content-package/types.ts`
- `lib/content-package/assembler.ts`
- `lib/content-package/fixtures.ts`
- `lib/content-package/index.ts`

Optional only if useful:

- `lib/content-package/validation.ts`

## Required Behavior

- Deterministic: no `new Date()` unless `createdAt` is injected by options.
- No external calls.
- No AI generation.
- No media file probing.
- No ffmpeg execution.
- No render.
- No output file creation.
- No dependency changes.
- No new facts, numbers, captions, narration, or source references beyond existing local module outputs.
- Final QA should be run on the assembled package.

At minimum, the assembled package should expose:

- stable package id
- source Fact Card id(s)
- source citation id(s)
- blueprint id
- script package id
- risk review result
- chart card package id
- image prompt package id
- tts package id
- timeline id
- render manifest id
- final QA result

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

- ESLint for `lib/content-package/`
- TypeScript check targeted to `lib/content-package/` or source-first modules
- Runtime/sample check that verifies:
  - a valid mock Fact Card assembles into a package with `finalQa.readyForRender=true`
  - source/fact/citation ids are preserved across package summary fields
  - risk-blocked package or broken linkage causes final QA failure if such fixture is included
  - no command is executed and no files are created

## Definition of Done

- Content package module exports clear local types and deterministic assembler helper(s).
- Valid existing mock package chain can be assembled end-to-end through Final QA.
- Linkage ids are preserved and exposed in the package summary.
- Focused checks pass.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise content-package implementation evidence because this crosses multiple local module contracts.
