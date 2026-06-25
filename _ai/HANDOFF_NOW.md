# Handoff Now

## Task ID

`money-shorts-os-manual-fact-card-form-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before package preview: `813a8f6 feat(fact-card-ui): add manual authoring screen`
- Latest completed local UI: `/fact-cards/manual/package-preview` Manual Fact Card -> Package Preview UI.
- Codex verification passed:
  - ESLint `app/fact-cards`: PASS
  - targeted TypeScript diagnostics for `app/fact-cards`: 0
  - forbidden pattern search: PASS
  - `/fact-cards/manual/package-preview` HTTP 200
  - core text rendered: `LOCAL PREVIEW ONLY`, `Package Preview`, `가계부채`, package id, mock approval notice
  - dev server stopped after verification

## Goal

Create a local in-browser Manual Fact Card draft form UI.

This should let the Owner type or edit a source-backed manual Fact Card draft and immediately see validation results locally. It must not persist data, call APIs, write clipboard, render media, or execute ffmpeg.

## Approved Scope

Allowed:

- Add a local route, suggested:
  - `app/fact-cards/manual/new/page.tsx`
  - optional route-local client component under `app/fact-cards/manual/new/`
- Use existing local source fact helper:
  - `lib/source-facts/manual.ts`
  - optional initial values from `lib/source-facts/manual-fixtures.ts`
- Render an editable local draft form for core manual fields.
- Support at least one citation row in the form.
- On local validation, show:
  - `ok=true/false`
  - validation errors with code/field/message
  - generated FactCard summary when valid
  - clear notice that no data is saved
- Link to `/fact-cards/manual` and `/fact-cards/manual/package-preview`.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Do not build DB save, API routes, package generation from arbitrary form data, real media, upload, or external source fetch.

## Required Behavior

- The form must start from explicit local draft values, not hidden auto-fill.
- Empty or invalid required fields must fail visibly.
- `citations: []` must fail with `manual_citation_required` through `authorManualFactCard`.
- The UI must not invent missing values.
- Source URL/date/citation fields must be visible and editable.
- The UI must distinguish "local validation only" from persistence or publishing.
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
- If practical, run a local dev server and verify `/fact-cards/manual/new` with HTTP/core text. Stop the server afterward.

## Definition of Done

- Manual Fact Card draft form route renders.
- Local validation shows valid and invalid states.
- Source/citation fields are visible and editable.
- No external/clipboard/render/DB/API action occurs.
- Focused checks pass, or any pre-existing unrelated failure is clearly isolated.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise manual form UI evidence because this turns the Owner input surface from fixture display into a local draft validation tool.
