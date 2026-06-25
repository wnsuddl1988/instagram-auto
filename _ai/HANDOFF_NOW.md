# Handoff Now

## Task ID

`money-shorts-os-manual-fact-card-to-package-preview-ui-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before manual UI: `4d264cb feat(package-ui): add local package library route`
- Latest completed local UI: `/fact-cards/manual` Manual Fact Card authoring UI.
- Codex verification passed:
  - ESLint `app/fact-cards`: PASS
  - targeted TypeScript diagnostics for `app/fact-cards`: 0
  - forbidden pattern search: PASS
  - `/fact-cards/manual` HTTP 200
  - Playwright PASS: valid/broken draft text, source/citation fields, validation errors, desktop/mobile no horizontal overflow
  - dev server stopped after verification

## Goal

Create a local deterministic preview UI that shows how a valid manual Fact Card becomes a source-first content package.

This is a read-only preview bridge from manual Fact Card authoring into the existing local pipeline. It must not persist data, call APIs, render media, or execute ffmpeg.

## Approved Scope

Allowed:

- Add a local route, suggested:
  - `app/fact-cards/manual/package-preview/page.tsx`
- Use only existing local modules and fixtures:
  - `lib/source-facts/manual-fixtures.ts`
  - `lib/content-package/assembler.ts`
  - `lib/review-packet/`
  - `lib/owner-decision/`
  - `lib/clipboard-payload/`
  - `lib/package-view/`
- Use the valid manual draft/result as input.
- Show a compact, readable pipeline preview:
  - Fact Card summary
  - Blueprint id / duration / scene count
  - Script package summary
  - Risk review summary
  - Final QA readiness
  - Review packet / owner gate / clipboard readiness if generated locally
  - package view-style status summary if useful
- Use deterministic local options only, for example fixed `videoId`, `contentPackageId`, `createdAt`, and mock/measured audio duration.
- Link back to `/fact-cards/manual` and `/packages`.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Do not build real generation, real media, upload, DB, or external source fetch.

## Required Behavior

- The preview must start from `validHouseholdDebtResult.factCard`.
- If the valid manual FactCard is missing unexpectedly, render a clear local error state instead of inventing data.
- All displayed facts/numbers/source fields must come from the FactCard or deterministic downstream local modules.
- The screen must make source linkage visible.
- The screen must distinguish "local preview only" from real publish/render.
- No external call or persistence.
- Mobile and desktop layout should not overlap or squeeze text.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering.
- No actual media probing.
- No ECOS/KOSIS/OpenDART/FRED live API calls.
- No DB/Supabase reads, writes, migrations, or production data changes.
- No API route changes unless Codex explicitly approves later.
- No API key/env/secret changes.
- No dependency or lockfile changes.
- No OS clipboard writes.
- No file export/write.
- No upload/post/deploy.
- No git push.
- No commit unless Codex explicitly authorizes it later.
- Do not touch `output/`.
- Do not reuse retired Candidate10/Jun/static slideshow/old Money Architect routes, assets, prompts, or references.

## Required Checks

Run focused checks:

- ESLint for changed route files.
- TypeScript check targeted to changed files, or full `pnpm exec tsc --noEmit --pretty false` with clear note if it only fails on pre-existing `output/` binary `.ts` files.
- Search changed files for forbidden calls:
  - clipboard APIs
  - `fetch(`
  - `/api/`
  - ffmpeg/render/upload/post/deploy references
  - `output/`
- If practical, run a local dev server and verify the route visually/with HTTP. Stop the server afterward.

## Definition of Done

- Manual valid Fact Card -> local package preview route renders.
- Source/fact/package/QA/risk linkage is visible.
- No external/clipboard/render/DB/API action occurs.
- Focused checks pass, or any pre-existing unrelated failure is clearly isolated.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise package preview UI evidence because this connects the Owner input surface to the source-first package workflow.
