# Handoff Now

## Task ID

`money-shorts-os-manual-fact-card-ui-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before package UI: `647f1be feat(package-view): add package library view models`
- Latest completed local UI: `/packages` Package Library / Detail UI shell.
- Package Library UI is URL/searchParams-selected and does not depend on client hydration for row selection.
- Codex browser verification passed:
  - `/packages` default shows approved detail.
  - `/packages?selected=2` shows rejected detail.
  - `/packages?selected=3` shows approved-but-blocked detail.
  - Clicking row 2 navigates to rejected.
  - Clicking row 3 navigates to approved-but-blocked.
  - Desktop/mobile viewport had no horizontal overflow.
- `.claude/launch.json` exists but is ignored by git and must not be committed.

Active local source-first modules:

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
- `lib/review-packet/`
- `lib/owner-decision/`
- `lib/clipboard-payload/`
- `lib/package-view/`

## Goal

Create the first local Manual Fact Card authoring UI for Money Shorts OS.

This should let the Owner inspect/manual-author a source-backed Fact Card draft using existing local helpers. It must not persist data, call APIs, or generate scripts/videos.

## Approved Scope

Allowed:

- Inspect existing `/packages` UI patterns.
- Add a new local route, suggested:
  - `app/fact-cards/manual/page.tsx`
  - optional route-local component file under `app/fact-cards/manual/`
- Use existing local source facts helpers:
  - `lib/source-facts/manual.ts`
  - `lib/source-facts/manual-fixtures.ts`
  - `lib/source-facts/validation.ts`
- Render:
  - a valid manual draft example
  - validation result
  - resulting FactCard summary when valid
  - broken draft validation errors
  - citation/source fields clearly
- A simple local form is allowed only if it stays self-contained and does not write to DB, file, clipboard, or API. Prefer progressive/server-rendered behavior over fragile client-only state.
- Keep the UI dense, operational, and consistent with `/packages`.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Do not build the full package assembler workflow in this task.

## Required Behavior

- The screen must make it clear that Fact Card is the required first step.
- The valid fixture should show `ok=true` and a FactCard summary.
- The broken fixture should show `ok=false` and validation errors.
- No field should be invented or auto-filled beyond the provided draft data.
- Citations/source URL/date must be visible.
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

- Manual Fact Card authoring route renders local draft validation and FactCard summary.
- Valid and broken fixtures are both visible.
- No external/clipboard/render/DB/API action occurs.
- Focused checks pass, or any pre-existing unrelated failure is clearly isolated.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise Manual Fact Card UI evidence because this starts the Owner-facing input surface for source-first content.
