# Handoff Now

## Task ID

`money-shorts-os-manual-fact-card-form-sample-controls-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before form UI: `eb03a26 feat(fact-card-ui): add package preview route`
- Latest completed local UI: `/fact-cards/manual/new` Manual Fact Card Draft Form UI.
- Codex verification passed:
  - ESLint `app/fact-cards/manual/new`: PASS
  - targeted TypeScript diagnostics for `app/fact-cards`: 0
  - forbidden pattern search: PASS
  - `/fact-cards/manual/new` HTTP 200
  - core text rendered: `LOCAL VALIDATION ONLY`, `ok = false`, `manual_citation_required`, id-owner-input warning, Package Preview link
  - dev server stopped after verification

## Goal

Add explicit local sample controls to the Manual Fact Card form.

The form should still start blank, but the Owner should be able to intentionally load the existing valid household debt fixture into the form and reset back to blank. This proves both invalid and valid validation states without hidden auto-fill.

## Approved Scope

Allowed:

- Modify:
  - `app/fact-cards/manual/new/ManualFactCardFormClient.tsx`
  - optional `_ai/CLAUDE_REPORT.md` evidence update
- Use:
  - `validHouseholdDebtDraft` or equivalent exported fixture from `lib/source-facts/manual-fixtures.ts`
- Add explicit buttons, for example:
  - `샘플 불러오기`
  - `초기화`
- When sample is loaded:
  - form fields reflect the fixture values
  - validation becomes `ok=true`
  - generated FactCard summary is visible
- When reset is clicked:
  - form returns to blank local state
  - validation returns to `ok=false`
  - `manual_citation_required` is visible

Do not auto-load the fixture on page load.

## Required Behavior

- Initial state remains blank/local validation only.
- Sample loading is explicit Owner action.
- No field is invented outside the fixture.
- Citation id remains Owner/fixture-supplied only; no `Date.now`, random, sourceName fallback, or `citation-unnamed`.
- No external call or persistence.
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
  - `Date.now`
  - `Math.random`
  - `citation-unnamed`
- If practical, run a local dev server and verify `/fact-cards/manual/new` with HTTP/core text. Stop the server afterward.
- If practical, verify sample-load makes `ok=true` and reset returns to `ok=false`.

## Definition of Done

- Manual Fact Card form still starts blank with invalid state.
- Explicit sample load produces valid state and FactCard summary.
- Explicit reset returns to blank invalid state.
- No external/clipboard/render/DB/API action occurs.
- Focused checks pass, or any pre-existing unrelated failure is clearly isolated.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only with concise evidence if behavior or validation evidence materially changes.
