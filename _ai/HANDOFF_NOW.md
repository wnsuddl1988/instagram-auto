# Handoff Now

## Task ID

`money-shorts-os-manual-fact-card-authoring-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed local module: `lib/content-package/`
- Content Package Assembler review-fix-2 passed Codex verification and is ready for local checkpoint commit.

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

Create a local manual Fact Card authoring helper so an Owner-provided source/fact draft can be converted into a validated `FactCard` without external APIs.

This is the safe local input layer before future DB/UI work. It should not fetch sources, call AI, scrape webpages, or infer missing facts.

## Approved Scope

Allowed:

- Extend `lib/source-facts/` with a small local authoring/draft helper.
- Define a manual draft/input type if useful.
- Implement deterministic helper(s) that convert explicit Owner-provided fields into a `FactCard`.
- Add validation that catches missing source/citation/current value/data period/allowed claims/caution note.
- Add fixtures showing one valid manual draft and one broken draft.
- Update `lib/source-facts/index.ts` exports.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Suggested files:

- `lib/source-facts/manual.ts`
- `lib/source-facts/manual-fixtures.ts`

Optional only if useful:

- small additions to `lib/source-facts/types.ts`
- small additions to `lib/source-facts/validation.ts`

## Required Behavior

- Deterministic: no `new Date()` unless `createdAt` is injected by options.
- No external calls.
- No AI generation.
- No source scraping.
- No URL fetching.
- No DB writes.
- No dependency changes.
- Do not invent missing numbers, dates, source names, source URLs, claims, or citations.
- The helper should refuse or validation-fail incomplete input rather than filling facts creatively.

At minimum, helper output should preserve:

- fact card id
- source provider/name/url
- published date and data period
- indicator name/category
- current/previous/change values exactly as provided
- citations
- allowed claims and blocked claims
- caution note and interpretation

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

- ESLint for touched `lib/source-facts/` files
- TypeScript check targeted to `lib/source-facts/` or source-first modules
- Runtime/sample check that verifies:
  - valid manual draft becomes a valid `FactCard`
  - missing citation/source/current value fails validation
  - no generated value is invented for missing fields
  - resulting manual Fact Card can be passed into `assembleContentPackage` with mock measured duration and returns `finalQa.readyForRender=true`
  - no command is executed and no files are created

## Definition of Done

- Manual Fact Card authoring helper is exported from `lib/source-facts/`.
- Valid manual draft produces a valid source-linked Fact Card.
- Broken manual draft fails with useful codes/messages.
- The generated Fact Card can flow into the existing content package assembler.
- Focused checks pass.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise manual Fact Card authoring evidence because this creates the local input layer for the source-first pipeline.
