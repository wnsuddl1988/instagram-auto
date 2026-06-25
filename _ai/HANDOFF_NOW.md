# Handoff Now

## Task ID

`money-shorts-os-workflow-hub-ui-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before route nav: `9e22a59 feat(fact-card-ui): add sample form controls`
- Latest completed local UI: `/fact-cards/manual` route navigation polish.
- Codex verification passed:
  - ESLint `app/fact-cards/manual/page.tsx`: PASS
  - targeted TypeScript diagnostics for `app/fact-cards`: 0
  - forbidden pattern search: PASS
  - Claude HTTP verification: manual overview links to form, package preview, and package library

## Goal

Create a local Money Shorts OS workflow hub route.

The Owner should have one local entry screen for the source-first MVP workflow, linking the Fact Card overview, direct form input, package preview, and package library. This is a navigation/workbench shell only, not a new backend workflow.

## Approved Scope

Allowed:

- Add a local route, suggested:
  - `app/money-shorts/page.tsx`
- Use static local UI and existing route links only.
- Link to:
  - `/fact-cards/manual`
  - `/fact-cards/manual/new`
  - `/fact-cards/manual/package-preview`
  - `/packages`
- Show current source-first principle:
  - Fact Card first
  - no facts outside sources
  - local preview only
  - no publish/render/upload in this UI
- Keep visual style consistent with existing dark operational UI.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

## Required Behavior

- `/money-shorts` renders a clear MVP workflow hub.
- It must not call external services, APIs, DB, clipboard, render, or ffmpeg.
- It should make the current workflow order obvious:
  1. Fact Card overview
  2. Manual input form
  3. Package preview
  4. Package library/review
- Mobile and desktop layout should not overlap or squeeze text.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering.
- No actual media probing.
- No ECOS/KOSIS/OpenDART/FRED live API calls.
- No DB/Supabase reads, writes, migrations, or production data changes.
- No API route changes.
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
- If practical, run a local dev server and verify `/money-shorts` with HTTP/core text. Stop the server afterward.

## Definition of Done

- `/money-shorts` hub route renders.
- It links to all four local workflow routes.
- It explains local/source-first status without marketing fluff.
- No external/clipboard/render/DB/API action occurs.
- Focused checks pass, or any pre-existing unrelated failure is clearly isolated.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise workflow hub evidence because this creates the local MVP entry route.
