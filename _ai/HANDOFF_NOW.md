# Handoff Now

## Task ID

`money-shorts-os-review-packet-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed local module: `lib/source-facts/manual.ts` / `lib/source-facts/manual-fixtures.ts`
- Manual Fact Card authoring review-fix passed Codex verification and is ready for local checkpoint commit.

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
- `lib/content-package/`

## Goal

Create a local deterministic Owner review packet module from an assembled content package.

This is a read-only review/approval layer before any future UI, DB, render, upload, or publishing work. It should summarize the already assembled package so the Owner can review source facts, citations, risk, script, QA, and planned render metadata without opening every module object.

## Approved Scope

Allowed:

- Add a new local module under `lib/review-packet/`.
- Define review packet types.
- Implement deterministic helper(s) that transform an `AssembledContentPackage` into a compact review packet.
- Include only facts/ids/text already present in the content package.
- Include sections such as:
  - package summary ids
  - Fact Card source/citation summary
  - Blueprint summary
  - Script narration/captions/SNS copy summary
  - Risk review summary
  - Chart/image/TTS/timeline/render manifest ids
  - Final QA summary and failed checks
  - Owner decision placeholders such as `needsOwnerApproval: true`
- Add fixtures using existing `inflationContentPackage30` or manual authoring package.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Suggested files:

- `lib/review-packet/types.ts`
- `lib/review-packet/generator.ts`
- `lib/review-packet/fixtures.ts`
- `lib/review-packet/index.ts`

Optional only if useful:

- `lib/review-packet/validation.ts`

## Required Behavior

- Deterministic: no `new Date()` unless `createdAt` is injected by options.
- No external calls.
- No AI generation.
- No source scraping or URL fetching.
- No DB writes.
- No file export/write.
- No render.
- No output file creation.
- No new facts, numbers, claims, citations, narration, captions, or source references.
- If the content package Final QA is not ready, the review packet must surface that clearly.

At minimum, the review packet should expose:

- reviewPacketId
- contentPackageId
- source/fact/citation ids
- source URL(s)
- title/topic/core message
- final QA readiness and failed check codes
- risk level / blocked flag / finding count
- planned duration and render manifest id
- owner decision fields initialized to pending/null

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

- ESLint for `lib/review-packet/`
- TypeScript check targeted to `lib/review-packet/` or source-first modules
- Runtime/sample check that verifies:
  - valid content package creates a review packet
  - packet preserves package/fact/citation/source ids
  - packet reports `finalQa.readyForRender=true` for valid package
  - a broken/not-ready package surfaces failed QA codes
  - no command is executed and no files are created

## Definition of Done

- Review packet module exports clear local types and deterministic helper(s).
- Valid content package produces a compact review packet with source linkage and QA/risk summaries.
- Broken/not-ready package surfaces failed readiness clearly.
- Focused checks pass.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise review packet evidence because this creates the local Owner review layer.
